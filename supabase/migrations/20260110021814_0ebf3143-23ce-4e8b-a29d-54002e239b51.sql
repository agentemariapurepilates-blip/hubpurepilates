-- Add video_url column to posts table for embedded videos
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url TEXT;