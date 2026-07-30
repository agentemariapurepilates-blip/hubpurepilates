import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import { toast } from 'sonner';
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

interface CreateCalculatedMetricInput {
  metric_key: string;
  display_name: string;
  formula: string;
  format_type: 'number' | 'currency' | 'percent';
  decimal_places: number;
  category?: string | null;
  show_in_dashboard?: boolean;
  show_as_highlight?: boolean;
  show_in_daily?: boolean;
}

export function useCreateCalculatedMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCalculatedMetricInput) => {
      const { data, error } = await supabaseIndicadores
        .from('calculated_metrics')
        .insert({
          metric_key: input.metric_key,
          display_name: input.display_name,
          formula: input.formula,
          format_type: input.format_type,
          decimal_places: input.decimal_places,
          category: input.category || null,
          show_in_dashboard: input.show_in_dashboard ?? false,
          show_as_highlight: input.show_as_highlight ?? false,
          show_in_daily: input.show_in_daily ?? false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return mapRowToCalculatedMetric(data as CalculatedMetricRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicadores_calculated-metrics'] });
      toast.success('Métrica calculada criada com sucesso');
    },
    onError: (error: Error) => {
      console.error('Error creating calculated metric:', error);
      toast.error('Erro ao criar métrica calculada');
    },
  });
}

interface UpdateCalculatedMetricInput {
  id: number;
  metric_key?: string;
  display_name?: string;
  formula?: string;
  format_type?: 'number' | 'currency' | 'percent';
  decimal_places?: number;
  category?: string | null;
  active?: boolean;
  show_in_dashboard?: boolean;
  show_as_highlight?: boolean;
  show_in_daily?: boolean;
}

export function useUpdateCalculatedMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCalculatedMetricInput) => {
      const { data, error } = await supabaseIndicadores
        .from('calculated_metrics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapRowToCalculatedMetric(data as CalculatedMetricRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicadores_calculated-metrics'] });
      toast.success('Métrica calculada atualizada');
    },
    onError: (error: Error) => {
      console.error('Error updating calculated metric:', error);
      toast.error('Erro ao atualizar métrica calculada');
    },
  });
}

export function useDeleteCalculatedMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabaseIndicadores
        .from('calculated_metrics')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicadores_calculated-metrics'] });
      toast.success('Métrica calculada excluída');
    },
    onError: (error: Error) => {
      console.error('Error deleting calculated metric:', error);
      toast.error('Erro ao excluir métrica calculada');
    },
  });
}

