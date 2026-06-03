-- supabase/migrations/024_wild_west_era.sql
BEGIN;

ALTER TABLE public.invite_codes
  DROP CONSTRAINT IF EXISTS invite_codes_era_check;

ALTER TABLE public.invite_codes
  ADD CONSTRAINT invite_codes_era_check
  CHECK (era IN ('classic_1920s', 'modern', 'gaslight', 'wild_west'));

COMMIT;
