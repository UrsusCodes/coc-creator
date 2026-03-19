-- Portrait crop data on characters
ALTER TABLE characters ADD COLUMN IF NOT EXISTS portrait_crop_data JSONB;
-- portrait_crop_data format: { "x": 10, "y": 5, "width": 80, "height": 90 }
-- values are percentages (0-100) of the original image dimensions

-- Portrait feedback table: player sends portrait back with comments
CREATE TABLE IF NOT EXISTS portrait_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  variant_url TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  reference_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending_fix'
    CHECK (status IN ('pending_fix', 'in_progress', 'resolved')),
  admin_comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_portrait_feedback_character ON portrait_feedback(character_id);
CREATE INDEX IF NOT EXISTS idx_portrait_feedback_status ON portrait_feedback(status);
CREATE INDEX IF NOT EXISTS idx_portrait_feedback_player ON portrait_feedback(player_id);
