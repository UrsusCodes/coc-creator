-- Player accounts (admin-managed, simple auth)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  login TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_players" ON players
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Junction: which invite codes are assigned to which player
CREATE TABLE player_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  invite_code_id UUID NOT NULL REFERENCES invite_codes(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, invite_code_id)
);

CREATE INDEX idx_player_codes_player ON player_codes(player_id);

ALTER TABLE player_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_player_codes" ON player_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Link characters to player accounts
ALTER TABLE characters ADD COLUMN player_id UUID REFERENCES players(id) ON DELETE SET NULL;
CREATE INDEX idx_characters_player ON characters(player_id);

-- Pending edits (player proposes, admin approves/rejects)
CREATE TABLE pending_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  proposed_data JSONB NOT NULL,
  change_comment TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_pending_edits_character ON pending_edits(character_id);
CREATE INDEX idx_pending_edits_status ON pending_edits(status);

-- Only one pending edit per character at a time
CREATE UNIQUE INDEX idx_one_pending_per_character
  ON pending_edits(character_id) WHERE status = 'pending';

ALTER TABLE pending_edits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_pending_edits" ON pending_edits
  FOR ALL TO service_role USING (true) WITH CHECK (true);
