DROP POLICY IF EXISTS "Authenticated users can upload presentations" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update presentations" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete presentations" ON storage.objects;

CREATE POLICY "Presentations upload by authenticated"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'presentations');

CREATE POLICY "Presentations update by authenticated"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'presentations')
WITH CHECK (bucket_id = 'presentations');

CREATE POLICY "Presentations delete by authenticated"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'presentations');