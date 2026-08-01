-- Aviso de inauguracao por e-mail: a coluna que impede o reenvio.
--
-- `email_enviado_em` existe por causa do workflow do n8n
-- (`n8n/aviso-inauguracao.workflow.json`), que todo dia as 03:00 de Sao Paulo
-- procura as inauguracoes de hoje e manda um e-mail ao marketing por unidade.
-- Sem um marcador de envio, qualquer reexecucao do workflow no mesmo dia
-- reenviaria os mesmos avisos.
--
-- Quem preenche esta coluna e o WORKFLOW, nao a aplicacao. Nenhuma tela do Hub
-- le ou grava `email_enviado_em`; o front nem sabe que ela existe. O workflow
-- envia o e-mail primeiro e so depois grava aqui -- a ordem e de proposito
-- (ver §5 do spec): se a marcacao falhar, o marketing pode receber repetido,
-- o que e incomodo; se a ordem fosse inversa e o e-mail falhasse, a linha
-- ficaria marcada e o aviso nunca sairia, o que e pior por ser silencioso.
--
-- A RLS nao muda. O workflow usa a chave de servico do Supabase, que passa por
-- cima da RLS, entao nenhuma policy nova e necessaria -- e a coluna nova fica
-- visivel exatamente para quem ja via a linha.
--
-- EFEITO COLATERAL ESPERADO no `updated_at`: a marcacao do workflow e um UPDATE
-- comum, entao dispara o trigger `update_inauguracao_requests_updated_at` e a
-- linha ganha `updated_at` novo as 03:00 do dia da inauguracao, sem ninguem ter
-- editado nada. Hoje isso e inocuo -- nenhuma tela ordena ou filtra por
-- `updated_at`, e a regra das 48h olha `data_inauguracao`, nao `updated_at`.
-- Fica registrado para quem um dia for usar `updated_at` como "ultima edicao
-- humana" nao se assustar: nesta tabela ele nao e so isso.

ALTER TABLE public.inauguracao_requests
  ADD COLUMN IF NOT EXISTS email_enviado_em timestamptz;

COMMENT ON COLUMN public.inauguracao_requests.email_enviado_em IS
  'Quando o aviso de inauguracao foi enviado ao marketing pelo workflow do n8n. NULL = ainda nao avisado.';

-- Indice parcial de proposito: a consulta do workflow procura sempre por
-- linhas NAO avisadas, entao um indice restrito a elas continua minusculo
-- mesmo com a tabela crescendo (as linhas ja avisadas saem do indice).
CREATE INDEX IF NOT EXISTS inauguracao_requests_aviso_pendente_idx
  ON public.inauguracao_requests (data_inauguracao)
  WHERE email_enviado_em IS NULL;
