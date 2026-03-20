-- Add missing residence and birthplace columns
ALTER TABLE characters ADD COLUMN IF NOT EXISTS residence TEXT DEFAULT '';
ALTER TABLE characters ADD COLUMN IF NOT EXISTS birthplace TEXT DEFAULT '';
