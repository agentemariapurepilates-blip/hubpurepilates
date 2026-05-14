-- Autorizar Midia adicional: solicitacoes feitas por franqueados pedindo investimento
-- adicional em campanhas de aula experimental.

CREATE TABLE public.midia_adicional_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  nome_franqueado text NOT NULL,
  nome_unidade text NOT NULL,
  data_inauguracao date NOT NULL,

  plano text NOT NULL CHECK (plano IN ('1500_3m', '2000_3m', '2500')),

  email_unidade text NOT NULL,
  email_franqueado text,

  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'recusado')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX midia_adicional_requests_user_id_idx
  ON public.midia_adicional_requests (user_id);

CREATE INDEX midia_adicional_requests_created_at_idx
  ON public.midia_adicional_requests (created_at DESC);

CREATE TRIGGER midia_adicional_requests_set_updated_at
  BEFORE UPDATE ON public.midia_adicional_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.midia_adicional_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve suas proprias solicitacoes"
  ON public.midia_adicional_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin ve todas as solicitacoes"
  ON public.midia_adicional_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Usuario cria suas proprias solicitacoes"
  ON public.midia_adicional_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin atualiza solicitacoes"
  ON public.midia_adicional_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON TABLE public.midia_adicional_requests IS
  'Solicitacoes de autorizacao de midia adicional submetidas pelos franqueados.';
COMMENT ON COLUMN public.midia_adicional_requests.plano IS
  '1500_3m = R$1500 em 3 meses; 2000_3m = R$2000 em 3 meses; 2500 = R$2500 (campanha unica)';
