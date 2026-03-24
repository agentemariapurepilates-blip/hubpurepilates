CREATE TABLE IF NOT EXISTS public.timeline_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month_key, user_id)
);

ALTER TABLE public.timeline_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own views"
  ON public.timeline_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all views"
  ON public.timeline_views FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update their own views"
  ON public.timeline_views FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);