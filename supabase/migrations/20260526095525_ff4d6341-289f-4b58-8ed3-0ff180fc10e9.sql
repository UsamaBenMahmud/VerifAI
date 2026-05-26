
DROP POLICY IF EXISTS "anyone can insert analyses" ON public.analyses;
DROP POLICY IF EXISTS "public uploads to uploads bucket" ON storage.objects;
DROP POLICY IF EXISTS "public reads from uploads bucket" ON storage.objects;
