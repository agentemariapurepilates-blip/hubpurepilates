-- Destinatarios do E-MAIL DOS PEDIDOS DE VERBA PARA NOVOS PROFESSORES.
--
-- NAO APLICADA AINDA.
--
-- Pedido do usuario (16/09/2026): quem recebe o aviso de cada pedido deixa de
-- ser uma lista fixa no n8n e passa a ser cadastrada no Hub, por admin -- e so
-- por admin. Mesmo molde das outras listas de destinatarios:
--   inauguracao_email_recipients, inauguracao_relatorio_recipients,
--   cluster_relatorio_recipients, experimentais_relatorio_recipients.
--
-- Quem LE esta tabela para enviar e a Edge Function send-verba-professores,
-- com a chave de servico: o pedido e feito por franqueado, que pela RLS nao
-- enxerga a lista (e nao deve).

CREATE TABLE public.verba_professores_email_recipients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  nome       text,
  ativo      boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verba_professores_email_recipients_email_unico UNIQUE (email)
);

CREATE TRIGGER update_verba_professores_email_recipients_updated_at
  BEFORE UPDATE ON public.verba_professores_email_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.verba_professores_email_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Somente admin gerencia destinatarios da verba para professores"
  ON public.verba_professores_email_recipients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE public.verba_professores_email_recipients IS
  'E-mails que recebem o aviso de cada pedido de verba para novos professores. Gerenciada por admin em /midia-adicional/unidades; lida pela Edge Function send-verba-professores.';
