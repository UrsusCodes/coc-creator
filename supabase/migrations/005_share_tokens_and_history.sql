-- Share tokens for public character access (view/edit links)
CREATE TABLE share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('view', 'edit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_share_tokens_token ON share_tokens(token);
CREATE INDEX idx_share_tokens_character ON share_tokens(character_id);

ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_share_tokens" ON share_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Character version history (snapshots)
CREATE TABLE character_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  changed_by TEXT NOT NULL,
  change_comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_character_history_character ON character_history(character_id);
CREATE INDEX idx_character_history_created ON character_history(created_at DESC);

ALTER TABLE character_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_character_history" ON character_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);
