import { criarHooksDeDestinatarios } from '@/features/colaborador/inauguracoes/hooks/useDestinatarios';

/**
 * Lista de quem recebe o relatório de clusters de AULAS EXPERIMENTAIS.
 *
 * Tabela e chave de cache próprias — separada da lista de matriculados de
 * propósito: são recortes diferentes da rede, e quem acompanha captação não é
 * necessariamente quem acompanha base de alunos.
 */
const experimentais = criarHooksDeDestinatarios({
  tabela: 'experimentais_relatorio_recipients',
  queryKey: ['experimentais_destinatarios_relatorio'],
  migration: '20260804220000_experimentais_relatorio_recipients.sql',
  rotulo: 'Relatório de aulas experimentais',
});

export const useDestinatariosExperimentais = experimentais.useLista;
export const useCriarDestinatarioExperimentais = experimentais.useCriar;
export const useAlternarDestinatarioExperimentais = experimentais.useAlternar;
export const useExcluirDestinatarioExperimentais = experimentais.useExcluir;
