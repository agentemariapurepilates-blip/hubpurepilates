import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import { DailyGoal, IndicatorMapping, RawConsolidatedDaily } from '../types';
import { firstDayOfMonth, lastDayOfMonth, monthsBetween } from '../lib/periods';
import { buildTimeline, Granularity } from '../lib/timeline';

export type { Granularity, TimelinePoint, TimelineSeries } from '../lib/timeline';

async function fetchAggregated(unitId: number | null, month: string) {
  const { data, error } = await supabaseIndicadores.rpc('get_raw_daily_aggregated', {
    p_month: month,
    p_unit_id: unitId || null,
  });

  if (error) throw error;
  return data as RawConsolidatedDaily[];
}

async function fetchGoals(unitId: number | null, month: string) {
  let query = supabaseIndicadores
    .from('daily_goals')
    .select('*')
    .gte('date', firstDayOfMonth(month))
    .lte('date', lastDayOfMonth(month))
    .order('date');

  // Sem unidade selecionada o painel usa as metas globais, e não a soma das
  // metas das unidades. Mesma regra do useDailyGoals, para os números baterem
  // entre as páginas.
  query = unitId ? query.eq('unit_id', unitId) : query.is('unit_id', null);

  const { data, error } = await query;

  if (error) throw error;
  return data as DailyGoal[];
}

/**
 * Busca realizado e metas de um intervalo de meses e devolve séries prontas
 * para o gráfico.
 *
 * A RPC `get_raw_daily_aggregated` só aceita um mês por vez, então o intervalo
 * vira uma consulta por mês, em paralelo. As chaves de cache são as mesmas das
 * páginas Visão Geral e Visão Diária, então meses já visitados não são buscados
 * de novo. Buscar as metas mês a mês também mantém cada resposta abaixo do
 * limite de 1000 linhas do Supabase.
 */
export function useTimelineData(
  unitId: number | null,
  fromMonth: string,
  toMonth: string,
  mappings: IndicatorMapping[] | undefined,
  granularity: Granularity
) {
  const months = useMemo(() => monthsBetween(fromMonth, toMonth), [fromMonth, toMonth]);

  const dataQueries = useQueries({
    queries: months.map((month) => ({
      queryKey: ['indicadores_aggregated-data', unitId, month],
      queryFn: () => fetchAggregated(unitId, month),
    })),
  });

  const goalQueries = useQueries({
    queries: months.map((month) => ({
      queryKey: ['indicadores_daily-goals', unitId, month],
      queryFn: () => fetchGoals(unitId, month),
    })),
  });

  const isLoading = dataQueries.some((q) => q.isLoading) || goalQueries.some((q) => q.isLoading);
  const failedMonths = months.filter((_, i) => dataQueries[i]?.isError || goalQueries[i]?.isError);

  // As queries viram objetos novos a cada render; o que identifica um resultado
  // novo é o carimbo de atualização de cada uma.
  const dataStamp = dataQueries.map((q) => q.dataUpdatedAt).join(',');
  const goalStamp = goalQueries.map((q) => q.dataUpdatedAt).join(',');

  const series = useMemo(() => {
    if (!mappings || mappings.length === 0) return [];

    const monthlyRows = new Map<string, RawConsolidatedDaily[] | undefined>();
    const monthlyGoals = new Map<string, DailyGoal[] | undefined>();

    months.forEach((month, i) => {
      monthlyRows.set(month, dataQueries[i]?.data);
      monthlyGoals.set(month, goalQueries[i]?.data);
    });

    return buildTimeline(monthlyRows, monthlyGoals, mappings, months, granularity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappings, months, granularity, dataStamp, goalStamp]);

  return { series, isLoading, failedMonths, months };
}

