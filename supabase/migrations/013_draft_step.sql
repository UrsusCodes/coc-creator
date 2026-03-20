-- Add draft_step column to track wizard progress for server-side draft sync
ALTER TABLE characters ADD COLUMN IF NOT EXISTS draft_step INTEGER DEFAULT NULL;
