
-- Drop overly permissive upload and delete policies
DROP POLICY IF EXISTS "Public upload access" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access" ON storage.objects;

-- Allow only authenticated users to upload, restricted to audio file extensions
CREATE POLICY "Authenticated upload audio only"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vibe-music'
  AND (storage.extension(name) IN ('mp3', 'wav', 'ogg', 'm4a', 'flac', 'webm'))
);

-- Allow only authenticated users to delete their own uploads (files under their uid folder)
CREATE POLICY "Authenticated delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vibe-music'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
