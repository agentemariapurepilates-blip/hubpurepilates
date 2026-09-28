-- Quem já assistiu cada episódio de "Os segredos de Pilar".
--
-- Contagem POR PESSOA, não por abertura (pedido do usuário em 28/09/2026): a
-- chave primária é (drive_id, user_id), então reabrir o mesmo episódio não soma
-- de novo. A tela grava com upsert ignorando duplicado.
--
-- O que dá para saber: quem ABRIU o episódio. Como o vídeo toca pelo player do
-- Drive dentro de um iframe, o Hub não recebe o progresso e não tem como dizer
-- se a pessoa assistiu até o fim.
--
-- Só colaborador/admin lê (o relatório é interno). Franqueado só grava a própria
-- linha e não vê a lista de ninguém.
--
-- Aplicar pelo SQL Editor ou pela Management API. Nunca `supabase db push`:
-- o histórico remoto de migrations está vazio.

CREATE TABLE IF NOT EXISTS public.segredos_pilar_views (
  drive_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visto_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (drive_id, user_id)
);

CREATE INDEX IF NOT EXISTS segredos_pilar_views_drive_idx ON public.segredos_pilar_views (drive_id);

ALTER TABLE public.segredos_pilar_views ENABLE ROW LEVEL SECURITY;

-- Cada um registra a própria visualização.
DROP POLICY IF EXISTS "Logado grava a propria visualizacao" ON public.segredos_pilar_views;
CREATE POLICY "Logado grava a propria visualizacao"
  ON public.segredos_pilar_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- O relatório é da sede: colaborador e admin veem tudo.
DROP POLICY IF EXISTS "Colaborador ve as visualizacoes" ON public.segredos_pilar_views;
CREATE POLICY "Colaborador ve as visualizacoes"
  ON public.segredos_pilar_views FOR SELECT TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- O dump da migração de abril não trouxe os GRANTs do schema public.
GRANT SELECT, INSERT ON public.segredos_pilar_views TO authenticated;
GRANT ALL ON public.segredos_pilar_views TO service_role;
