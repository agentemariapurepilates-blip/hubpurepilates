-- Destinatarios do RELATORIO MENSAL DE CLUSTERS DE AULAS EXPERIMENTAIS.
--
-- NAO APLICADA AINDA: nesta rodada nada e publicado. Enquanto a tabela nao
-- existir, a tela mostra a mensagem "a tabela ainda nao existe no Supabase",
-- que os hooks ja tratam -- e um caminho previsto, nao um erro solto.
--
-- Quarta lista de destinatarios do Hub, todas separadas de proposito:
--   inauguracao_email_recipients      -> aviso diario de inauguracao (3h)
--   inauguracao_relatorio_recipients  -> relatorio semanal de inauguracoes (seg, 7h)
--   cluster_relatorio_recipients      -> clusters de MATRICULADOS (dia 1, 3h)
--   experimentais_relatorio_recipients-> ESTA: clusters de AULAS EXPERIMENTAIS
--                                        (penultimo dia do mes, 3h)
--
-- Mora no banco do HUB, e nao no de indicadores: cadastro e escrita, e a area
-- de Dashboard nunca escreve naquele banco (ver sem-escrita.test.ts).

CREATE TABLE public.experimentais_relatorio_recipients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  nome       text,
  ativo      boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT experimentais_relatorio_recipients_email_unico UNIQUE (email)
);

CREATE TRIGGER update_experimentais_relatorio_recipients_updated_at
  BEFORE UPDATE ON public.experimentais_relatorio_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.experimentais_relatorio_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Somente admin gerencia destinatarios de experimentais"
  ON public.experimentais_relatorio_recipients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE public.experimentais_relatorio_recipients IS
  'E-mails que recebem o relatorio de clusters de aulas experimentais (penultimo dia do mes, 03:00 de Sao Paulo), com a media dos 3 ultimos meses por unidade. Gerenciada por admin em /dashboard/clusters-matriculados.';
