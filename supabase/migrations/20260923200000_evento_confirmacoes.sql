-- Confirmação de presença dos colaboradores em evento, com sorteio de turma.
--
-- O sorteio é EQUILIBRADO e roda no banco, não no navegador: quem confirma cai
-- na turma que estiver com menos gente e, no empate, é sorteio mesmo. Fazer isso
-- no cliente deixaria a pessoa escolher a própria turma e, com duas confirmações
-- ao mesmo tempo, as duas leriam a mesma contagem — daí o advisory lock.
--
-- Não existe policy de INSERT de propósito: a única porta de entrada é a função
-- confirmar_presenca_evento(), que é SECURITY DEFINER.
--
-- Aplicar pelo SQL Editor ou pela Management API. Nunca `supabase db push`:
-- o histórico remoto de migrations está vazio.

CREATE TABLE IF NOT EXISTS public.evento_confirmacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identifica o evento, para a mesma tabela servir aos próximos.
  evento text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL CHECK (length(btrim(nome)) > 1),
  whatsapp text NOT NULL CHECK (length(btrim(whatsapp)) > 7),
  turma text NOT NULL CHECK (turma IN ('A', 'B')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  -- Uma confirmação por pessoa por evento.
  UNIQUE (evento, user_id)
);

CREATE INDEX IF NOT EXISTS evento_confirmacoes_evento_idx
  ON public.evento_confirmacoes (evento, criado_em DESC);

ALTER TABLE public.evento_confirmacoes ENABLE ROW LEVEL SECURITY;

-- A lista de quem vai é aberta entre colaboradores (o evento é deles).
DROP POLICY IF EXISTS "Colaborador ve as confirmacoes" ON public.evento_confirmacoes;
CREATE POLICY "Colaborador ve as confirmacoes"
  ON public.evento_confirmacoes FOR SELECT TO authenticated
  USING (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Só admin remove alguém da lista (troca de última hora, nome duplicado).
DROP POLICY IF EXISTS "Admin remove confirmacao" ON public.evento_confirmacoes;
CREATE POLICY "Admin remove confirmacao"
  ON public.evento_confirmacoes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

/**
 * Confirma a presença de quem está logado e devolve a turma sorteada.
 * Chamar de novo não re-sorteia: devolve a confirmação que já existe.
 */
CREATE OR REPLACE FUNCTION public.confirmar_presenca_evento(
  _evento text,
  _nome text,
  _whatsapp text
)
RETURNS public.evento_confirmacoes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _linha public.evento_confirmacoes;
  _a integer;
  _b integer;
  _turma text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'É preciso estar logado no Hub para confirmar presença.';
  END IF;

  -- Mesmo critério de acesso da tela (ProtectedRoute requireColaborador):
  -- colaborador entra, e admin também, para conseguir testar antes do dia.
  IF NOT (public.is_colaborador(_uid) OR public.has_role(_uid, 'admin')) THEN
    RAISE EXCEPTION 'Este evento é só para colaboradores.';
  END IF;

  SELECT * INTO _linha
  FROM public.evento_confirmacoes
  WHERE evento = _evento AND user_id = _uid;

  IF FOUND THEN
    RETURN _linha;
  END IF;

  -- Segura as confirmações simultâneas deste evento até o fim da transação.
  PERFORM pg_advisory_xact_lock(hashtext(_evento));

  SELECT
    count(*) FILTER (WHERE turma = 'A'),
    count(*) FILTER (WHERE turma = 'B')
  INTO _a, _b
  FROM public.evento_confirmacoes
  WHERE evento = _evento;

  _turma := CASE
    WHEN _a < _b THEN 'A'
    WHEN _b < _a THEN 'B'
    ELSE (ARRAY['A', 'B'])[1 + floor(random() * 2)::integer]
  END;

  INSERT INTO public.evento_confirmacoes (evento, user_id, nome, whatsapp, turma)
  VALUES (_evento, _uid, btrim(_nome), btrim(_whatsapp), _turma)
  RETURNING * INTO _linha;

  RETURN _linha;
END;
$$;

-- O dump da migração de abril não trouxe os GRANTs do schema public.
GRANT SELECT, DELETE ON public.evento_confirmacoes TO authenticated;
GRANT ALL ON public.evento_confirmacoes TO service_role;
REVOKE ALL ON FUNCTION public.confirmar_presenca_evento(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.confirmar_presenca_evento(text, text, text) TO authenticated;

-- A lista da tela anda sozinha conforme o pessoal confirma.
ALTER TABLE public.evento_confirmacoes REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'evento_confirmacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.evento_confirmacoes;
  END IF;
END $$;
