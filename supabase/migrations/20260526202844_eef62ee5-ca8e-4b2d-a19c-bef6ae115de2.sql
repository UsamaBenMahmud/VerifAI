
-- Promote admin
UPDATE public.profiles SET is_admin = true WHERE email = 'omahmud59@gmail.com';

-- Public read for presentations folder
CREATE POLICY "Public read presentations folder"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = 'presentations');

-- Admin write for presentations folder
CREATE POLICY "Admins upload presentations"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'presentations'
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins update presentations"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'presentations'
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins delete presentations"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'presentations'
  AND public.is_admin(auth.uid())
);
