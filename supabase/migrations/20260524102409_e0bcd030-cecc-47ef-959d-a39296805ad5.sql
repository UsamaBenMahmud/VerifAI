CREATE TABLE public.submission_links (
  key text PRIMARY KEY,
  url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.submission_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read submission links"
  ON public.submission_links FOR SELECT
  USING (true);

CREATE POLICY "admins can insert submission links"
  ON public.submission_links FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admins can update submission links"
  ON public.submission_links FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO public.submission_links(key) VALUES
  ('youtube'),('github'),('demo'),('figma'),
  ('huggingface'),('api_docs'),('n8n');