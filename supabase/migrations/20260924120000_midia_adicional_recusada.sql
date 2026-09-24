-- Recusa de pedido de Campanha Aporte (midia_adicional_requests).
--
-- NAO APLICADA AINDA.
--
-- Ate hoje o admin so podia APROVAR: os status eram 'pendente' e 'aprovada'
-- (ver 20260515160000_midia_adicional_colaborador.sql). A pedido do usuario
-- (24/09/2026), passa a existir 'recusada', com um motivo opcional que o
-- franqueado le em Minhas Solicitacoes.
--
-- Nada muda para os pedidos ja existentes: continuam 'pendente' ou 'aprovada'.
-- A tela e a unica fonte de 'recusada', e so colaborador/admin escreve (a RLS
-- de UPDATE ja era deles).

ALTER TABLE public.midia_adicional_requests
  DROP CONSTRAINT IF EXISTS midia_adicional_requests_status_check;

ALTER TABLE public.midia_adicional_requests
  ADD CONSTRAINT midia_adicional_requests_status_check
  CHECK (status IN ('pendente', 'aprovada', 'recusada'));

ALTER TABLE public.midia_adicional_requests
  ADD COLUMN IF NOT EXISTS motivo_recusa text
  CHECK (motivo_recusa IS NULL OR length(motivo_recusa) <= 500);

COMMENT ON COLUMN public.midia_adicional_requests.status IS
  'pendente = aguardando analise; aprovada = verba liberada; recusada = pedido negado (ver motivo_recusa)';
COMMENT ON COLUMN public.midia_adicional_requests.motivo_recusa IS
  'Texto opcional escrito por quem recusou. Aparece para o franqueado em Minhas Solicitacoes.';
