-- Destinatarios do aviso de inauguracao por e-mail.
--
-- Alimenta o workflow do n8n que, todo dia as 3h, avisa o marketing sobre as
-- unidades que inauguram naquele dia (ver
-- docs/superpowers/specs/2026-08-01-aviso-inauguracao-n8n-design.md, secoes
-- 3.1 e 4.2). O n8n le esta tabela com a chave de servico (passa por cima da
-- RLS); no Hub, so admin enxerga ou mexe -- colaborador nao precisa saber
-- quem recebe o aviso.
--
-- Sem nenhuma linha com ativo = true, o workflow nao tem para quem enviar e
-- o aviso do dia simplesmente nao sai (ver DestinatariosTab.tsx, que explica
-- essa consequencia no estado vazio).

CREATE TABLE public.inauguracao_email_recipients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  nome       text,
  ativo      boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inauguracao_email_recipients_email_unico UNIQUE (email)
);

CREATE TRIGGER update_inauguracao_email_recipients_updated_at
  BEFORE UPDATE ON public.inauguracao_email_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.inauguracao_email_recipients ENABLE ROW LEVEL SECURITY;

-- Uma policy FOR ALL cobre leitura e escrita, e e honesta quanto a intencao:
-- esta tabela e assunto de administrador. O workflow do n8n le com a chave
-- de servico, que ignora RLS -- nao precisa de policy propria.
CREATE POLICY "Somente admin gerencia destinatarios"
  ON public.inauguracao_email_recipients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE public.inauguracao_email_recipients IS
  'Lista de e-mails que recebem o aviso de inauguracao (workflow do n8n, todo dia as 3h). Gerenciada por admin pela aba Destinatarios em /inauguracoes. Sem nenhuma linha ativa, o aviso nao e enviado.';
COMMENT ON COLUMN public.inauguracao_email_recipients.ativo IS
  'Desliga o envio para este endereco sem apagar o registro -- quem sai de ferias ou muda de area volta com um clique, e o historico nao some.';
