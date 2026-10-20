-- Cada vez que alguém assiste até o fim um vídeo das apresentações da aba Avisos.
--
-- O vídeo da apresentação "Updates de Marketing" (20/10/2026) pode ser
-- assistido até 3 vezes por pessoa (pedido da usuária em 20/10/2026). Cada
-- visualização completa grava UMA linha; a tela conta as linhas da pessoa e,
-- chegando ao limite, não toca mais.
--
-- Só INSERT e SELECT: sem UPDATE/DELETE, ninguém consegue zerar a própria
-- contagem. Cada um lê só as próprias linhas; colaborador/admin leem todas,
-- para o relatório da sede.
--
-- Aplicar pelo SQL Editor ou pela Management API. Nunca `supabase db push`:
-- o histórico remoto de migrations está vazio.

CREATE TABLE IF NOT EXISTS public.avisos_videos_assistidos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  video_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assistido_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS avisos_videos_assistidos_video_user_idx
  ON public.avisos_videos_assistidos (video_id, user_id);

ALTER TABLE public.avisos_videos_assistidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Logado grava o proprio video assistido" ON public.avisos_videos_assistidos;
CREATE POLICY "Logado grava o proprio video assistido"
  ON public.avisos_videos_assistidos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Logado ve o proprio, colaborador ve todos" ON public.avisos_videos_assistidos;
CREATE POLICY "Logado ve o proprio, colaborador ve todos"
  ON public.avisos_videos_assistidos FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_colaborador(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- O dump da migração de abril não trouxe os GRANTs do schema public.
GRANT SELECT, INSERT ON public.avisos_videos_assistidos TO authenticated;
GRANT ALL ON public.avisos_videos_assistidos TO service_role;
