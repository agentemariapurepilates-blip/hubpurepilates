-- Pedidos da Pure Store: frete e as colunas novas do quadro.
--
-- O quadro passa a ter sete colunas, na ordem em que o pedido anda:
-- realizado -> separado -> enviado | retirada -> entregue -> finalizado, mais
-- cancelado, que é saída de qualquer ponto.
--
-- O frete é digitado à mão no Gerador e entra no total depois do desconto:
-- total = subtotal - desconto + frete.
--
-- Aplicar pelo SQL Editor ou pela Management API. Nunca `supabase db push`:
-- o histórico remoto de migrations está vazio.

ALTER TABLE public.pure_store_pedidos
  ADD COLUMN IF NOT EXISTS frete numeric(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.pure_store_pedidos
  DROP CONSTRAINT IF EXISTS pure_store_pedidos_frete_check;
ALTER TABLE public.pure_store_pedidos
  ADD CONSTRAINT pure_store_pedidos_frete_check CHECK (frete >= 0);

-- O CHECK antigo só aceitava realizado/separado/entregue.
ALTER TABLE public.pure_store_pedidos
  DROP CONSTRAINT IF EXISTS pure_store_pedidos_status_check;
ALTER TABLE public.pure_store_pedidos
  ADD CONSTRAINT pure_store_pedidos_status_check CHECK (
    status IN ('realizado', 'separado', 'enviado', 'retirada', 'entregue', 'finalizado', 'cancelado')
  );
