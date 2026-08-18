import { useQuery } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import {
  curvaDoHistorico,
  diasDoMes,
  fluxoDiario,
  montarRitmo,
  type LeituraDiaria,
  type Ritmo,
} from '../lib/ritmo';

/**
 * O ritmo do mês para uma métrica: realizado diário, meta diarizada, MTD,
 * semana e previsão de fechamento.
 *
 * A leitura diária vem da RPC `get_raw_daily_aggregated`, que soma as unidades
 * NO SERVIDOR e devolve ~31 linhas. Buscar a tabela crua seria inviável aqui:
 * julho/2026 tem 475 unidades × 31 dias = 14.725 linhas, e o PostgREST corta
 * toda resposta em 1.000 — seriam 15 requisições só para um mês, e a tela
 * precisa de vários.
 *
 * A meta vem de `daily_goals` já diarizada pela sede (ver `lib/ritmo.ts`).
 */

/** As métricas que têm meta global cadastrada, e por isso rendem leitura de ritmo. */
export const METRICAS_COM_META = [
  { metricKey: 'experimentais', coluna: 'cli_experimentais', nome: 'Aulas experimentais' },
  { metricKey: 'experimentais_presenca', coluna: 'cli_experimentais_presenca', nome: 'Experimentais com presença' },
  { metricKey: 'matriculas_total', coluna: 'cli_matriculas_total', nome: 'Matrículas' },
  { metricKey: 'matriculas_purepass', coluna: 'cli_matriculas_purepass', nome: 'Matrículas Pure Pass' },
] as const;

export type MetricaDeRitmo = (typeof METRICAS_COM_META)[number]['metricKey'];

const LIMITE_POR_RESPOSTA = 1000;

async function buscarMetas(mes: string, metricKey: string): Promise<Map<string, number>> {
  const metas = new Map<string, number>();

  // O último dia SAI DO CALENDÁRIO, e não de um "-31" fixo. Com o valor fixo, a
  // consulta de junho pedia `date <= 2026-06-31`, e o Postgres devolve 400
  // ("date/time field value out of range") — a meta de junho simplesmente não
  // carregava, e o painel de comportamento mostrava o mês como se não tivesse
  // meta cadastrada.
  const dias = diasDoMes(mes);
  const ultimo = dias[dias.length - 1];

  // Um mês de meta global cabe folgado em 1.000 linhas, mas paginar sai de
  // graça e evita que a tela quebre em silêncio se alguém cadastrar meta por
  // unidade um dia.
  for (let inicio = 0; ; inicio += LIMITE_POR_RESPOSTA) {
    const { data, error } = await supabaseIndicadores
      .from('daily_goals')
      .select('date, daily_target')
      .is('unit_id', null)
      .eq('metric_key', metricKey)
      .gte('date', `${mes}-01`)
      .lte('date', ultimo)
      .order('date', { ascending: true })
      .range(inicio, inicio + LIMITE_POR_RESPOSTA - 1);

    if (error) throw error;

    const lote = data ?? [];
    for (const linha of lote) {
      metas.set(linha.date as string, Number(linha.daily_target ?? 0));
    }
    if (lote.length < LIMITE_POR_RESPOSTA) break;
  }

  return metas;
}

async function buscarLeituras(mes: string, coluna: string, unitId: number | null): Promise<LeituraDiaria[]> {
  const { data, error } = await supabaseIndicadores.rpc('get_raw_daily_aggregated', {
    p_month: mes,
    p_unit_id: unitId,
  });

  if (error) throw error;

  const linhas = (data ?? []) as unknown as Array<Record<string, unknown>>;

  return linhas
    .filter((linha) => linha.date != null)
    .map((linha) => ({
      data: String(linha.date),
      acumulado: Number(linha[coluna] ?? 0),
    }));
}

