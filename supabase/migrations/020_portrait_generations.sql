-- Portrait generation log — backs the per-player rate limit on
-- `POST /player/characters/:id/generate-portrait` (1 req / 30 s, max 5 / 24 h).
-- One row per request (not per image): a request that produced 3 master
-- images × 4 styles = 12 gallery entries still counts as 1 row here.
-- Spec: docs/CoCCreator_obsidian/specs/portrait_prompt_methodology.md

CREATE TABLE IF NOT EXISTS portrait_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

  -- Form choices (analytics; not used at runtime)
  clothing_chip TEXT
    CHECK (clothing_chip IN ('niedbale', 'codzienne', 'eleganckie', 'zawodowe')),
  background_chip_id TEXT,
  lighting_chip TEXT
    CHECK (lighting_chip IN ('hollywood', 'natural', 'noir')),

  -- Free-text overrides (which 5 fields were active + their content)
  field_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  korekty TEXT,

  -- Counts
  master_count INT NOT NULL DEFAULT 2
    CHECK (master_count BETWEEN 1 AND 3),
  succeeded_count INT NOT NULL DEFAULT 0
    CHECK (succeeded_count >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hot path: count rows for a given player_id within the last 24h / 30s.
CREATE INDEX IF NOT EXISTS idx_portrait_gen_player_time
  ON portrait_generations(player_id, created_at DESC);

-- Admin/debug filter by character.
CREATE INDEX IF NOT EXISTS idx_portrait_gen_character
  ON portrait_generations(character_id);
