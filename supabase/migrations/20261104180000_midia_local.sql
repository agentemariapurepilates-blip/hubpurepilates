-- MÍDIA LOCAL NA TV GLOBO: pedidos dos franqueados e lista de quem recebe o e-mail.
--
-- NAO APLICADA AINDA.
--
-- O franqueado pede, pelo Hub, um plano de mídia para a praça dele. O pedido
-- fica gravado aqui e vai por e-mail para a Rise (Edge Function send-midia-local
-- + workflow do n8n), que negocia com a Globo e responde DIRETO ao franqueado.
--
-- Mesmo molde do pedido de Verba para professores: o franqueado vê só os
-- pedidos dele, colaborador e admin veem todos, e a lista de destinatários é
-- só de admin.
--
-- A LISTA DE DESTINATARIOS NASCE VAZIA, DE PROPOSITO.
-- O primeiro destinatario e o Demitry, da Rise (dcosta@risead.com.br), mas ele
-- so entra DEPOIS do teste: durante o teste a lista tem so o renan.wrk@gmail.com,
-- e nenhum e-mail de teste pode chegar a Rise. Semear o Demitry aqui faria o
-- primeiro pedido de teste ja ir para fora. Lista vazia nao quebra nada: o
-- pedido e gravado e o log da function avisa que nao havia ninguem para avisar.

CREATE TABLE public.midia_local_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Quem pediu. A Rise responde direto: o e-mail e o telefone sao o "responder para".
  nome_franqueado  text NOT NULL CHECK (length(nome_franqueado) BETWEEN 1 AND 200),
  email_franqueado text NOT NULL CHECK (length(email_franqueado) BETWEEN 3 AND 200),
  -- So digitos, com DDD e sem o 55.
  telefone         text NOT NULL CHECK (telefone ~ '^[1-9][1-9][0-9]{8,9}$'),

  nome_unidade     text NOT NULL CHECK (length(nome_unidade) BETWEEN 1 AND 200),
  endereco_unidade text NOT NULL CHECK (length(endereco_unidade) BETWEEN 1 AND 300),
  cep              text NOT NULL CHECK (cep ~ '^[0-9]{5}-[0-9]{3}$'),

  objetivo         text NOT NULL CHECK (objetivo IN ('inauguracao', 'reforco')),
  data_inauguracao date,
  periodo_inicio   date NOT NULL,
  periodo_fim      date NOT NULL,

  -- Faturamento. O CNPJ pode ser ALFANUMERICO (a Receita emite assim desde
  -- julho/2026): 12 caracteres [A-Z0-9] e 2 digitos verificadores, ja formatado.
  cnpj              text NOT NULL CHECK (cnpj ~ '^[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}/[A-Z0-9]{4}-[0-9]{2}$'),
  razao_social      text NOT NULL CHECK (length(razao_social) BETWEEN 1 AND 200),
  endereco_cobranca text NOT NULL CHECK (length(endereco_cobranca) BETWEEN 1 AND 300),

  -- cartela = modelo DCO, sem custo de Ancine; adaptacao = comercial de campanha
  -- tematica, com custo de Ancine calculado a parte.
  criativo_tipo text NOT NULL CHECK (criativo_tipo IN ('cartela', 'adaptacao')),
  criativo_info text NOT NULL CHECK (length(criativo_info) BETWEEN 1 AND 1000),

  -- O que quer contratar, podendo marcar mais de um.
  produtos text[] NOT NULL CHECK (
    cardinality(produtos) BETWEEN 1 AND 4
    AND produtos <@ ARRAY['tv', 'tv_digital', 'near_live', 'tv_gama']
  ),

  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'atendido')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT midia_local_inauguracao_exige_data
    CHECK (objetivo <> 'inauguracao' OR data_inauguracao IS NOT NULL),
  CONSTRAINT midia_local_periodo_coerente
    CHECK (periodo_fim >= periodo_inicio)
);

CREATE INDEX midia_local_requests_user_id_idx
  ON public.midia_local_requests (user_id);

CREATE INDEX midia_local_requests_created_at_idx
  ON public.midia_local_requests (created_at DESC);

CREATE TRIGGER midia_local_requests_set_updated_at
  BEFORE UPDATE ON public.midia_local_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.midia_local_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve seus proprios pedidos de midia local"
  ON public.midia_local_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Sem o `status = 'pendente'` qualquer usuario logado poderia gravar, pela API,
-- um pedido que ja nasce "atendido".
CREATE POLICY "Usuario cria seus proprios pedidos de midia local"
  ON public.midia_local_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pendente');

CREATE POLICY "Colaborador e admin veem todos os pedidos de midia local"
  ON public.midia_local_requests
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'colaborador')
  );

CREATE POLICY "Colaborador e admin atualizam pedidos de midia local"
  ON public.midia_local_requests
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'colaborador')
  )
  WITH CHECK (status IN ('pendente', 'atendido'));

COMMENT ON TABLE public.midia_local_requests IS
  'Pedidos de midia local na TV Globo, feitos pelos franqueados no Hub e encaminhados por e-mail a Rise.';
COMMENT ON COLUMN public.midia_local_requests.status IS
  'pendente = encaminhado, aguardando a Rise; atendido = a Rise ja respondeu ao franqueado';

-- ── quem recebe o e-mail ────────────────────────────────────────────────────
-- Mesmo molde das outras listas do Hub (inauguracao, clusters, verba para
-- professores). Quem LE para enviar e a Edge Function, com a chave de servico:
-- o pedido e feito por franqueado, que pela RLS nao enxerga a lista (e nao deve).

CREATE TABLE public.midia_local_email_recipients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  nome       text,
  ativo      boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT midia_local_email_recipients_email_unico UNIQUE (email)
);

CREATE TRIGGER update_midia_local_email_recipients_updated_at
  BEFORE UPDATE ON public.midia_local_email_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.midia_local_email_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Somente admin gerencia destinatarios da midia local"
  ON public.midia_local_email_recipients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE public.midia_local_email_recipients IS
  'E-mails que recebem o aviso de cada pedido de midia local (a Rise). Gerenciada por admin em /midia-adicional/unidades; lida pela Edge Function send-midia-local.';
