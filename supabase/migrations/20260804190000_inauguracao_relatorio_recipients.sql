-- Destinatarios do RELATORIO SEMANAL de inauguracoes.
--
-- Lista separada da de `inauguracao_email_recipients`, e nao um flag naquela
-- tabela, porque os dois envios servem a publicos diferentes: o aviso diario
-- das 3h e operacional (quem precisa agir naquele dia), e o relatorio semanal
-- e panoramico (quem acompanha o conjunto). Misturar obrigaria todo mundo a
-- receber os dois ou criaria uma matriz de flags dentro de uma tabela que hoje
-- tem um proposito so.
--
-- CONTEUDO DO RELATORIO (decidido com o usuario em 04/08/2026): as
-- inauguracoes da semana que passou E as da proxima semana, no mesmo e-mail.
-- ENVIO: toda segunda-feira as 07:00 de Sao Paulo (= 10:00 UTC).
--
-- O envio em si ainda NAO existe: esta migration cria so a tabela que a tela de
-- administracao alimenta. Enquanto a Edge Function, o cron e o workflow do n8n
-- nao forem publicados, cadastrar alguem aqui nao dispara nada -- e a tela diz
-- isso, para ninguem achar que o relatorio ja esta valendo.

CREATE TABLE public.inauguracao_relatorio_recipients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  nome       text,
  ativo      boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inauguracao_relatorio_recipients_email_unico UNIQUE (email)
);

CREATE TRIGGER update_inauguracao_relatorio_recipients_updated_at
  BEFORE UPDATE ON public.inauguracao_relatorio_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.inauguracao_relatorio_recipients ENABLE ROW LEVEL SECURITY;

-- Mesma politica da tabela irma: assunto de administrador, leitura e escrita.
-- Colaborador nao precisa nem saber quem recebe o relatorio. Quem for enviar
-- (Edge Function com chave de servico) ignora RLS e nao precisa de policy.
CREATE POLICY "Somente admin gerencia destinatarios do relatorio"
  ON public.inauguracao_relatorio_recipients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE public.inauguracao_relatorio_recipients IS
  'E-mails que recebem o relatorio semanal de inauguracoes (segunda, 07:00 de Sao Paulo), com a semana que passou e a proxima. Gerenciada por admin em /inauguracoes/relatorio. Lista separada da do aviso diario de propósito: publicos diferentes.';
COMMENT ON COLUMN public.inauguracao_relatorio_recipients.ativo IS
  'Desliga o envio para este endereco sem apagar o registro -- quem sai de ferias volta com um clique e o historico nao some.';
