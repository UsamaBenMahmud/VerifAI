
-- Analyses table
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  image_url TEXT NOT NULL,
  original_filename TEXT,
  file_size_bytes INTEGER,
  trust_score INTEGER CHECK (trust_score BETWEEN 0 AND 100),
  fake_probability NUMERIC(5,4),
  real_probability NUMERIC(5,4),
  verdict TEXT,
  verdict_bn TEXT,
  confidence INTEGER,
  model_version TEXT,
  explanation_en TEXT,
  explanation_bn TEXT,
  analysis_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "users read own or anonymous analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Public dashboard view (no PII)
CREATE VIEW public.public_analyses
WITH (security_invoker = true) AS
SELECT id, trust_score, verdict, verdict_bn, confidence, created_at
FROM public.analyses
WHERE created_at > now() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 100;

GRANT SELECT ON public.public_analyses TO anon, authenticated;

-- Storage bucket for uploads (private; signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public uploads to uploads bucket"
  ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "public reads from uploads bucket"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'uploads');
