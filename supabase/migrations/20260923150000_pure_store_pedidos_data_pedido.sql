-- Data do pedido, informada à mão.
--
-- `created_at` continua sendo quando o registro nasceu no Hub (rastro, não se
-- mexe). `data_pedido` é a data que vale para o cliente: por padrão hoje, mas a
-- equipe pode retroceder ao lançar um pedido antigo.
--
-- É `date`, não `timestamptz`: o que importa é o dia, e assim o filtro por
-- período no Gerenciador compara texto com texto, sem erro de fuso.
--
-- Aplicar pelo SQL Editor ou pela Management API. Nunca `supabase db push`:
-- o histórico remoto de migrations está vazio.

ALTER TABLE public.pure_store_pedidos
  ADD COLUMN IF NOT EXISTS data_pedido date;

-- Pedidos que já existem herdam o dia em que foram criados, no fuso de São Paulo.
UPDATE public.pure_store_pedidos
SET data_pedido = (created_at AT TIME ZONE 'America/Sao_Paulo')::date
WHERE data_pedido IS NULL;

ALTER TABLE public.pure_store_pedidos
  ALTER COLUMN data_pedido SET DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date;
ALTER TABLE public.pure_store_pedidos
  ALTER COLUMN data_pedido SET NOT NULL;

CREATE INDEX IF NOT EXISTS pure_store_pedidos_data_pedido_idx
  ON public.pure_store_pedidos (data_pedido DESC);
