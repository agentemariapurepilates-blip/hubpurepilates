-- Destinatarios do RELATORIO MENSAL DE CLUSTERS.
--
-- NAO APLICADA AINDA, a pedido do usuario: nesta rodada nada e publicado.
-- Enquanto a tabela nao existir, a tela mostra a mensagem "a tabela ainda nao
-- existe no Supabase" que os hooks ja tratam -- e um caminho previsto, nao um
-- erro solto.
--
-- POR QUE ELA VIVE NO BANCO DO HUB, e nao no de indicadores:
-- os dados de cluster vem do banco do painel (bweyyihedqnckbtzbkie), que a area
-- de Dashboard le e NUNCA escreve -- essa garantia e sustentada pela varredura
-- em src/features/colaborador/indicadores/sem-escrita.test.ts. Cadastro de
-- destinatario e escrita, entao mora aqui, junto com as outras duas listas, e a
-- tela dele fica fora daquela pasta pelo mesmo motivo.
--
-- Terceira lista de destinatarios do Hub, todas separadas de proposito:
--   inauguracao_email_recipients     -> aviso diario de inauguracao (3h)
--   inauguracao_relatorio_recipients -> relatorio semanal de inauguracoes (seg, 7h)
--   cluster_relatorio_recipients     -> ESTA: relatorio mensal de clusters (dia 1, 3h)
-- Publicos diferentes: quem acompanha a distribuicao da rede nao e
-- necessariamente quem precisa saber que uma unidade inaugura amanha.

CREATE TABLE public.cluster_relatorio_recipients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  nome       text,
  ativo      boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cluster_relatorio_recipients_email_unico UNIQUE (email)
);

CREATE TRIGGER update_cluster_relatorio_recipients_updated_at
  BEFORE UPDATE ON public.cluster_relatorio_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cluster_relatorio_recipients ENABLE ROW LEVEL SECURITY;

-- Mesma politica das tabelas irmas: assunto de administrador, leitura e
-- escrita. Quem envia (Edge Function com chave de servico) ignora RLS.
CREATE POLICY "Somente admin gerencia destinatarios do relatorio de clusters"
  ON public.cluster_relatorio_recipients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE public.cluster_relatorio_recipients IS
  'E-mails que recebem o relatorio mensal de clusters de matriculados (dia 1, 03:00 de Sao Paulo). Gerenciada por admin em /dashboard/clusters-matriculados. Os dados do relatorio vem do banco de indicadores; so a lista mora aqui.';
COMMENT ON COLUMN public.cluster_relatorio_recipients.ativo IS
  'Desliga o envio para este endereco sem apagar o registro.';
