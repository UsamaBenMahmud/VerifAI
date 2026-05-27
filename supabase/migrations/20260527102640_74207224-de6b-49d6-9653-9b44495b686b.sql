-- Remove stale/conflicting storage policies that referenced the old uploads/presentations folder
DROP POLICY IF EXISTS "Admins upload presentations" ON storage.objects;
DROP POLICY IF EXISTS "Admins update presentations" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete presentations" ON storage.objects;
DROP POLICY IF EXISTS "Public read presentations folder" ON storage.objects;

-- Ensure the presentations bucket is public for read
UPDATE storage.buckets SET public = true WHERE id = 'presentations';