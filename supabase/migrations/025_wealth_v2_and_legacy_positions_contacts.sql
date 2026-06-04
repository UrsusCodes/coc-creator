-- supabase/migrations/025_wealth_v2_and_legacy_positions_contacts.sql
--
-- Fixes production reroll error: "Could not find 'assets_breakdown' column
-- of 'characters' in the schema cache". Eight columns were written by the
-- /save-character and /commit-character edge fns (DRAFT_ALLOWLIST +
-- DOWNSTREAM_WIPE cascade payloads) and present on CharacterData (TS),
-- but never created in any migration — surfaced when reroll exercised
-- the full write path in prod.
--
-- lifestyle_rating typed as numeric: src/data/wealthV2.ts#calcStarRating
-- returns half-step floats (Math.round(raw * 2) / 2 → 0, 0.5, 1, …, 5.0),
-- so integer would truncate. All columns nullable, no backfill, no CHECKs.

BEGIN;

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS assets_breakdown            JSONB   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS equipment_catalogs_available JSONB  DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS lifestyle_stars             TEXT,
  ADD COLUMN IF NOT EXISTS lifestyle_label             TEXT,
  ADD COLUMN IF NOT EXISTS spending_free               TEXT,
  ADD COLUMN IF NOT EXISTS lifestyle_rating            NUMERIC,
  ADD COLUMN IF NOT EXISTS positions                   JSONB   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS contacts                    JSONB   DEFAULT '[]'::jsonb;

COMMIT;
