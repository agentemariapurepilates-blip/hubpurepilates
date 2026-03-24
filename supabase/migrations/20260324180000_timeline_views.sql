
CREATE TABLE public.timeline_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(month_key, user_id)
);

ALTER TABLE public.timeline_views ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read view counts
CREATE POLICY "Authenticated can view timeline views"
  ON public.timeline_views FOR SELECT
  USING (true);

-- Authenticated users can insert their own view
CREATE POLICY "Users can insert own timeline view"
  ON public.timeline_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for fast counting
CREATE INDEX idx_timeline_views_month ON public.timeline_views(month_key);
