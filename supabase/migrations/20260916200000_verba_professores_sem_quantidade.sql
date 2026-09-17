-- A quantidade de professores sai do pedido de verba para novos professores,
-- a pedido do usuario (16/09/2026). O formulario, a function e o e-mail deixam
-- de usar o campo.
--
-- Pode remover a coluna sem migrar dado: a tabela estava vazia (os unicos
-- pedidos eram de teste e foram apagados no mesmo dia). O CHECK de 1 a 50 cai
-- junto com a coluna.
--
-- ORDEM: aplicar DEPOIS de publicar a send-verba-professores que nao grava
-- mais qtd_professores. Antes disso, a versao antiga da function tentaria
-- gravar numa coluna inexistente e o pedido falharia.
--
-- APLICADA em 16/09/2026, depois da function v3 e do e-mail atualizado no n8n.

ALTER TABLE public.verba_professores_requests
  DROP COLUMN IF EXISTS qtd_professores;
