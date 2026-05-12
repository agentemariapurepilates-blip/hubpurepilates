import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PastPlan, MONTHS } from '../types';
import { selectPlanSummaries } from '../services/postsRepository';

/**
 * Carrega a lista de planos editoriais salvos do usuario (group by mes+ano).
 * Refresca sempre que o `refreshKey` muda — passe algo que mude quando voce
 * adicionar/remover posts (ex: generatedContents.length) para forcar reload.
 */
export function usePastPlans(userId: string | undefined, refreshKey: unknown): { pastPlans: PastPlan[] } {
  const [pastPlans, setPastPlans] = useState<PastPlan[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const summaries = await selectPlanSummaries(supabase, userId);
        if (cancelled) return;
        const ordered = summaries.sort((a, b) => {
          if (a.year !== b.year) return Number(b.year) - Number(a.year);
          return MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month);
        });
        setPastPlans(ordered);
      } catch (err) {
        console.error('Erro ao listar planos:', err);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refreshKey]);

  return { pastPlans };
}
