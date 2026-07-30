import { useQuery } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';

export interface OrderableIndicator {
  id: number;
  type: 'mapped' | 'calculated';
  metric_key: string;
  display_name: string;
  order: number;
}

export function useDashboardOrderedIndicators() {
  return useQuery({
    queryKey: ['indicadores_indicators-order', 'dashboard'],
    queryFn: async () => {
      const [mappedRes, calculatedRes] = await Promise.all([
        supabaseIndicadores
          .from('indicator_mapping')
          .select('id, metric_key, display_name, dashboard_order')
          .eq('active', true)
          .eq('show_in_dashboard', true)
          .order('dashboard_order', { ascending: true })
          .order('display_name'),
        supabaseIndicadores
          .from('calculated_metrics')
          .select('id, metric_key, display_name, dashboard_order')
          .eq('active', true)
          .eq('show_in_dashboard', true)
          .order('dashboard_order', { ascending: true })
          .order('display_name'),
      ]);

      if (mappedRes.error) throw mappedRes.error;
      if (calculatedRes.error) throw calculatedRes.error;

      const mapped: OrderableIndicator[] = (mappedRes.data || []).map(m => ({
        id: m.id,
        type: 'mapped',
        metric_key: m.metric_key,
        display_name: m.display_name,
        order: m.dashboard_order ?? 0,
      }));

      const calculated: OrderableIndicator[] = (calculatedRes.data || []).map(c => ({
        id: c.id,
        type: 'calculated',
        metric_key: c.metric_key,
        display_name: c.display_name,
        order: c.dashboard_order ?? 0,
      }));

      return [...mapped, ...calculated].sort((a, b) => a.order - b.order || a.display_name.localeCompare(b.display_name));
    },
  });
}

export function useDailyOrderedIndicators() {
  return useQuery({
    queryKey: ['indicadores_indicators-order', 'daily'],
    queryFn: async () => {
      const [mappedRes, calculatedRes] = await Promise.all([
        supabaseIndicadores
          .from('indicator_mapping')
          .select('id, metric_key, display_name, daily_order')
          .eq('active', true)
          .eq('show_in_daily', true)
          .order('daily_order', { ascending: true })
          .order('display_name'),
        supabaseIndicadores
          .from('calculated_metrics')
          .select('id, metric_key, display_name, daily_order')
          .eq('active', true)
          .eq('show_in_daily', true)
          .order('daily_order', { ascending: true })
          .order('display_name'),
      ]);

      if (mappedRes.error) throw mappedRes.error;
      if (calculatedRes.error) throw calculatedRes.error;

      const mapped: OrderableIndicator[] = (mappedRes.data || []).map(m => ({
        id: m.id,
        type: 'mapped',
        metric_key: m.metric_key,
        display_name: m.display_name,
        order: m.daily_order ?? 0,
      }));

      const calculated: OrderableIndicator[] = (calculatedRes.data || []).map(c => ({
        id: c.id,
        type: 'calculated',
        metric_key: c.metric_key,
        display_name: c.display_name,
        order: c.daily_order ?? 0,
      }));

      return [...mapped, ...calculated].sort((a, b) => a.order - b.order || a.display_name.localeCompare(b.display_name));
    },
  });
}
