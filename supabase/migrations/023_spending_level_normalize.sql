BEGIN;

-- Backfill legacy tier labels to canonical $N form.
UPDATE public.characters SET spending_level = '$7'  WHERE spending_level = 'Przeciętny';
UPDATE public.characters SET spending_level = '$25' WHERE spending_level = 'Zamożny';
UPDATE public.characters SET spending_level = '$2'  WHERE spending_level = 'Biedny';

-- Defensive: trim whitespace on any other rows (no-op if already clean).
UPDATE public.characters
  SET spending_level = TRIM(spending_level)
  WHERE spending_level IS NOT NULL AND spending_level != TRIM(spending_level);

-- CHECK constraint: NULL OR empty string OR canonical $N form (integer or decimal).
ALTER TABLE public.characters
  ADD CONSTRAINT spending_level_canonical
  CHECK (spending_level IS NULL OR spending_level = '' OR spending_level ~ '^\$[0-9]+(\.[0-9]+)?$');

COMMIT;
