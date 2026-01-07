-- Enable realtime for posts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- Enable realtime for comments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER TABLE public.comments REPLICA IDENTITY FULL;

-- Enable realtime for post_likes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER TABLE public.post_likes REPLICA IDENTITY FULL;