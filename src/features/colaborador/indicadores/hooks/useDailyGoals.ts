import { useQuery } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import { DailyGoal } from '../types';

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
