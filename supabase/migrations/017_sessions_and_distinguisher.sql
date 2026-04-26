-- Add sessions (JSONB array of session name strings) and distinguisher (short text label)
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS sessions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS distinguisher TEXT DEFAULT '';
