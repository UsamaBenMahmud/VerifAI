
-- 1) Fix PRIVILEGE_ESCALATION: prevent users from elevating is_admin or role
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.is_admin IS DISTINCT FROM OLD.is_admin) THEN
    IF current_setting('request.jwt.claims', true)::jsonb->>'role' <> 'service_role' THEN
      RAISE EXCEPTION 'Changing role or is_admin is not permitted';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS prevent_role_change_trg ON public.profiles;
CREATE TRIGGER prevent_role_change_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();

-- Belt-and-suspenders: revoke column-level UPDATE on sensitive columns
REVOKE UPDATE (role, is_admin) ON public.profiles FROM authenticated, anon;

-- 2) Fix EXPOSED_SENSITIVE_DATA: hide admin/operational columns from non-admin readers
REVOKE SELECT ON public.analyses FROM anon, authenticated;
GRANT SELECT (
  id, user_id, image_url, original_filename, file_size_bytes,
  trust_score, fake_probability, real_probability, verdict, verdict_bn,
  confidence, model_version, explanation_en, explanation_bn,
  analysis_time_ms, created_at, expires_at, content_type, is_visible, category
) ON public.analyses TO anon, authenticated;

-- 3) Fix MISSING_STORAGE_RLS: lock down 'uploads' bucket
DROP POLICY IF EXISTS "uploads_select_own" ON storage.objects;
DROP POLICY IF EXISTS "uploads_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "uploads_update_own" ON storage.objects;
DROP POLICY IF EXISTS "uploads_delete_own" ON storage.objects;

CREATE POLICY "uploads_select_own" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "uploads_insert_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "uploads_update_own" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "uploads_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4) Fix SECURITY DEFINER executable: revoke EXECUTE from public roles for our app-defined definer fns
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_role_change() FROM anon, authenticated, public;
-- is_admin is referenced from RLS policies; Postgres evaluates the function with the policy owner's privileges,
-- so revoking EXECUTE from end-user roles does not break RLS checks.
