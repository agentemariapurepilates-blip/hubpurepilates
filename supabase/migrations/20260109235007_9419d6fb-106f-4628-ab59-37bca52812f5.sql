-- Add new columns for LinkedIn-style news cards
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS target_month date;