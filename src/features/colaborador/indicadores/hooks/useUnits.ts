import { useQuery } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import { Unit } from '../types';

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

