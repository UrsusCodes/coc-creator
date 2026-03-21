-- Edit System v2: add 'lore' level, allow NULL expires_at (until disabled)
ALTER TABLE edit_permissions DROP CONSTRAINT IF EXISTS edit_permissions_edit_mode_check;
ALTER TABLE edit_permissions ADD CONSTRAINT edit_permissions_edit_mode_check
  CHECK (edit_mode IN ('lore', 'standard', 'full'));
ALTER TABLE edit_permissions ALTER COLUMN expires_at DROP NOT NULL;
