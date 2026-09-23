-- Liberação episódio a episódio de "Os segredos de Pilar".
--
-- Antes a série inteira era publicada de uma vez (uma linha em
-- timeline_visibility). Agora a aba fica disponível para todo mundo e cada
-- vídeo é solto individualmente pelo admin: quem não está nesta tabela aparece
-- como "Em breve" para o franqueado.
--
-- A chave é o id do arquivo no Drive, que é o que identifica o episódio na
-- listagem da pasta (ver supabase/functions/segredos-pilar-episodios).
--
-- Aplicar pelo SQL Editor ou pela Management API. Nunca `supabase db push`:
-- o histórico remoto de migrations está vazio.

CREATE TABLE IF NOT EXISTS public.segredos_pilar_liberacoes (
  drive_id text PRIMARY KEY,
  liberado_em timestamptz NOT NULL DEFAULT now(),
  liberado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.segredos_pilar_liberacoes ENABLE ROW LEVEL SECURITY;

-- Todo mundo logado precisa saber o que já está liberado (é o que a tela usa
-- para decidir entre tocar e mostrar "Em breve").
DROP POLICY IF EXISTS "Logado ve as liberacoes" ON public.segredos_pilar_liberacoes;
CREATE POLICY "Logado ve as liberacoes"
  ON public.segredos_pilar_liberacoes FOR SELECT TO authenticated USING (true);

-- Só admin libera e só admin volta atrás.
DROP POLICY IF EXISTS "Admin libera episodio" ON public.segredos_pilar_liberacoes;
CREATE POLICY "Admin libera episodio"
  ON public.segredos_pilar_liberacoes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin retira liberacao" ON public.segredos_pilar_liberacoes;
CREATE POLICY "Admin retira liberacao"
  ON public.segredos_pilar_liberacoes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- O dump da migração de abril não trouxe os GRANTs do schema public.
GRANT SELECT, INSERT, DELETE ON public.segredos_pilar_liberacoes TO authenticated;
GRANT ALL ON public.segredos_pilar_liberacoes TO service_role;
