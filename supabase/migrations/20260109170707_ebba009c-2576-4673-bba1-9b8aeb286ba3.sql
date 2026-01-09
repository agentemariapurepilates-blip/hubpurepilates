-- Adicionar colunas de aprovação na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requested_user_type user_type DEFAULT NULL;

-- Atualizar usuários existentes como aprovados (para não quebrar acesso atual)
UPDATE public.profiles SET is_approved = true WHERE is_approved IS NULL OR is_approved = false;

-- Criar índice para buscar usuários pendentes
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON public.profiles(is_approved);