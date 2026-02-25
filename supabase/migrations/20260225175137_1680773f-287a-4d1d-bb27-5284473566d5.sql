
CREATE TABLE public.timeline_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key text UNIQUE NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  published_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.timeline_visibility ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "Authenticated can view timeline visibility"
  ON public.timeline_visibility FOR SELECT
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert timeline visibility"
  ON public.timeline_visibility FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Admins can update timeline visibility"
  ON public.timeline_visibility FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default row for March 2026 as unpublished
INSERT INTO public.timeline_visibility (month_key, is_published) VALUES ('2026-03', false);
