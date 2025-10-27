-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-files', 'media-files', true);

-- Create RLS policies for media files bucket
CREATE POLICY "Allow public access to media files"
ON storage.objects FOR SELECT
USING (bucket_id = 'media-files');

CREATE POLICY "Allow authenticated uploads to media files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media-files');

CREATE POLICY "Allow authenticated updates to media files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media-files');

CREATE POLICY "Allow authenticated deletes from media files"
ON storage.objects FOR DELETE
USING (bucket_id = 'media-files');