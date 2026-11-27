-- Ordem manual das tarefas dentro do grupo (pedido de 26/11/2026, setor
-- Gravações): arrastar uma tarefa para outra linha grava a posição, e a tela
-- ordena por ela antes do prazo. Nulo = ninguém arrastou ainda (vai pelo prazo).
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS position integer NULL;
