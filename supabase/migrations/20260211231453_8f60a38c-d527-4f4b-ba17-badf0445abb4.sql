CREATE POLICY "Users can update their own comments"
ON public.demand_comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);