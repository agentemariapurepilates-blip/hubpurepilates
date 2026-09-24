import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salvarMetasGlobais, type MetaGlobalParaSalvar } from '../lib/indicadoresProxy';

/**
 * Salva as metas globais de um mês pelo proxy do servidor local. Depois de
 * salvar, invalida todas as consultas que mostram meta — a aba Metas, a lista de
 * meses e as metas usadas nas outras telas (Visão Diária e Ritmo do Mês).
 */
export function useSalvarMetasGlobais() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mes, metas }: { mes: string; metas: MetaGlobalParaSalvar[] }) =>
      salvarMetasGlobais(mes, metas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicadores_global-goals'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores_meses-com-meta'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores_daily-goals'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores_ritmo-do-mes'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores_ritmo-varios-meses'] });
    },
  });
}
