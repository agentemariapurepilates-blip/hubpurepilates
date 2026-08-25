import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Se o usuário enxerga a conta INTEIRA ou só as unidades dele.
 *
 * O Hub tem duas listas de administrador, e elas não são a mesma:
 *   - `user_roles.role = 'admin'` decide quem abre a tela (ProtectedRoute);
 *   - `dpp_profiles.role = 'admin'` decide o que a RLS das tabelas de mídia
 *     devolve (`dpp_is_admin()`).
 *
 * Quem for admin só na primeira abre a tela e recebe, sem aviso nenhum, apenas
 * os conjuntos das unidades atribuídas a ele. Os totais ficam menores e continuam
 * parecendo os totais da rede — que é o pior tipo de erro que um relatório pode
 * ter. Em 17/08/2026 havia um caso assim entre os cinco admins do Hub.
 *
 * Por isso a tela pergunta antes e avisa quando o recorte é parcial.
 */
export function useAcessoAMidia() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['midia-paga_acesso', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<{ completo: boolean }> => {
      const { data, error } = await supabase
        .from('dpp_profiles' as never)
        .select('role')
        .eq('id', user!.id)
        .maybeSingle();

      // A política `user_select_own_profile` deixa qualquer um ler a própria
      // linha, então erro aqui é problema de conexão, não de permissão.
      if (error) throw error;

      const papel = (data as unknown as { role?: string } | null)?.role ?? null;
      return { completo: papel === 'admin' };
    },
    staleTime: 1000 * 60 * 60,
  });
}
