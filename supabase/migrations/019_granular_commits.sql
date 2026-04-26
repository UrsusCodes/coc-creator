-- Migration 019 — Granular per-step commits (additive to 018).
--
-- Adds per-step commit timestamps + swap state + edu_rolls so the wizard's
-- pre-occupation flow can be server-authoritative on a per-step basis instead
-- of one monolithic characteristics_committed_at.
--
-- Strictly additive: no DROP, no RENAME, no NOT NULL on existing columns.
-- Safe to apply with active drafts in flight (they get backfilled to "as if
-- committed" semantics so the new flow doesn't reject in-flight state).

-- ============================================================
-- Schema additions on `characters`
-- ============================================================
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS swap_committed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS age_committed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS edu_committed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS aging_committed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS luck_committed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS swap_available BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS swap_used BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS edu_rolls JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ============================================================
-- Backfill swap_available from the linked code's perks
-- ============================================================
-- swap_available reflects whether the player CAN swap (perk on the code),
-- not whether they DID. Existing characters inherit this from their code.
UPDATE characters c
SET swap_available = TRUE
FROM invite_codes ic
WHERE c.invite_code_id = ic.id
  AND ic.perks IS NOT NULL
  AND ic.perks @> '["swap_characteristics"]'::jsonb;

-- ============================================================
-- Backfill commit timestamps for SUBMITTED characters
-- ============================================================
-- Submitted chars pre-019 are fully committed by definition. Backfill all
-- five timestamps to created_at via COALESCE so post-submit edit rules
-- (which read these timestamps) apply uniformly.
UPDATE characters
SET
  age_committed_at    = COALESCE(age_committed_at,    created_at),
  edu_committed_at    = COALESCE(edu_committed_at,    created_at),
  aging_committed_at  = COALESCE(aging_committed_at,  created_at),
  luck_committed_at   = COALESCE(luck_committed_at,   created_at)
WHERE status = 'submitted';

-- swap_committed_at intentionally stays NULL on submitted chars where
-- swap was never used (we don't know the historical decision moment).
-- Only set it where swap_used would be true — but on legacy data we have
-- no way to tell. Leaving NULL is correct: it just means "swap timestamp
-- unknown", which has no behavioural effect post-submit.

-- ============================================================
-- Backfill commit timestamps for DRAFT characters in flight
-- ============================================================
-- For drafts: backfill timestamps based on populated state. A draft that
-- already has age set is treated as having committed age, etc. This keeps
-- in-flight drafts (Rafał's current draft) from being rejected by the new
-- flow when they resume.
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT * FROM characters WHERE status = 'draft' LOOP
    -- characteristics committed if non-empty
    IF rec.characteristics IS NOT NULL
       AND rec.characteristics::TEXT != '{}'
       AND rec.characteristics_committed_at IS NULL
    THEN
      UPDATE characters
      SET characteristics_committed_at = created_at
      WHERE id = rec.id;
    END IF;

    -- age committed if > 0
    IF rec.age IS NOT NULL AND rec.age > 0 AND rec.age_committed_at IS NULL THEN
      UPDATE characters SET age_committed_at = created_at WHERE id = rec.id;
    END IF;

    -- luck committed if > 0
    IF rec.luck IS NOT NULL AND rec.luck > 0 AND rec.luck_committed_at IS NULL THEN
      UPDATE characters SET luck_committed_at = created_at WHERE id = rec.id;
    END IF;

    -- edu/aging: if age is committed AND occupation is filled, treat as
    -- both edu and aging done (those are the steps that gate occupation).
    IF rec.age IS NOT NULL AND rec.age > 0
       AND rec.occupation_id IS NOT NULL
       AND rec.occupation_id != ''
    THEN
      UPDATE characters
      SET
        edu_committed_at   = COALESCE(edu_committed_at,   created_at),
        aging_committed_at = COALESCE(aging_committed_at, created_at)
      WHERE id = rec.id;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- TOCTOU index: one active draft per code
-- ============================================================
-- Pre-flight invariant (must return 0 rows; check before applying):
--   SELECT invite_code_id, count(*) FROM characters
--    WHERE status='draft' GROUP BY 1 HAVING count(*)>1;
--
-- Partial unique so submitted chars don't collide with new drafts on
-- the same code (and historic data with multi-attempt codes pre-rework
-- isn't blocked retroactively).
CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_one_per_code_active
  ON characters(invite_code_id)
  WHERE status = 'draft' AND invite_code_id IS NOT NULL;

-- ============================================================
-- RPC: atomic append to reroll_history
-- ============================================================
-- Replaces read-modify-write pattern (race-prone) with a single UPDATE
-- using JSONB || concatenation.
CREATE OR REPLACE FUNCTION append_reroll_history(character_id UUID, entry JSONB)
RETURNS JSONB AS $$
DECLARE
  new_history JSONB;
BEGIN
  UPDATE characters
  SET reroll_history = reroll_history || entry
  WHERE id = character_id
  RETURNING reroll_history INTO new_history;
  RETURN new_history;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
