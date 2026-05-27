INSERT INTO storage.buckets (id, name, public) VALUES ('presentations', 'presentations', true) ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Presentations are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'presentations');

CREATE POLICY "Authenticated users can upload presentations"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'presentations');

CREATE POLICY "Authenticated users can update presentations"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'presentations');

CREATE POLICY "Authenticated users can delete presentations"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'presentations');