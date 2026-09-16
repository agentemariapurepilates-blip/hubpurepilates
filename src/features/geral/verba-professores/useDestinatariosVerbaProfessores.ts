import { criarHooksDeDestinatarios } from '@/features/colaborador/inauguracoes/hooks/useDestinatarios';

/**
 * Lista de quem recebe o e-mail de cada pedido de verba para novos professores.
 * Só admin lê e altera (RLS da tabela). A Edge Function send-verba-professores
 * lê os ativos com a chave de serviço na hora de avisar.
 */
const verbaProfessores = criarHooksDeDestinatarios({
  tabela: 'verba_professores_email_recipients',
  queryKey: ['verba_professores_destinatarios_email'],
  migration: '20260916180000_verba_professores_email_recipients.sql',
  rotulo: 'E-mail dos pedidos de verba para professores',
});

export const useDestinatariosVerbaProfessores = verbaProfessores.useLista;
export const useCriarDestinatarioVerbaProfessores = verbaProfessores.useCriar;
export const useAlternarDestinatarioVerbaProfessores = verbaProfessores.useAlternar;
export const useExcluirDestinatarioVerbaProfessores = verbaProfessores.useExcluir;
