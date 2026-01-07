-- First, add the new sector values to the enum
ALTER TYPE sector_type ADD VALUE IF NOT EXISTS 'consultoras';
ALTER TYPE sector_type ADD VALUE IF NOT EXISTS 'implantacao';

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for authenticated users to upload images
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'post-images' AND auth.uid() IS NOT NULL);

-- Create policy for public to view images
CREATE POLICY "Post images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-images');

-- Create policy for users to delete their own images
CREATE POLICY "Users can delete their own post images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'post-images' AND auth.uid() IS NOT NULL);