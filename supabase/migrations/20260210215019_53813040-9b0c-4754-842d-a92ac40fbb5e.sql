
-- Create materiais_implantacao table
CREATE TABLE public.materiais_implantacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.materiais_implantacao ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view
CREATE POLICY "Everyone can view materiais_implantacao"
ON public.materiais_implantacao
FOR SELECT
USING (true);

-- Only admins and implantacao sector users can insert
CREATE POLICY "Admins and implantacao can insert materiais"
ON public.materiais_implantacao
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.sector = 'implantacao'
  )
);

-- Only admins and implantacao sector users can update
CREATE POLICY "Admins and implantacao can update materiais"
ON public.materiais_implantacao
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.sector = 'implantacao'
  )
);

-- Only admins and implantacao sector users can delete
CREATE POLICY "Admins and implantacao can delete materiais"
ON public.materiais_implantacao
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.sector = 'implantacao'
  )
);

-- Create storage bucket for materiais images
INSERT INTO storage.buckets (id, name, public) VALUES ('materiais-implantacao', 'materiais-implantacao', true);

-- Storage policies
CREATE POLICY "Anyone can view materiais-implantacao files"
ON storage.objects FOR SELECT
USING (bucket_id = 'materiais-implantacao');

CREATE POLICY "Admins and implantacao can upload materiais files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'materiais-implantacao'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.sector = 'implantacao'
    )
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_materiais_implantacao_updated_at
BEFORE UPDATE ON public.materiais_implantacao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
