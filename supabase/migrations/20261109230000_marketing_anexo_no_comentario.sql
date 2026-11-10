-- Projetos do marketing (pedido de 09/11/2026):
-- 1) Arquivo enviado pelo chat: vai para os anexos do item, ligado ao comentário
--    em que subiu (dá para ver quem mandou o quê). Enviado direto nos anexos,
--    fica sem comentário. Apagar o comentário mantém o arquivo nos anexos.
-- 2) Comentário pode ser só o arquivo, sem texto.
-- 3) Subtarefa só dentro do projeto: o banco recusa subtarefa de subtarefa.

ALTER TABLE public.marketing_anexos
  ADD COLUMN IF NOT EXISTS comentario_id uuid NULL REFERENCES public.marketing_comentarios(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS marketing_anexos_comentario_idx ON public.marketing_anexos (comentario_id);

ALTER TABLE public.marketing_comentarios DROP CONSTRAINT IF EXISTS marketing_comentarios_texto_check;
ALTER TABLE public.marketing_comentarios ALTER COLUMN texto SET DEFAULT '';

-- O arquivo que sobe no chat já aparece no comentário; não repete no histórico.
CREATE OR REPLACE FUNCTION public.marketing_anexos_historico()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.comentario_id IS NULL THEN
    INSERT INTO marketing_atividade (item_id, autor_id, campo, para) VALUES (NEW.item_id, auth.uid(), 'anexo', NEW.nome);
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.marketing_itens_um_nivel()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.item_pai_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM marketing_itens WHERE id = NEW.item_pai_id AND item_pai_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Subtarefa só pode ficar dentro de um projeto, não de outra subtarefa.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS marketing_itens_um_nivel ON public.marketing_itens;
CREATE TRIGGER marketing_itens_um_nivel
  BEFORE INSERT OR UPDATE OF item_pai_id ON public.marketing_itens
  FOR EACH ROW EXECUTE FUNCTION public.marketing_itens_um_nivel();
