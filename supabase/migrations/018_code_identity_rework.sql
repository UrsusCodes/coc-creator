-- Code identity rework:
-- 1) Invite codes gain label, reroll_budget, assigned_player_id (inline quick-assign shortcut).
-- 2) Characters gain rerolls_remaining, characteristics_committed_at, reroll_history.
-- 3) Per-player uniqueness on distinguisher.
-- 4) Backfill so existing codes/characters match the new semantics without a data break.

-- ============================================================
-- invite_codes: new columns
-- ============================================================
ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS label TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reroll_budget INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_player_id UUID REFERENCES players(id) ON DELETE SET NULL;

-- Backfill reroll_budget from legacy max_tries.
-- New semantic: reroll_budget = number of rerolls AFTER initial roll.
-- Legacy: max_tries was "how many character attempts" — one attempt already covers initial roll,
-- so remaining N-1 attempts become N-1 rerolls.
UPDATE invite_codes
SET reroll_budget = GREATEST(0, COALESCE(max_tries, 1) - 1)
WHERE reroll_budget = 0;

CREATE INDEX IF NOT EXISTS idx_invite_codes_assigned_player
  ON invite_codes(assigned_player_id);

-- ============================================================
-- characters: new columns for server-authoritative commitment
-- ============================================================
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS rerolls_remaining INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS characteristics_committed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reroll_history JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Backfill characteristics_committed_at for characters that already have non-empty characteristics.
-- These are treated as "already committed" so the new rejection-of-characteristic-writes in
-- the edge function doesn't break in-flight drafts (e.g., Rafał's current draft).
UPDATE characters
SET characteristics_committed_at = created_at
WHERE characteristics_committed_at IS NULL
  AND characteristics IS NOT NULL
  AND characteristics != '{}'::jsonb;

-- ============================================================
-- Indexes supporting the new code-list UX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_characters_invite_code_id_status
  ON characters(invite_code_id, status);

-- Per-player uniqueness of distinguisher, ignoring blank strings
-- so existing characters without a distinguisher don't collide.
CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_player_distinguisher_unique
  ON characters(player_id, distinguisher)
  WHERE distinguisher <> '' AND player_id IS NOT NULL;

-- ============================================================
-- RPC: atomic grant-reroll (admin) and decrement-reroll (player)
-- ============================================================
CREATE OR REPLACE FUNCTION grant_reroll(character_id UUID, amount INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  new_remaining INTEGER;
BEGIN
  UPDATE characters
  SET rerolls_remaining = rerolls_remaining + amount
  WHERE id = character_id
  RETURNING rerolls_remaining INTO new_remaining;
  RETURN new_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION consume_reroll(character_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_remaining INTEGER;
BEGIN
  UPDATE characters
  SET rerolls_remaining = rerolls_remaining - 1
  WHERE id = character_id
    AND rerolls_remaining > 0
  RETURNING rerolls_remaining INTO new_remaining;

  IF new_remaining IS NULL THEN
    RAISE EXCEPTION 'No rerolls remaining for character %', character_id;
  END IF;

  RETURN new_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
