-- Add portrait image URL to characters
ALTER TABLE characters ADD COLUMN portrait_url TEXT;

-- Create storage bucket for portraits (public read)
INSERT INTO storage.buckets (id, name, public) VALUES ('portraits', 'portraits', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous uploads to portraits bucket
CREATE POLICY "anon_upload_portraits" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'portraits');

-- Allow public read from portraits bucket
CREATE POLICY "public_read_portraits" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'portraits');
