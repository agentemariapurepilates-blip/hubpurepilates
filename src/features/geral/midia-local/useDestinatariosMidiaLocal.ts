import { criarHooksDeDestinatarios } from '@/features/colaborador/inauguracoes/hooks/useDestinatarios';

/**
 * Lista de quem recebe o e-mail de cada pedido de mídia local (a Rise).
 * Só admin lê e altera (RLS da tabela). A Edge Function send-midia-local lê os
 * ativos com a chave de serviço na hora de avisar.
 */
const midiaLocal = criarHooksDeDestinatarios({
  tabela: 'midia_local_email_recipients',
  queryKey: ['midia_local_destinatarios_email'],
  migration: '20261104180000_midia_local.sql',
  rotulo: 'E-mail dos pedidos de mídia local',
});

export const useDestinatariosMidiaLocal = midiaLocal.useLista;
export const useCriarDestinatarioMidiaLocal = midiaLocal.useCriar;
export const useAlternarDestinatarioMidiaLocal = midiaLocal.useAlternar;
export const useExcluirDestinatarioMidiaLocal = midiaLocal.useExcluir;
