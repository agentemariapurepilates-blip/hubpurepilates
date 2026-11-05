-- 20261105133000_midia_adicional_aprovacao_automatica.sql
-- Campanha Aporte (midia_adicional_requests): todo pedido NOVO nasce aprovado.
--
-- APLICADA em 05/11/2026 no projeto evprrtvbvjnjixogjsmn (Management API).
--
-- Pedido do Renan (05/11/2026): "toda vez que alguém solicitar uma demanda para fazer campanha apartada, é pra aprovar
-- automaticamente". Aprovar pela tela sempre foi só um UPDATE de status para 'aprovada' com motivo_recusa nulo
-- (AcoesDoPedidoMidia.tsx), sem e-mail, webhook nem outro efeito: o franqueado só passa a ver "Verba adicional aprovada"
-- em Minhas Solicitações. Nascer aprovado tem o mesmo efeito. O e-mail de pedido novo (Edge Function
-- send-midia-adicional -> webhook do n8n) não muda. Recusar pela tela continua possível.
--
-- Os pedidos que estavam pendentes em 05/11 foram aprovados à parte, por UPDATE direto no banco (que não dispara
-- nada), e não fazem parte desta migração.

ALTER TABLE public.midia_adicional_requests ALTER COLUMN status SET DEFAULT 'aprovada';

-- Garante o aprovado mesmo se alguém gravar 'pendente' de propósito na criação.
CREATE OR REPLACE FUNCTION public.midia_adicional_aprovar_na_criacao()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public AS $$
BEGIN
  IF NEW.status IS NULL OR NEW.status = 'pendente' THEN
    NEW.status := 'aprovada';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS midia_adicional_requests_aprovar_na_criacao ON public.midia_adicional_requests;
CREATE TRIGGER midia_adicional_requests_aprovar_na_criacao
  BEFORE INSERT ON public.midia_adicional_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.midia_adicional_aprovar_na_criacao();

COMMENT ON COLUMN public.midia_adicional_requests.status IS
  'aprovada = verba liberada (todo pedido novo nasce assim desde 05/11/2026); recusada = pedido negado (ver motivo_recusa); pendente = só pedidos antigos';
