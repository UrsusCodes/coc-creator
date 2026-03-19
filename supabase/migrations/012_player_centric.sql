-- ============================================================
-- 012: Player-centric model — edit permissions, drafts, assignment
-- ============================================================

-- Edit permissions table (replaces share-token-based edit links for player accounts)
CREATE TABLE IF NOT EXISTS edit_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  edit_mode TEXT NOT NULL CHECK (edit_mode IN ('standard', 'full')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(character_id)
);

CREATE INDEX IF NOT EXISTS idx_edit_perm_player ON edit_permissions(player_id);
CREATE INDEX IF NOT EXISTS idx_edit_perm_expires ON edit_permissions(expires_at);

ALTER TABLE edit_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_edit_permissions" ON edit_permissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Make invite_code_id optional (admin drafts may not need a code)
ALTER TABLE characters ALTER COLUMN invite_code_id DROP NOT NULL;

-- Draft metadata
ALTER TABLE characters ADD COLUMN IF NOT EXISTS draft_locked_step INTEGER DEFAULT NULL;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'player';

-- Store perks and max_skill_value on character (needed for draft continuation)
ALTER TABLE characters ADD COLUMN IF NOT EXISTS perks JSONB DEFAULT '[]';
ALTER TABLE characters ADD COLUMN IF NOT EXISTS max_skill_value INTEGER DEFAULT 80;
