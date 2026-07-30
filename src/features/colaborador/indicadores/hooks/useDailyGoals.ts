import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import { DailyGoal } from '../types';
import { toast } from 'sonner';

export function useDailyGoals(unitId: number | null, month: string | null) {
  return useQuery({
    queryKey: ['indicadores_daily-goals', unitId, month],
    queryFn: async () => {
      let query = supabaseIndicadores
        .from('daily_goals')
        .select('*')
        .order('date');
      
      // Se tem unidade selecionada, busca metas dessa unidade
      // Se não tem (todas as unidades), busca apenas metas globais (unit_id IS NULL)
      if (unitId) {
        query = query.eq('unit_id', unitId);
      } else {
        query = query.is('unit_id', null);
      }
      
      if (month) {
        const startDate = `${month}-01`;
        const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
          .toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as DailyGoal[];
    },
    enabled: !!month,
  });
}

export function useImportGoals() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ rows, unitMapping }: { rows: Record<string, string>[]; unitMapping: Map<string, number> }) => {
      let imported = 0;
      
      for (const row of rows) {
        const unitIdRaw = row['ID_Unidade'] || row['id_unidade'] || row['unit_id'];
        const unitId = unitMapping.get(unitIdRaw) || parseInt(unitIdRaw) || null;
        const dateRaw = row['Data'] || row['data'] || row['date'];
        const metricKey = row['metric_key'] || row['Indicador'] || row['indicador'];
        const target = parseFloat(row['daily_target'] || row['Meta'] || row['meta'] || '0');
        
        if (!dateRaw || !metricKey) continue;
        
        const date = new Date(dateRaw).toISOString().split('T')[0];
        
        const { error } = await supabaseIndicadores
          .from('daily_goals')
          .upsert({
            unit_id: unitId,
            date: date,
            metric_key: metricKey,
            daily_target: target,
          }, { onConflict: 'unit_id,date,metric_key' });

        if (!error) imported++;
      }

      return imported;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['indicadores_daily-goals'] });
      toast.success(`${count} metas importadas com sucesso!`);
    },
    onError: (error) => {
      toast.error('Erro na importação: ' + error.message);
    },
  });
}
