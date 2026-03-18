-- Add positions and contacts columns to characters table
-- These were collected in the wizard but never persisted to the database
ALTER TABLE characters ADD COLUMN main_position JSONB;
ALTER TABLE characters ADD COLUMN additional_positions JSONB DEFAULT '[]';
ALTER TABLE characters ADD COLUMN contacts_v2 JSONB DEFAULT '[]';
