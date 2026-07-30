import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import { IndicatorMapping } from '../types';
import { toast } from 'sonner';

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

export function useUpdateIndicatorMapping() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (mapping: Partial<IndicatorMapping> & { id: number }) => {
      const { data, error } = await supabaseIndicadores
        .from('indicator_mapping')
        .update(mapping)
        .eq('id', mapping.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicadores_indicator-mappings'] });
      toast.success('Mapeamento atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });
}

export function useCreateIndicatorMapping() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (mapping: Omit<IndicatorMapping, 'id' | 'created_at'>) => {
      const { data, error } = await supabaseIndicadores
        .from('indicator_mapping')
        .insert(mapping)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicadores_indicator-mappings'] });
      toast.success('Mapeamento criado!');
    },
    onError: (error) => {
      toast.error('Erro ao criar: ' + error.message);
    },
  });
}

export function useDeleteIndicatorMapping() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabaseIndicadores
        .from('indicator_mapping')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicadores_indicator-mappings'] });
      toast.success('Mapeamento removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });
}

