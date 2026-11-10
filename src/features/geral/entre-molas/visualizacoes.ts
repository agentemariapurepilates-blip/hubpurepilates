import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Visualizador } from '../timeline/QuemViu';

// Quem leu cada edição — o mesmo registro da Timeline do Mês (tabela
// timeline_views, uma linha por pessoa), com a chave "entre-molas:<slug>", a
// mesma que controla a publicação. Pedido de 09/11/2026: a revista não deixava
// rastro de leitura.

const PREFIXO = 'entre-molas:';

export function useVisualizacoesEntreMolas() {
  const { user } = useAuth();
  const [porEdicao, setPorEdicao] = useState<Record<string, Visualizador[]>>({});

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('timeline_views').select('month_key, user_id, created_at').like('month_key', `${PREFIXO}%`);
    if (!data) return;
    const ids = [...new Set(data.map((v) => v.user_id))];
    const { data: perfis } = ids.length ? await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', ids) : { data: [] };
    const perfilDe = new Map((perfis || []).map((p) => [p.user_id, p]));
    const mapa: Record<string, Visualizador[]> = {};
    // Quem leu por último aparece no topo da lista.
    [...data]
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .forEach((v) => {
        const slug = v.month_key.slice(PREFIXO.length);
        const perfil = perfilDe.get(v.user_id);
        (mapa[slug] ||= []).push({
          user_id: v.user_id,
          full_name: perfil?.full_name ?? null,
          avatar_url: perfil?.avatar_url ?? null,
          created_at: v.created_at,
        });
      });
    setPorEdicao(mapa);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /** Marca que a pessoa abriu a edição. Abrir de novo não soma outra visualização. */
  const registrar = useCallback(
    async (slug: string) => {
      if (!user) return;
      await supabase.from('timeline_views').upsert({ month_key: `${PREFIXO}${slug}`, user_id: user.id }, { onConflict: 'month_key,user_id' });
    },
    [user],
  );

  return { porEdicao, registrar, carregar };
}
