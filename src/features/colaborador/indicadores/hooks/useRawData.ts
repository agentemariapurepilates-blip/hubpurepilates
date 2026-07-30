import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import { RawConsolidatedDaily } from '../types';
import { toast } from 'sonner';

export function useRawData(unitId: number | null, month: string | null) {
  return useQuery({
    queryKey: ['indicadores_raw-data', unitId, month],
    queryFn: async () => {
      let query = supabaseIndicadores
        .from('raw_consolidated_daily')
        .select('*')
        .order('date', { ascending: false });
      
      if (unitId) {
        query = query.eq('unit_id', unitId);
      }
      
      if (month) {
        const startDate = `${month}-01`;
        const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
          .toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
      }
      
      // Quando há filtro de mês, usa range para forçar buscar até 5000 registros
      // (Supabase tem limit padrão de 1000, mesmo sem .limit())
      const { data, error } = month 
        ? await query.range(0, 4999) 
        : await query.limit(1000);
      
      if (error) throw error;
      return data as RawConsolidatedDaily[];
    },
    enabled: !!month,
  });
}

export function useLatestData(unitId: number | null) {
  return useQuery({
    queryKey: ['indicadores_latest-data', unitId],
    queryFn: async () => {
      let query = supabaseIndicadores
        .from('raw_consolidated_daily')
        .select('*')
        .order('date', { ascending: false })
        .limit(1);
      
      if (unitId) {
        query = query.eq('unit_id', unitId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data?.[0] as RawConsolidatedDaily | null;
    },
  });
}

export function useTableColumns() {
  return useQuery({
    queryKey: ['indicadores_table-columns'],
    queryFn: async () => {
      const { data, error } = await supabaseIndicadores
        .from('raw_consolidated_daily')
        .select('*')
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return Object.keys(data[0]).filter(key => 
          !['id', 'unit_id', 'date', 'created_at'].includes(key)
        );
      }
      
      return [];
    },
  });
}

export function useImportCSV() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ rows }: { rows: Record<string, string>[] }) => {
      const { data, error } = await supabaseIndicadores.functions.invoke('import-csv', {
        body: { rows }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Import failed');

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['indicadores_raw-data'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores_latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores_table-columns'] });
      toast.success(data.message || 'Dados importados com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro na importação: ' + error.message);
    },
  });
}
