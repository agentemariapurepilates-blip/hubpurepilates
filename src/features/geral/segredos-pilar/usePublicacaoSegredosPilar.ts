import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Publicação da série: mesmo mecanismo da Timeline do Mês (NovidadesDoMes).
// Usa a tabela timeline_visibility com uma chave própria — a leitura é liberada
// para todo autenticado e só admin grava (RLS da tabela).
// Enquanto não publicada, só colaboradores/admins veem; a Edge Function
// segredos-pilar-episodios confere a mesma linha antes de entregar a lista.
export const CHAVE_PUBLICACAO_SEGREDOS_PILAR = 'segredos-de-pilar';

const chaveDaQuery = ['segredos-pilar-publicacao'];

export function usePublicacaoSegredosPilar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: publicado = false, isLoading } = useQuery({
    queryKey: chaveDaQuery,
    enabled: !!user,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_visibility')
        .select('is_published')
        .eq('month_key', CHAVE_PUBLICACAO_SEGREDOS_PILAR)
        .maybeSingle();
      if (error) throw error;
      return data?.is_published === true;
    },
  });

  const publicar = useMutation({
    mutationFn: async () => {
      const campos = { is_published: true, published_at: new Date().toISOString(), published_by: user?.id };
      const { data: existente, error: erroLeitura } = await supabase
        .from('timeline_visibility')
        .select('id')
        .eq('month_key', CHAVE_PUBLICACAO_SEGREDOS_PILAR)
        .maybeSingle();
      if (erroLeitura) throw erroLeitura;
      const { error } = existente
        ? await supabase.from('timeline_visibility').update(campos).eq('month_key', CHAVE_PUBLICACAO_SEGREDOS_PILAR)
        : await supabase.from('timeline_visibility').insert({ month_key: CHAVE_PUBLICACAO_SEGREDOS_PILAR, ...campos });
      if (error) throw error;
    },
    onSuccess: () => queryClient.setQueryData(chaveDaQuery, true),
  });

  return { publicado, carregando: isLoading, publicar };
}