/** Os `quantos` meses imediatamente anteriores a `mes`, do mais antigo ao mais novo. */
export function mesesAnterioresA(mes: string, quantos: number): string[] {
  const [ano, numero] = mes.split('-').map(Number);
  return Array.from({ length: quantos }, (_, i) => {
    const d = new Date(ano, numero - 1 - (quantos - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

/** O mês mais recente em que a métrica teve meta global maior que zero. */
async function ultimoMesComMeta(metricKey: string): Promise<string | null> {
  const { data, error } = await supabaseIndicadores
    .from('daily_goals')
    .select('date')
    .is('unit_id', null)
    .eq('metric_key', metricKey)
    .gt('daily_target', 0)
    .order('date', { ascending: false })
    .limit(1);

  if (error) throw error;
  const primeiro = (data ?? [])[0];
  return primeiro ? String(primeiro.date).slice(0, 7) : null;
}

export interface RitmoComContexto {
  ritmo: Ritmo;
  /**
   * Último mês com meta cadastrada para a métrica. Só é consultado quando o mês
   * escolhido não tem meta — e serve para a tela dizer "sem meta desde abril"
   * em vez de um "sem meta" que não diz a quem cobrar.
   */
  ultimoMesComMeta: string | null;
  /** A previsão usou a forma do histórico porque não havia meta. */
  usouHistorico: boolean;
}

export function useRitmoDoMes(mes: string, metricKey: MetricaDeRitmo, unitId: number | null = null) {
  const metrica = METRICAS_COM_META.find((m) => m.metricKey === metricKey)!;

  return useQuery({
    queryKey: ['indicadores_ritmo-do-mes', mes, metricKey, unitId],
    queryFn: async (): Promise<RitmoComContexto> => {
      const [leituras, metaPorDia] = await Promise.all([
        buscarLeituras(mes, metrica.coluna, unitId),
        buscarMetas(mes, metricKey),
      ]);

      const temMeta = [...metaPorDia.values()].some((v) => v > 0);

      // O trabalho extra só acontece para métrica SEM meta — hoje só
      // `matriculas_purepass`, sem meta desde abril de 2026. Buscar o histórico
      // de todas as métricas encareceria a tela para resolver um caso só.
      if (temMeta) {
        return {
          ritmo: montarRitmo({ mes, realizadoPorDia: fluxoDiario(leituras), metaPorDia }),
          ultimoMesComMeta: null,
          usouHistorico: false,
        };
      }

      const anteriores = mesesAnterioresA(mes, 3);
      const [historico, mesDaUltimaMeta] = await Promise.all([
        Promise.all(
          anteriores.map(async (anterior) => ({
            mes: anterior,
            realizadoPorDia: fluxoDiario(await buscarLeituras(anterior, metrica.coluna, unitId)),
          })),
        ),
        ultimoMesComMeta(metricKey),
      ]);

      const curva = curvaDoHistorico(historico, mes);

      return {
        ritmo: montarRitmo({
          mes,
          realizadoPorDia: fluxoDiario(leituras),
          metaPorDia,
          curvaDeReferencia: curva,
        }),
        ultimoMesComMeta: mesDaUltimaMeta,
        usouHistorico: curva !== null,
      };
    },
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Vários meses de uma vez, para comparar a forma de um mês com a dos anteriores.
 *
 * É o que sustenta o painel de comportamento: sem ver três meses lado a lado,
 * não dá para dizer se a divergência do mês corrente é o normal da rede ou um
 * desvio.
 */
export function useRitmoDeVariosMeses(meses: string[], metricKey: MetricaDeRitmo) {
  const metrica = METRICAS_COM_META.find((m) => m.metricKey === metricKey)!;

  return useQuery({
    queryKey: ['indicadores_ritmo-varios-meses', meses.join(','), metricKey],
    enabled: meses.length > 0,
    queryFn: async (): Promise<Ritmo[]> => {
      return Promise.all(
        meses.map(async (mes) => {
          const [leituras, metaPorDia] = await Promise.all([
            buscarLeituras(mes, metrica.coluna, null),
            buscarMetas(mes, metricKey),
          ]);
          return montarRitmo({ mes, realizadoPorDia: fluxoDiario(leituras), metaPorDia });
        }),
      );
    },
    staleTime: 1000 * 60 * 60,
  });
}
