import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Quem já assistiu cada episódio (tabela segredos_pilar_views).
//
// A contagem é POR PESSOA: a chave da tabela é (drive_id, user_id), então
// reabrir o mesmo episódio não soma de novo. O que fica registrado é quem
// ABRIU o vídeo — o player é o do Drive, e o Hub não recebe o progresso.
//
// Só colaborador/admin lê a tabela (RLS), então o relatório abaixo vem vazio
// para franqueado — e é por isso que a tela só o mostra para a sede.

export type Visualizacao = { drive_id: string; user_id: string; visto_em: string };

export type QuemViuEpisodio = {
  total: number;
  pessoas: { user_id: string; nome: string; avatar_url: string | null; visto_em: string }[];
};

const CHAVE = ['segredos-pilar-views'];
const CHAVE_CONTAGEM = ['segredos-pilar-contagem'];

/**
 * Só o NÚMERO de visualizações por episódio — o olhinho que todo mundo vê,
 * inclusive franqueado. Vem da função segredos_pilar_contagem, que conta sem
 * devolver quem viu (a tabela em si segue fechada para o franqueado).
 */
export function useContagens() {
  const { data } = useQuery({
    queryKey: CHAVE_CONTAGEM,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.rpc('segredos_pilar_contagem');
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((l) => [l.drive_id, Number(l.total)]));
    },
  });
  return data ?? {};
}

export function useVisualizacoes(podeVerRelatorio: boolean) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: CHAVE,
    enabled: podeVerRelatorio,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<{ porEpisodio: Record<string, QuemViuEpisodio>; totalPessoas: number }> => {
      const { data: views, error } = await supabase
        .from('segredos_pilar_views')
        .select('drive_id, user_id, visto_em')
        .order('visto_em', { ascending: false });
      if (error) throw error;

      const ids = [...new Set((views ?? []).map((v) => v.user_id))];
      const { data: perfis } = ids.length
        ? await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', ids)
        : { data: [] };
      const porUsuario = new Map((perfis ?? []).map((p) => [p.user_id, p]));

      const mapa: Record<string, QuemViuEpisodio> = {};
      for (const v of views ?? []) {
        const perfil = porUsuario.get(v.user_id);
        const item = (mapa[v.drive_id] ??= { total: 0, pessoas: [] });
        item.total += 1;
        item.pessoas.push({
          user_id: v.user_id,
          nome: perfil?.full_name?.trim() || 'Usuário',
          avatar_url: perfil?.avatar_url ?? null,
          visto_em: v.visto_em,
        });
      }
      // Pessoas diferentes que abriram ao menos um episódio.
      return { porEpisodio: mapa, totalPessoas: ids.length };
    },
  });

  /** Grava a visualização da pessoa. Repetir não soma: a linha já existe. */
  const registrar = useCallback(
    async (driveId: string | null) => {
      if (!driveId || !user) return;
      const { error } = await supabase
        .from('segredos_pilar_views')
        .upsert({ drive_id: driveId, user_id: user.id }, { onConflict: 'drive_id,user_id', ignoreDuplicates: true });
      // Falha aqui não pode atrapalhar quem está assistindo — só não conta.
      if (error) {
        console.error('[segredos-pilar] visualização não registrada', error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: CHAVE_CONTAGEM });
      if (podeVerRelatorio) queryClient.invalidateQueries({ queryKey: CHAVE });
    },
    [user, podeVerRelatorio, queryClient],
  );

  return {
    porEpisodio: data?.porEpisodio ?? {},
    totalPessoas: data?.totalPessoas ?? 0,
    carregando: isLoading,
    registrar,
  };
}
