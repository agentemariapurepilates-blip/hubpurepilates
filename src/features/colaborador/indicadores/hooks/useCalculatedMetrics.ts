import { useQuery } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import type { CalculatedMetric } from '../types';

interface CalculatedMetricRow {
  id: number;
  metric_key: string;
  display_name: string;
  formula: string;
  format_type: string | null;
  decimal_places: number | null;
  category: string | null;
  active: boolean | null;
  show_in_dashboard: boolean | null;
  show_as_highlight: boolean | null;
  show_in_daily: boolean | null;
  dashboard_order: number | null;
  daily_order: number | null;
  created_at: string | null;
}

function mapRowToCalculatedMetric(row: CalculatedMetricRow): CalculatedMetric {
  return {
    id: row.id,
    metric_key: row.metric_key,
    display_name: row.display_name,
    formula: row.formula,
    format_type: (row.format_type as 'number' | 'currency' | 'percent') || 'number',
    decimal_places: row.decimal_places ?? 2,
    category: row.category,
    active: row.active ?? true,
    show_in_dashboard: row.show_in_dashboard ?? false,
    show_as_highlight: row.show_as_highlight ?? false,
    show_in_daily: row.show_in_daily ?? false,
    dashboard_order: row.dashboard_order ?? 0,
    daily_order: row.daily_order ?? 0,
    created_at: row.created_at || new Date().toISOString(),
  };
}

export function useCalculatedMetrics() {
  return useQuery({
    queryKey: ['indicadores_calculated-metrics'],
    queryFn: async () => {
      const { data, error } = await supabaseIndicadores
        .from('calculated_metrics')
        .select('*')
        .order('display_name');

      if (error) throw error;
      return (data as CalculatedMetricRow[]).map(mapRowToCalculatedMetric);
    },
  });
}

export function useActiveCalculatedMetrics() {
  return useQuery({
    queryKey: ['indicadores_calculated-metrics', 'active'],
    queryFn: async () => {
      const { data, error } = await supabaseIndicadores
        .from('calculated_metrics')
        .select('*')
        .eq('active', true)
        .order('display_name');

      if (error) throw error;
      return (data as CalculatedMetricRow[]).map(mapRowToCalculatedMetric);
    },
  });
}

export function useDashboardCalculatedMetrics() {
  return useQuery({
    queryKey: ['indicadores_calculated-metrics', 'dashboard'],
    queryFn: async () => {
      const { data, error } = await supabaseIndicadores
        .from('calculated_metrics')
        .select('*')
        .eq('active', true)
        .eq('show_in_dashboard', true)
        .order('dashboard_order', { ascending: true })
        .order('display_name');

      if (error) throw error;
      return (data as CalculatedMetricRow[]).map(mapRowToCalculatedMetric);
    },
  });
}

export function useHighlightCalculatedMetrics() {
  return useQuery({
    queryKey: ['indicadores_calculated-metrics', 'highlight'],
    queryFn: async () => {
      const { data, error } = await supabaseIndicadores
        .from('calculated_metrics')
        .select('*')
        .eq('active', true)
        .eq('show_as_highlight', true)
        .order('display_name');

      if (error) throw error;
      return (data as CalculatedMetricRow[]).map(mapRowToCalculatedMetric);
    },
  });
}
