-- Create post_likes table for reactions
CREATE TABLE public.post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_likes
CREATE POLICY "Likes are viewable by authenticated users"
ON public.post_likes FOR SELECT
USING (true);

CREATE POLICY "Users can add likes"
ON public.post_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
ON public.post_likes FOR DELETE
USING (auth.uid() = user_id);

-- Add sector field to profiles
ALTER TABLE public.profiles 
ADD COLUMN sector text;