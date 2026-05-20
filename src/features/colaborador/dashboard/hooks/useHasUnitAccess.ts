// Retorna true se o caller tem ≥1 atribuição em dpp_user_units (cacheado 5 min).
// Admin é considerado true sem precisar da query.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useHasUnitAccess(): boolean {
  const { user, isAdmin } = useAuth();

  const { data } = useQuery({
    queryKey: ['dpp_user_units_has_any', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('dpp_user_units' as never)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id);
      if (error) return false;
      return (count ?? 0) > 0;
    },
    enabled: !!user && !isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  return isAdmin || data === true;
}
