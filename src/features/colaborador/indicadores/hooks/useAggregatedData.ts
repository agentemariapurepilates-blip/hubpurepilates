import { useQuery } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import { RawConsolidatedDaily } from '../types';

/**
 * Hook que usa RPC para buscar dados já agregados por dia no servidor.
 * Isso resolve o limite de 1000 registros do Supabase - retorna apenas ~31 linhas (uma por dia).
 */
export function useAggregatedData(unitId: number | null, month: string | null) {
  return useQuery({
    queryKey: ['indicadores_aggregated-data', unitId, month],
    queryFn: async () => {
      const { data, error } = await supabaseIndicadores
        .rpc('get_raw_daily_aggregated', {
          p_month: month,
          p_unit_id: unitId || null
        });
      
      if (error) {
        console.error('[useAggregatedData] Error:', error);
        throw error;
      }
      
      console.log(`[useAggregatedData] Loaded ${data?.length} aggregated records for ${month}`);
      return data as RawConsolidatedDaily[];
    },
    enabled: !!month,
  });
}

