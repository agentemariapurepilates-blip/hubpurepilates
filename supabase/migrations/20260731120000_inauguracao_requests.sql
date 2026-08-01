-- Inauguracoes: solicitacoes feitas pelo colaborador com os dados de uma
-- unidade que vai inaugurar, para o marketing montar a campanha sem precisar
-- buscar a informacao por conversa.
--
-- A regra de alteracao (colaborador so edita/exclui ate 48h antes da
-- inauguracao; admin sempre) existe em DOIS lugares: aqui, na RLS, e em
-- `src/features/colaborador/inauguracoes/lib/prazo.ts`, no frontend. O banco
-- e a autoridade -- a regra abaixo e a que vale de verdade; a do frontend
-- existe so para a tela poder explicar antes de o usuario tentar.
--
-- `data_inauguracao` e uma data, sem hora. A ancora usada para transformar
-- isso num instante e: a inauguracao comeca as 00:00 em Sao Paulo. O Brasil
-- nao tem horario de verao desde 2019, entao o deslocamento -03:00 (usado no
-- TypeScript) e o fuso 'America/Sao_Paulo' (usado aqui) dao sempre o mesmo
-- resultado.

CREATE TABLE public.inauguracao_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  nome_unidade      text NOT NULL,
  unidade_id        text NOT NULL,
  endereco          text NOT NULL,
  solicitante_nome  text NOT NULL,
  solicitante_email text NOT NULL,
  data_inauguracao  date NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX inauguracao_requests_user_id_idx ON public.inauguracao_requests (user_id);
CREATE INDEX inauguracao_requests_data_idx    ON public.inauguracao_requests (data_inauguracao);

CREATE TRIGGER update_inauguracao_requests_updated_at
  BEFORE UPDATE ON public.inauguracao_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.inauguracao_requests ENABLE ROW LEVEL SECURITY;

-- Colaborador ve as suas; admin ve todas.
CREATE POLICY "Ve as proprias, admin ve todas"
  ON public.inauguracao_requests FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- So colaborador (ou admin) cria, e sempre em seu proprio nome.
CREATE POLICY "Colaborador cria em seu nome"
  ON public.inauguracao_requests FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (public.is_colaborador(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  );

-- A regra das 48h vive aqui.
--
-- WITH CHECK explicito de proposito: sem ele, o Postgres reusaria a expressao
-- do USING tambem para validar a linha NOVA, o que bloquearia o colaborador de
-- ANTECIPAR a data de inauguracao para dentro da janela das 48h (o UPDATE
-- falharia mesmo tendo comecado dentro do prazo). Antecipar deve ser permitido
-- -- e justamente a informacao que o marketing precisa saber rapido, e essa
-- tela existe para eliminar a necessidade de procurar o marketing por
-- conversa. Quem estava no prazo no momento da edicao tem o direito de mudar
-- a data, inclusive para uma data mais proxima.
--
-- O WITH CHECK abaixo exige so a propriedade da linha (nao o prazo), o que
-- preserva a outra funcao que o USING/CHECK implicito cumpriria: impedir
-- `UPDATE ... SET user_id = <outro>` para transferir a linha para outra
-- pessoa.
CREATE POLICY "Edita ate 48h antes; admin sempre"
  ON public.inauguracao_requests FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      user_id = auth.uid()
      AND now() < (data_inauguracao::timestamp AT TIME ZONE 'America/Sao_Paulo') - interval '48 hours'
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR user_id = auth.uid()
  );

CREATE POLICY "Exclui ate 48h antes; admin sempre"
  ON public.inauguracao_requests FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      user_id = auth.uid()
      AND now() < (data_inauguracao::timestamp AT TIME ZONE 'America/Sao_Paulo') - interval '48 hours'
    )
  );

COMMENT ON TABLE public.inauguracao_requests IS
  'Solicitacoes feitas pelo colaborador com os dados de uma unidade que vai inaugurar, para o marketing montar a campanha.';
COMMENT ON COLUMN public.inauguracao_requests.data_inauguracao IS
  'Data (sem hora) da inauguracao. A inauguracao comeca as 00:00 em Sao Paulo; o prazo de alteracao do colaborador fecha 48h antes disso (ver as policies de UPDATE/DELETE).';
COMMENT ON COLUMN public.inauguracao_requests.unidade_id IS
  'ID da unidade em texto livre -- nao ha vinculo com a tabela dpp_units nem com o cadastro de unidades.';
