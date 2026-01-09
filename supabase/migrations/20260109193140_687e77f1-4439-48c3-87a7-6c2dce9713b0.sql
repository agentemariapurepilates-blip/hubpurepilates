-- Create enum for social media content tags
CREATE TYPE public.social_media_tag AS ENUM ('reels', 'desafio_semana', 'carrossel');

-- Add tag column to social_media_content
ALTER TABLE public.social_media_content 
ADD COLUMN tag public.social_media_tag DEFAULT NULL;

-- Add posting_date column (single date instead of start_date/end_date for social media)
ALTER TABLE public.social_media_content 
ADD COLUMN posting_date date DEFAULT NULL;

-- Migrate existing data: copy start_date to posting_date
UPDATE public.social_media_content SET posting_date = start_date WHERE posting_date IS NULL;