-- Verba para campanha de recrutamento de novos professores.
--
-- Pedido do franqueado, aprovado por colaborador ou admin. Mesmo caminho de
-- midia_adicional_requests, do pedido a aprovacao, e mesmas colunas (com os
-- status ja simplificados para pendente/aprovada) -- menos o plano, que aqui
-- vira valor livre (valor_verba) e quantidade de professores. Tabela propria
-- porque aquela tem CHECK nos tres planos fixos.
--
-- NAO APLICADA AINDA.
--
-- Duas travas a mais que a tabela da Midia Adicional nao tem:
-- - O INSERT exige status 'pendente'. Sem isso, qualquer usuario logado poderia
--   gravar direto pela API um pedido ja "aprovado".
-- - O UPDATE de colaborador/admin tem WITH CHECK no status, para nao sair do
--   dominio mesmo que alguem contorne a tela.

CREATE TABLE public.verba_professores_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  nome_franqueado text NOT NULL CHECK (length(nome_franqueado) BETWEEN 1 AND 200),
  nome_unidade text NOT NULL CHECK (length(nome_unidade) BETWEEN 1 AND 200),
  data_inauguracao date NOT NULL,

  -- Reais inteiros. Os limites repetem os de supabase/functions/send-verba-professores/pedido.ts.
  valor_verba integer NOT NULL CHECK (valor_verba BETWEEN 1 AND 1000000),
  qtd_professores integer NOT NULL CHECK (qtd_professores BETWEEN 1 AND 50),

  email_unidade text NOT NULL,
  email_franqueado text,

  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX verba_professores_requests_user_id_idx
  ON public.verba_professores_requests (user_id);

CREATE INDEX verba_professores_requests_created_at_idx
  ON public.verba_professores_requests (created_at DESC);

CREATE TRIGGER verba_professores_requests_set_updated_at
  BEFORE UPDATE ON public.verba_professores_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.verba_professores_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve seus proprios pedidos de verba para professores"
  ON public.verba_professores_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuario cria seus proprios pedidos de verba para professores"
  ON public.verba_professores_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pendente');

CREATE POLICY "Colaborador e admin veem todos os pedidos de verba para professores"
  ON public.verba_professores_requests
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'colaborador')
  );

CREATE POLICY "Colaborador e admin aprovam pedidos de verba para professores"
  ON public.verba_professores_requests
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'colaborador')
  )
  WITH CHECK (status IN ('pendente', 'aprovada'));

COMMENT ON TABLE public.verba_professores_requests IS
  'Pedidos de verba para campanha de recrutamento de novos professores, feitos pelos franqueados no Hub.';
COMMENT ON COLUMN public.verba_professores_requests.valor_verba IS
  'Verba solicitada, em reais inteiros (valor livre).';
COMMENT ON COLUMN public.verba_professores_requests.status IS
  'pendente = aguardando aprovacao; aprovada = verba liberada';
