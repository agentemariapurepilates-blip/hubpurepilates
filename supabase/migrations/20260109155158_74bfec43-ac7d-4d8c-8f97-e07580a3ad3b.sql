-- Criar enum para tipo de usuário
CREATE TYPE public.user_type AS ENUM ('colaborador', 'franqueado');

-- Adicionar coluna user_type na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN user_type public.user_type DEFAULT 'colaborador';

-- Criar tabela social_media_content
CREATE TABLE public.social_media_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  google_drive_url TEXT,
  content_type TEXT DEFAULT 'video',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.social_media_content ENABLE ROW LEVEL SECURITY;

-- Policies para social_media_content
CREATE POLICY "Content viewable by authenticated" 
ON public.social_media_content
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Only colaboradores can insert content" 
ON public.social_media_content
FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_type = 'colaborador'
  )
);

CREATE POLICY "Creator or admin can update content" 
ON public.social_media_content
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creator or admin can delete content" 
ON public.social_media_content
FOR DELETE TO authenticated 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_social_media_content_updated_at
BEFORE UPDATE ON public.social_media_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela social_media_comments
CREATE TABLE public.social_media_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.social_media_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.social_media_comments ENABLE ROW LEVEL SECURITY;

-- Policies para social_media_comments
CREATE POLICY "Comments viewable by authenticated" 
ON public.social_media_comments
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Authenticated can add comments" 
ON public.social_media_comments
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own comments or admin can delete" 
ON public.social_media_comments
FOR DELETE TO authenticated 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_media_content;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_media_comments;