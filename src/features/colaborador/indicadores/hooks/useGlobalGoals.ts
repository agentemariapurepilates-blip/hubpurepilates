import { useQuery } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';

export interface GoalEntry {
  unit_id: null;
  date: string;
  metric_key: string;
  daily_target: number;
}

export function useGlobalGoals(month: string | null) {
  return useQuery({
    queryKey: ['indicadores_global-goals', month],
    queryFn: async () => {
      if (!month) return [];

      const [year, monthNum] = month.split('-').map(Number);
      const lastDay = new Date(year, monthNum, 0).getDate();
      const startDate = `${month}-01`;
      const endDate = `${month}-${lastDay.toString().padStart(2, '0')}`;

      const { data, error } = await supabaseIndicadores
        .from('daily_goals')
        .select('*')
        .is('unit_id', null)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')
        .order('metric_key');

      if (error) throw error;
      return data || [];
    },
    enabled: !!month,
  });
}
