-- Simplificar status de midia_adicional_requests para apenas 'pendente' e 'aprovada'
-- e liberar SELECT/UPDATE para colaboradores (alem de admins).

UPDATE public.midia_adicional_requests SET status = 'aprovada' WHERE status = 'aprovado';
UPDATE public.midia_adicional_requests SET status = 'pendente' WHERE status IN ('em_analise', 'recusado');

ALTER TABLE public.midia_adicional_requests
  DROP CONSTRAINT IF EXISTS midia_adicional_requests_status_check;

ALTER TABLE public.midia_adicional_requests
  ADD CONSTRAINT midia_adicional_requests_status_check
  CHECK (status IN ('pendente', 'aprovada'));

DROP POLICY IF EXISTS "Admin ve todas as solicitacoes" ON public.midia_adicional_requests;
DROP POLICY IF EXISTS "Admin atualiza solicitacoes" ON public.midia_adicional_requests;

CREATE POLICY "Colaborador e admin veem todas as solicitacoes"
  ON public.midia_adicional_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND user_type = 'colaborador'
    )
  );

CREATE POLICY "Colaborador e admin atualizam solicitacoes"
  ON public.midia_adicional_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND user_type = 'colaborador'
    )
  );

COMMENT ON COLUMN public.midia_adicional_requests.status IS
  'pendente = aguardando aprovacao; aprovada = verba liberada';
