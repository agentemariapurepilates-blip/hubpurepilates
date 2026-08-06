import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import {
  contarPorCluster,
  mesesEntre,
  trajetoriaDaUnidade,
  type PontoDaUnidade,
  type PontoDoMes,
  type ValorDeUnidade,
} from '../lib/clusters-matriculados';

// Coluna do ESTOQUE de alunos. Ver o comentário no topo de
// lib/clusters-matriculados.ts: existe uma `cli_matriculas_total` (fluxo) com
// nome quase idêntico, e trocar as duas produz um gráfico plausível e errado.
const COLUNA = 'cli_matriculados_total';

const ultimoDiaDoMes = (mes: string) => {
  const [ano, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(ano, m, 0)).toISOString().slice(0, 10);
};

/**
 * Busca o valor de cada unidade no mês.
 *
 * DUAS consultas por mês, de propósito. A ingênua — pegar o mês inteiro e
 * reduzir no cliente — traria 475 unidades × 31 dias = ~14 mil linhas, acima do
 * teto de 1000 do Supabase (e do `range` de 5000 que useRawData usa). Como o
 * indicador é estoque, só o último dia com dado interessa: a primeira consulta
 * descobre qual é esse dia e a segunda traz ~475 linhas.
 *
 * O "último dia com dado" não é necessariamente o último dia do calendário — no
 * mês corrente é hoje ou ontem, e num mês fechado pode faltar o dia 31.
 */
async function buscarValoresDoMes(mes: string, unitId: number | null): Promise<ValorDeUnidade[]> {
  const inicio = `${mes}-01`;
  const fim = ultimoDiaDoMes(mes);

  let consultaData = supabaseIndicadores
    .from('raw_consolidated_daily')
    .select('date')
    .gte('date', inicio)
    .lte('date', fim)
    .order('date', { ascending: false })
    .limit(1);

  if (unitId) consultaData = consultaData.eq('unit_id', unitId);

  const { data: dias, error: erroData } = await consultaData;
  if (erroData) throw erroData;
  if (!dias || dias.length === 0) return [];

  const diaAlvo = (dias[0] as { date: string }).date;

  let consultaValores = supabaseIndicadores
    .from('raw_consolidated_daily')
    .select(`unit_id, ${COLUNA}`)
    .eq('date', diaAlvo);

  if (unitId) consultaValores = consultaValores.eq('unit_id', unitId);

  // range explícito: são ~475 linhas hoje, mas o padrão do Supabase é 1000 e a
  // rede de unidades cresce. Sem isto, o gráfico começaria a perder unidades em
  // silêncio quando a base passasse de mil.
  const { data, error } = await consultaValores.range(0, 4999);
  if (error) throw error;

  return ((data ?? []) as Array<Record<string, unknown>>).map((linha) => ({
    unitId: Number(linha.unit_id),
    valor: Number(linha[COLUNA]) || 0,
  }));
}

export interface DadosDeClusters {
  /** Um ponto por mês, com a contagem de unidades em cada cluster. */
  pontos: PontoDoMes[];
  /** Preenchido só quando há uma unidade selecionada. */
  trajetoria: PontoDaUnidade[];
  meses: string[];
  isLoading: boolean;
  /** Meses cuja consulta falhou — a tela avisa em vez de mostrar buraco. */
  mesesComFalha: string[];
}

/**
 * Distribuição das unidades pelos clusters de matriculados, mês a mês.
 *
 * Com `unitId` preenchido, contar "quantas unidades por cluster" daria sempre 1
 * e não diria nada — por isso a trajetória daquela unidade vem junto.
 */
export function useClustersMatriculados(
  deMes: string,
  ateMes: string,
  unitId: number | null,
): DadosDeClusters {
  const meses = useMemo(() => mesesEntre(deMes, ateMes), [deMes, ateMes]);

  const consultas = useQueries({
    queries: meses.map((mes) => ({
      queryKey: ['indicadores_clusters-matriculados', mes, unitId],
      queryFn: () => buscarValoresDoMes(mes, unitId),
      // Os meses fechados não mudam mais; o corrente muda uma vez por dia.
      staleTime: 1000 * 60 * 30,
    })),
  });

  const isLoading = consultas.some((q) => q.isLoading);
  const mesesComFalha = meses.filter((_, i) => consultas[i]?.isError);

  // As queries viram objetos novos a cada render; o que identifica resultado
  // novo é o carimbo de atualização de cada uma.
  const carimbo = consultas.map((q) => q.dataUpdatedAt).join(',');

  const { pontos, trajetoria } = useMemo(() => {
    const pontosCalculados: PontoDoMes[] = [];
    const valorPorMes = new Map<string, number | undefined>();

    meses.forEach((mes, i) => {
      const valores = consultas[i]?.data ?? [];
      pontosCalculados.push(contarPorCluster(mes, valores));
      valorPorMes.set(mes, valores.length > 0 ? valores[0].valor : undefined);
    });

    return {
      pontos: pontosCalculados,
      trajetoria: unitId ? trajetoriaDaUnidade(meses, valorPorMes) : [],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meses, carimbo, unitId]);

  return { pontos, trajetoria, meses, isLoading, mesesComFalha };
}
