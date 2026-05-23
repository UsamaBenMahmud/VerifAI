-- Prevent users from escalating their own role via UPDATE on profiles.
-- RLS WITH CHECK cannot reference OLD, so enforce via a BEFORE UPDATE trigger.

CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow only the service role (server-side admin) to change roles.
    IF current_setting('request.jwt.claims', true)::jsonb->>'role' <> 'service_role' THEN
      RAISE EXCEPTION 'Changing role is not permitted';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_change ON public.profiles;
CREATE TRIGGER profiles_prevent_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();

-- Also tighten the UPDATE policy with an explicit WITH CHECK on ownership.
DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;
CREATE POLICY "users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);