import { useQuery } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import { IndicatorMapping } from '../types';

export function useIndicatorMappings() {
  return useQuery({
    queryKey: ['indicadores_indicator-mappings'],
    queryFn: async () => {
      const { data, error } = await supabaseIndicadores
        .from('indicator_mapping')
        .select('*')
        .order('display_name');

      if (error) throw error;
      return data as IndicatorMapping[];
    },
  });
}

export function useActiveIndicatorMappings() {
  return useQuery({
    queryKey: ['indicadores_indicator-mappings', 'active'],
    queryFn: async () => {
      const { data, error } = await supabaseIndicadores
        .from('indicator_mapping')
        .select('*')
        .eq('active', true)
        .order('display_name');

      if (error) throw error;
      return data as IndicatorMapping[];
    },
  });
}

export function useDashboardIndicators() {
  return useQuery({
    queryKey: ['indicadores_indicator-mappings', 'dashboard'],
    queryFn: async () => {
      const { data, error } = await supabaseIndicadores
        .from('indicator_mapping')
        .select('*')
        .eq('active', true)
        .eq('show_in_dashboard', true)
        .order('dashboard_order', { ascending: true })
        .order('display_name');

      if (error) throw error;
      return data as IndicatorMapping[];
    },
  });
}

export function useDailyIndicators() {
  return useQuery({
    queryKey: ['indicadores_indicator-mappings', 'daily'],
    queryFn: async () => {
      const { data, error } = await supabaseIndicadores
        .from('indicator_mapping')
        .select('*')
        .eq('active', true)
        .eq('show_in_daily', true)
        .order('daily_order', { ascending: true })
        .order('display_name');

      if (error) throw error;
      return data as IndicatorMapping[];
    },
  });
}

export function useHighlightIndicators() {
  return useQuery({
    queryKey: ['indicadores_indicator-mappings', 'highlights'],
    queryFn: async () => {
      const { data, error } = await supabaseIndicadores
        .from('indicator_mapping')
        .select('*')
        .eq('active', true)
        .eq('show_as_highlight', true)
        .order('display_name');

      if (error) throw error;
      return data as IndicatorMapping[];
    },
  });
}

