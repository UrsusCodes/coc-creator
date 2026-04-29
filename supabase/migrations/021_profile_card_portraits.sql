-- Split portrait_url into two distinct fields:
--   profile_portrait_url      — full image, used as in-app avatar (no crop)
--   card_portrait_url         — image used in PDF card export
--   card_portrait_crop_data   — crop region (% based) for the card image
--
-- The legacy `portrait_url` + `portrait_crop_data` columns stay in place as
-- deprecated; they are kept for backward-compatibility while UI / PDF export
-- migrate to the new fields. They can be dropped in a later migration once
-- nothing references them.
--
-- Spec: docs/CoCCreator_obsidian/specs/portrait_prompt_methodology.md

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS profile_portrait_url TEXT;

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS card_portrait_url TEXT;

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS card_portrait_crop_data JSONB;

-- Backfill from legacy fields so existing characters don't visually lose
-- their current portrait. Safe to run multiple times — only updates rows
-- that have a legacy URL set AND haven't already been backfilled.
UPDATE characters
SET
  profile_portrait_url = portrait_url,
  card_portrait_url = portrait_url,
  card_portrait_crop_data = portrait_crop_data
WHERE
  portrait_url IS NOT NULL
  AND profile_portrait_url IS NULL
  AND card_portrait_url IS NULL;
