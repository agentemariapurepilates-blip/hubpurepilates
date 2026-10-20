import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Quantas vezes a pessoa logada já assistiu até o fim um vídeo de apresentação
// (tabela avisos_videos_assistidos, uma linha por visualização completa).
//
// O localStorage é uma segunda contagem, para o caso de o banco falhar na hora
// de gravar; vale a maior das duas. O que vale entre aparelhos é a tabela.

const chaveLocal = (videoId: string, userId: string) => `hub:video-assistido:${videoId}:${userId}`;

const lerLocal = (chave: string) => {
  try {
    return Number(localStorage.getItem(chave)) || 0;
  } catch {
    return 0;
  }
};

export function useVideoAssistido(videoId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['avisos-video-assistido', videoId, user?.id];

  const { data, isLoading } = useQuery({
    queryKey,
    enabled: !!user,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<number> => {
      const local = lerLocal(chaveLocal(videoId, user!.id));
      const { count, error } = await supabase
        .from('avisos_videos_assistidos')
        .select('id', { count: 'exact', head: true })
        .eq('video_id', videoId)
        .eq('user_id', user!.id);
      if (error) {
        console.error('[avisos] não consegui ler as visualizações do vídeo', error);
        return local;
      }
      return Math.max(local, count ?? 0);
    },
  });

  /** Registra mais uma visualização completa. */
  const registrar = useCallback(async () => {
    if (!user) return;
    const vezes = (queryClient.getQueryData<number>(queryKey) ?? 0) + 1;
    try {
      localStorage.setItem(chaveLocal(videoId, user.id), String(vezes));
    } catch {
      // sem localStorage, fica só o banco
    }
    queryClient.setQueryData(queryKey, vezes);
    const { error } = await supabase
      .from('avisos_videos_assistidos')
      .insert({ video_id: videoId, user_id: user.id });
    if (error) console.error('[avisos] visualização do vídeo não registrada', error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, videoId, queryClient]);

  return { vezes: data ?? 0, carregando: !!user && isLoading, registrar };
}
