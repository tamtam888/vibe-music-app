
-- Drop authenticated-only policies
DROP POLICY IF EXISTS "Authenticated upload audio only" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete own files" ON storage.objects;

-- Restore public upload/delete
CREATE POLICY "Public upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vibe-music');

CREATE POLICY "Public delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'vibe-music');
