-- Optional ceilings configurable per invite code:
--   max_wealth — upper bound on creditRating (skill `majetnosc`).
--                When set, hard occupation-range validation in the wizard
--                is replaced with a soft warning. Final allocation cannot
--                exceed this value.
--   max_luck   — upper bound applied server-side to the /roll-luck result
--                (3d6×5, or max of two for young investigators 15-19).
--
-- Both are NULL by default → no ceiling, existing behaviour preserved.
-- Mirrored onto `characters` at /start-character so the wizard and the
-- /roll-luck endpoint can read them without an extra join (same pattern
-- as era / perks / max_skill_value).

ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS max_wealth INTEGER,
  ADD COLUMN IF NOT EXISTS max_luck   INTEGER;

ALTER TABLE invite_codes
  ADD CONSTRAINT invite_codes_max_wealth_range
    CHECK (max_wealth IS NULL OR (max_wealth BETWEEN 0 AND 99));

ALTER TABLE invite_codes
  ADD CONSTRAINT invite_codes_max_luck_range
    CHECK (max_luck IS NULL OR (max_luck BETWEEN 0 AND 99));

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS max_wealth INTEGER,
  ADD COLUMN IF NOT EXISTS max_luck   INTEGER;
