
-- pgvector for future RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. Extend analyses table
-- ============================================================
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS human_verdict TEXT DEFAULT 'unreviewed',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'unclassified',
  ADD COLUMN IF NOT EXISTS source_domain TEXT,
  ADD COLUMN IF NOT EXISTS source_credibility_score INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hf_latency_ms INTEGER,
  ADD COLUMN IF NOT EXISTS claude_latency_ms INTEGER;

CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_trust_score ON public.analyses(trust_score);
CREATE INDEX IF NOT EXISTS idx_analyses_visible ON public.analyses(is_visible) WHERE is_visible = true;

-- ============================================================
-- 2. Extend profiles table
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS analyses_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill full_name from display_name where missing
UPDATE public.profiles SET full_name = display_name WHERE full_name IS NULL AND display_name IS NOT NULL;

-- ============================================================
-- 3. Admin helper (avoid recursive RLS on profiles)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND (is_admin = true OR role = 'admin')
  );
$$;

-- ============================================================
-- 4. Presentations table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID,
  title TEXT NOT NULL DEFAULT 'VerifAI Presentation',
  description TEXT,
  slide_count INTEGER DEFAULT 0,
  slide_image_urls TEXT[] DEFAULT '{}',
  original_filename TEXT,
  file_size_bytes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT ON public.presentations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.presentations TO authenticated;
GRANT ALL ON public.presentations TO service_role;

ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads active presentation" ON public.presentations;
CREATE POLICY "Anyone reads active presentation"
  ON public.presentations FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage presentations" ON public.presentations;
CREATE POLICY "Admins manage presentations"
  ON public.presentations FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- 5. Public feed view
-- ============================================================
CREATE OR REPLACE VIEW public.public_feed
WITH (security_invoker = on) AS
SELECT
  a.id,
  a.trust_score,
  a.verdict,
  a.verdict_bn,
  a.confidence,
  a.category,
  a.source_domain,
  a.source_credibility_score,
  a.human_verdict,
  a.created_at
FROM public.analyses a
WHERE a.is_visible = true
  AND a.created_at > NOW() - INTERVAL '30 days'
ORDER BY a.created_at DESC
LIMIT 200;

GRANT SELECT ON public.public_feed TO anon, authenticated;

-- ============================================================
-- 6. RLS policies on analyses
-- ============================================================
GRANT SELECT, INSERT ON public.analyses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;

DROP POLICY IF EXISTS "Anyone can submit analysis" ON public.analyses;
CREATE POLICY "Anyone can submit analysis"
  ON public.analyses FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage analyses" ON public.analyses;
CREATE POLICY "Admins manage analyses"
  ON public.analyses FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- 7. Profiles admin read policy
-- ============================================================
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 8. Update handle_new_user to also set full_name
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
