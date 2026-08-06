import { useQuery } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import { format, endOfMonth, parse, startOfMonth, addMonths } from 'date-fns';

export interface ClusterRange {
  id: string;
  name: string;
  min: number;
  max: number | null;
  color: 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'orange';
}

export interface ClusterConfig {
  metricKey: string;
  months: string[];
  aggregation: 'avg' | 'sum' | 'max' | 'min' | 'last';
  ranges: ClusterRange[];
}

export interface UnitWithValue {
  id: number;
  name: string;
  value: number;
}

export interface ClusterResult {
  clusterId: string;
  clusterName: string;
  color: ClusterRange['color'];
  units: UnitWithValue[];
}

interface RawDataRow {
  unit_id: number;
  unit_name: string;
  [key: string]: unknown;
}

/** Quantas linhas o servidor devolve por resposta, no máximo. */
const LIMITE_POR_RESPOSTA = 1000;

/**
 * Busca as linhas dos dias informados, paginando até acabar.
 *
 * POR QUE PAGINAR, e por que `.range(0, 4999)` não resolve:
 * o PostgREST deste projeto corta TODA resposta em 1000 linhas, e o corte não
 * vem como erro — vem como uma lista curta. Pedir `range(0, 4999)` devolve
 * 1000 do mesmo jeito (conferido contra a API: 4999 e 99999 dão o mesmo).
 *
 * Com 3 meses selecionados são ~1.376 linhas, então a consulta antiga perdia
 * ~376 EM SILÊNCIO e a tela mostrava 334 das 475 unidades. E como não havia
 * `.order()`, as 1.000 que voltavam variavam entre execuções — o total mudava
 * sozinho de uma consulta para outra, o que é o sintoma clássico disso.
 *
 * O `.order()` aqui não é enfeite: sem uma ordenação estável, as páginas podem
 * repetir e pular linhas. Ele também dá sentido à agregação 'last', que antes
 * pegava "a última que chegou" e agora pega a do dia mais recente.
 *
 * Só as colunas usadas são pedidas, e não `*`: são ~40 colunas por linha, e
 * trazer todas multiplica o tráfego por nada.
 */
async function fetchTodasAsLinhas(
  dias: string[],
  coluna: string,
): Promise<Array<Record<string, unknown>>> {
  const todas: Array<Record<string, unknown>> = [];

  for (let inicio = 0; ; inicio += LIMITE_POR_RESPOSTA) {
    const { data, error } = await supabaseIndicadores
      .from('raw_consolidated_daily')
      .select(`unit_id, ${coluna}`)
      .in('date', dias)
      .not('unit_id', 'is', null)
      .order('unit_id', { ascending: true })
      .order('date', { ascending: true })
      .range(inicio, inicio + LIMITE_POR_RESPOSTA - 1);

    if (error) throw error;

    // Passa por `unknown` porque o nome da coluna só é conhecido em tempo de
    // execução: o supabase-js tenta analisar a string do `select` no nível de
    // tipos e não consegue com um template literal, então devolve um tipo de
    // erro em vez do formato da linha.
    const lote = (data ?? []) as unknown as Array<Record<string, unknown>>;
    todas.push(...lote);

    // Lote incompleto significa que acabou. Também encerra quando vem vazio,
    // então uma resposta inesperada não vira laço infinito.
    if (lote.length < LIMITE_POR_RESPOSTA) break;
  }

  return todas;
}

