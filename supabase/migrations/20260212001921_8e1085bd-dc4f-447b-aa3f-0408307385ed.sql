-- Create the vibe-music storage bucket (public so audio URLs are accessible)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vibe-music', 'vibe-music', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read files (public playback)
CREATE POLICY "Public read access for vibe-music"
ON storage.objects FOR SELECT
USING (bucket_id = 'vibe-music');

-- Allow anyone to upload files (no auth required for this app)
CREATE POLICY "Public upload access for vibe-music"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vibe-music');

-- Allow anyone to delete their uploads
CREATE POLICY "Public delete access for vibe-music"
ON storage.objects FOR DELETE
USING (bucket_id = 'vibe-music');