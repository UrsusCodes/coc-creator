-- Per-code roll options: fine-grained control over how the server rolls the
-- eight characteristics for a given invite code, on the first roll and on each
-- subsequent reroll.
--
-- Shape (all keys optional; NULL column = default behaviour preserved):
--   {
--     "initial": <profile>,
--     "rerolls": [<profile>, <profile>, ...]   -- indexed per reroll (0 = first)
--   }
--   profile = {
--     "chars":  { "STR": { "fixed": 65 } | { "min": 50, "max": 90 }, ... },
--     "avgMin": <int|null>,   -- lower bound on the mean of all eight
--     "avgMax": <int|null>    -- upper bound on the mean of all eight
--   }
--
-- Resolution is entirely server-side (edge function `player`), so nothing about
-- the values ships to the client bundle — only the generic engine does. NULL by
-- default → unconstrained 3d6×5 / (2d6+6)×5 exactly as before.

ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS roll_options JSONB;
