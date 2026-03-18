-- Art prompt and gallery for character portraits
ALTER TABLE characters ADD COLUMN art_prompt TEXT;
ALTER TABLE characters ADD COLUMN art_gallery JSONB DEFAULT '[]';
-- art_gallery format: [{ "url": "...", "label": "...", "created_at": "..." }]
