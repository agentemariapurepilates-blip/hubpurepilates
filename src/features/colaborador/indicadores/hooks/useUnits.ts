import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import { Unit } from '../types';
import { toast } from 'sonner';

export function useUnits() {
  return useQuery({
    queryKey: ['indicadores_units'],
    queryFn: async () => {
      const { data, error } = await supabaseIndicadores
        .from('units')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as Unit[];
    },
  });
}

export function useAllUnits() {
  return useQuery({
    queryKey: ['indicadores_units', 'all'],
    queryFn: async () => {
      const { data, error } = await supabaseIndicadores
        .from('units')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Unit[];
    },
  });
}

export function useSyncUnits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabaseIndicadores.functions.invoke('sync-units');

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Sync failed');

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['indicadores_units'] });
      toast.success(data.message || 'Unidades sincronizadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao sincronizar unidades: ' + error.message);
    },
  });
}

