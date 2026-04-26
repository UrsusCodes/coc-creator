-- Auto-assign player_id when a character is created/updated with an invite_code_id
-- that is assigned to a player via player_codes.
-- This prevents orphaned characters when players use the wizard without being logged in.

-- Trigger function: auto-set player_id from player_codes junction table
CREATE OR REPLACE FUNCTION auto_assign_player_id()
RETURNS TRIGGER AS $$
DECLARE
  found_player_id UUID;
BEGIN
  -- Only act if player_id is null and invite_code_id is set
  IF NEW.player_id IS NULL AND NEW.invite_code_id IS NOT NULL THEN
    SELECT pc.player_id INTO found_player_id
    FROM player_codes pc
    WHERE pc.invite_code_id = NEW.invite_code_id
    LIMIT 1;

    IF found_player_id IS NOT NULL THEN
      NEW.player_id := found_player_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fire on INSERT and UPDATE
CREATE TRIGGER characters_auto_assign_player
  BEFORE INSERT OR UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_player_id();

-- Fix existing orphaned characters: set player_id from player_codes
UPDATE characters c
SET player_id = pc.player_id
FROM player_codes pc
WHERE c.invite_code_id = pc.invite_code_id
  AND c.player_id IS NULL;