export function useClusterData(config: ClusterConfig | null) {
  return useQuery({
    queryKey: ['indicadores_cluster-data', config],
    queryFn: async (): Promise<ClusterResult[]> => {
      if (!config || !config.metricKey || config.months.length === 0 || config.ranges.length === 0) {
        return [];
      }

      // Get the last available day with data for each selected month
      const lastDays: string[] = [];

      for (const month of config.months) {
        const startDate = `${month}-01`;
        const endDate = format(endOfMonth(parse(month, 'yyyy-MM', new Date())), 'yyyy-MM-dd');

        // Find the latest date with actual data within the month
        const { data } = await supabaseIndicadores
          .from('raw_consolidated_daily')
          .select('date')
          .gte('date', startDate)
          .lte('date', endDate)
          .not('unit_id', 'is', null)
          .order('date', { ascending: false })
          .limit(1);

        if (data?.length) {
          lastDays.push(data[0].date);
        }
      }

      if (lastDays.length === 0) {
        return [];
      }

      // Fetch unit names first
      const { data: units, error: unitsError } = await supabaseIndicadores
        .from('units')
        .select('id, name')
        .eq('active', true);

      if (unitsError) throw unitsError;

      const unitMap = new Map(units?.map(u => [u.id, u.name]) || []);

      const rawData = await fetchTodasAsLinhas(lastDays, config.metricKey);

      // Aggregate data by unit
      const unitAggregates = new Map<number, number[]>();

      rawData.forEach((row) => {
        const unitId = row.unit_id as number;
        // Access the metric dynamically
        const value = (row as Record<string, unknown>)[config.metricKey] as number | null;

        if (unitId && value !== null && value !== undefined) {
          if (!unitAggregates.has(unitId)) {
            unitAggregates.set(unitId, []);
          }
          unitAggregates.get(unitId)!.push(value);
        }
      });

      // Calculate final value based on aggregation type
      const unitValues: UnitWithValue[] = [];

      unitAggregates.forEach((values, unitId) => {
        const unitName = unitMap.get(unitId);
        if (!unitName) return;

        let finalValue: number;
        switch (config.aggregation) {
          case 'sum':
            finalValue = values.reduce((a, b) => a + b, 0);
            break;
          case 'max':
            finalValue = Math.max(...values);
            break;
          case 'min':
            finalValue = Math.min(...values);
            break;
          case 'last':
            finalValue = values[values.length - 1];
            break;
          case 'avg':
          default:
            finalValue = values.reduce((a, b) => a + b, 0) / values.length;
            break;
        }

        unitValues.push({
          id: unitId,
          name: unitName,
          value: finalValue
        });
      });

      // Sort ranges by min value
      const sortedRanges = [...config.ranges].sort((a, b) => a.min - b.min);

      // Classify units into clusters
      const results: ClusterResult[] = sortedRanges.map(range => ({
        clusterId: range.id,
        clusterName: range.name,
        color: range.color,
        units: []
      }));

      // A faixa é decidida SÓ pelo piso, e não por `valor >= min && valor <= max`.
      //
      // POR QUÊ: as faixas são digitadas em inteiros (0–19, 20–29, 30+) mas o
      // valor agregado é uma MÉDIA, que quase sempre tem decimal. Uma unidade
      // com média 19,67 não é `<= 19` nem `>= 20`: com a regra antiga ela não
      // casava com faixa nenhuma e SUMIA da tela, sem erro e sem entrar em
      // nenhum total. Eram 8 unidades das 475 em maio–julho, todas paradas nos
      // vãos entre 19–20 e 29–30.
      //
      // Percorrendo do maior piso para o menor, a primeira faixa cujo mínimo
      // couber é a certa, e os vãos deixam de existir. O `max` continua valendo
      // como rótulo na tela; para classificar, ele é redundante — a faixa
      // seguinte já define onde esta termina.
      unitValues.forEach(unit => {
        for (let i = sortedRanges.length - 1; i >= 0; i--) {
          if (unit.value >= sortedRanges[i].min) {
            results[i].units.push(unit);
            return;
          }
        }

        // Abaixo do piso mais baixo (faixas que não começam em zero). Vai para a
        // primeira em vez de desaparecer — some da tela é o que se está
        // corrigindo aqui.
        if (results.length > 0) results[0].units.push(unit);
      });

      // Sort units within each cluster by value (descending)
      results.forEach(cluster => {
        cluster.units.sort((a, b) => b.value - a.value);
      });

      return results;
    },
    enabled: !!config && !!config.metricKey && config.months.length > 0 && config.ranges.length > 0
  });
}

export function useAvailableMonths() {
  return useQuery({
    queryKey: ['indicadores_available-months'],
    queryFn: async () => {
      // Fetch min and max dates with 2 lightweight queries (1 record each)
      const [minResult, maxResult] = await Promise.all([
        supabaseIndicadores
          .from('raw_consolidated_daily')
          .select('date')
          .not('unit_id', 'is', null)
          .order('date', { ascending: true })
          .limit(1),
        supabaseIndicadores
          .from('raw_consolidated_daily')
          .select('date')
          .not('unit_id', 'is', null)
          .order('date', { ascending: false })
          .limit(1)
      ]);

      if (minResult.error) throw minResult.error;
      if (maxResult.error) throw maxResult.error;

      if (!minResult.data?.length || !maxResult.data?.length) return [];

      const minDate = parse(minResult.data[0].date, 'yyyy-MM-dd', new Date());
      const maxDate = parse(maxResult.data[0].date, 'yyyy-MM-dd', new Date());

      // Generate all months between min and max
      const months: string[] = [];
      let current = startOfMonth(minDate);
      const end = startOfMonth(maxDate);

      while (current <= end) {
        months.push(format(current, 'yyyy-MM'));
        current = addMonths(current, 1);
      }

      // Sort descending (most recent first)
      const sortedMonths = months.sort((a, b) => b.localeCompare(a));
      console.log('Available months:', sortedMonths);
      return sortedMonths;
    }
  });
}
