
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('answer','session')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports insertable by all" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports readable by all" ON public.reports FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.share_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('answer','session')),
  target_id uuid NOT NULL,
  referrer text,
  ua text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.share_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "share_clicks insertable by all" ON public.share_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "share_clicks readable by all" ON public.share_clicks FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_share_clicks_target ON public.share_clicks(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_answers_session ON public.answers(session_id);
