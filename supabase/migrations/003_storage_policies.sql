-- =============================================
-- STORAGE POLICIES
-- =============================================
-- Version: 1.0
-- Description: Policies for ticket-attachments bucket
-- =============================================

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload files
-- We use a generic policy for now, relying on the public bucket setting for downloads
-- and authenticated role for uploads.
CREATE POLICY "Authenticated users can upload ticket attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  auth.role() = 'authenticated'
);

-- 3. Allow authenticated users to select/download files
CREATE POLICY "Authenticated users can view ticket attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ticket-attachments');

-- 4. Allow users to update their own files (optional, but good for completeness)
CREATE POLICY "Users can update own ticket attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ticket-attachments' AND owner = auth.uid())
WITH CHECK (bucket_id = 'ticket-attachments' AND owner = auth.uid());

-- 5. Allow users to delete their own files
CREATE POLICY "Users can delete own ticket attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ticket-attachments' AND owner = auth.uid());
