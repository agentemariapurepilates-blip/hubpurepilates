import {
  criarHooksDeDestinatarios,
} from '@/features/colaborador/inauguracoes/hooks/useDestinatarios';

/**
 * Lista de quem recebe o relatório mensal de clusters.
 *
 * Usa a mesma fábrica das listas de inaugurações: o comportamento é idêntico
 * (recusa silenciosa da RLS, e-mail duplicado, tabela ausente) e só mudam a
 * tabela e a chave de cache. O tratamento desses três casos é sutil o
 * suficiente para que duplicá-lo garantisse divergência na primeira correção.
 *
 * A tabela vive no banco do HUB, e não no de indicadores — ver o comentário no
 * topo da migration e em DestinatariosClustersTab.tsx.
 */
const clusters = criarHooksDeDestinatarios({
  tabela: 'cluster_relatorio_recipients',
  queryKey: ['cluster_destinatarios_relatorio'],
  migration: '20260804210000_cluster_relatorio_recipients.sql',
  rotulo: 'Relatório de clusters',
});

export const useDestinatariosClusters = clusters.useLista;
export const useCriarDestinatarioClusters = clusters.useCriar;
export const useAlternarDestinatarioClusters = clusters.useAlternar;
export const useExcluirDestinatarioClusters = clusters.useExcluir;
