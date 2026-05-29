
-- Reports of suspicious analyses
CREATE TABLE public.analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL,
  reporter_id UUID,
  reporter_email TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.analysis_reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analysis_reports TO authenticated;
GRANT ALL ON public.analysis_reports TO service_role;

ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a report"
  ON public.analysis_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins read reports"
  ON public.analysis_reports FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins manage reports"
  ON public.analysis_reports FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_analysis_reports_analysis_id ON public.analysis_reports(analysis_id);
CREATE INDEX idx_analysis_reports_created_at ON public.analysis_reports(created_at DESC);

-- Add pptx/pdf download URLs to presentations
ALTER TABLE public.presentations
  ADD COLUMN IF NOT EXISTS pptx_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;
