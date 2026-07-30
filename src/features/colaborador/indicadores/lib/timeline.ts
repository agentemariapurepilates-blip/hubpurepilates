import { DailyGoal, IndicatorMapping, RawConsolidatedDaily } from '../types';
import { lastDayOfMonth, shortDayLabel, shortMonthLabel } from './periods';

export type Granularity = 'day' | 'month';

export interface TimelinePoint {
  /** yyyy-MM-dd na granularidade diária, yyyy-MM na mensal */
  key: string;
  /** rótulo curto do eixo X */
  label: string;
  /** null significa "sem dado", e não zero — o gráfico desenha uma lacuna */
  value: number | null;
  goal: number | null;
}

export interface TimelineSeries {
  metric_key: string;
  display_name: string;
  points: TimelinePoint[];
  total: number;
  goalTotal: number;
  /** variação percentual contra a meta do período; null quando não há meta */
  achievement: number | null;
}

/**
 * Transforma os dados acumulados em séries cronológicas.
 *
 * O banco guarda valores ACUMULADOS dentro de cada mês: o valor do dia é a
 * diferença com o dia anterior, e o acumulado zera na virada do mês. Por isso a
 * diferença é calculada mês a mês e nunca atravessa a fronteira entre meses —
 * subtrair o dia 31 de janeiro do dia 1º de fevereiro produziria um número
 * negativo sem sentido. É a mesma regra que a Visão Diária usa.
 */
export function buildTimeline(
  monthlyRows: Map<string, RawConsolidatedDaily[] | undefined>,
  monthlyGoals: Map<string, DailyGoal[] | undefined>,
  mappings: IndicatorMapping[],
  months: string[],
  granularity: Granularity
): TimelineSeries[] {
  return mappings.map((mapping) => {
    const column = mapping.raw_column_name;

    // Valor diário desacumulado, por data, e a meta correspondente.
    const valueByDate = new Map<string, number>();
    const goalByDate = new Map<string, number>();
    // Meses em que a consulta trouxe alguma linha — usado para diferenciar
    // "mês sem dado" de "mês com valor zero".
    const monthsWithData = new Set<string>();

    for (const month of months) {
      const rows = monthlyRows.get(month);

      if (rows && rows.length > 0) {
        monthsWithData.add(month);

        const cumulativeByDate = new Map<string, number>();
        for (const row of rows) {
          cumulativeByDate.set(row.date, Number(row[column]) || 0);
        }

        const dates = Array.from(cumulativeByDate.keys()).sort();
        for (let i = 0; i < dates.length; i++) {
          const current = cumulativeByDate.get(dates[i]) ?? 0;
          const previous = i > 0 ? cumulativeByDate.get(dates[i - 1]) ?? 0 : 0;
          valueByDate.set(dates[i], i === 0 ? current : current - previous);
        }
      }

      for (const goal of monthlyGoals.get(month) ?? []) {
        if (goal.metric_key === mapping.metric_key) {
          goalByDate.set(goal.date, goal.daily_target);
        }
      }
    }

    const points =
      granularity === 'month'
        ? buildMonthlyPoints(months, monthsWithData, valueByDate, goalByDate)
        : buildDailyPoints(months, valueByDate, goalByDate);

    const trimmed = trimEmptyEdges(points);

    const total = trimmed.reduce((sum, point) => sum + (point.value ?? 0), 0);
    // A meta só entra na conta onde existe realizado. Somar a meta de um período
    // sem dado transformaria informação faltando em "meta não batida".
    const goalTotal = trimmed.reduce(
      (sum, point) => sum + (point.value !== null ? point.goal ?? 0 : 0),
      0
    );

    return {
      metric_key: mapping.metric_key,
      display_name: mapping.display_name,
      points: trimmed,
      total,
      goalTotal,
      achievement: goalTotal > 0 ? (total / goalTotal - 1) * 100 : null,
    };
  });
}

function buildMonthlyPoints(
  months: string[],
  monthsWithData: Set<string>,
  valueByDate: Map<string, number>,
  goalByDate: Map<string, number>
): TimelinePoint[] {
  return months.map((month) => {
    let value: number | null = monthsWithData.has(month) ? 0 : null;
    let goal: number | null = null;

    for (const [date, dailyValue] of valueByDate) {
      if (date.startsWith(`${month}-`)) value = (value ?? 0) + dailyValue;
    }
    for (const [date, dailyGoal] of goalByDate) {
      if (date.startsWith(`${month}-`)) goal = (goal ?? 0) + dailyGoal;
    }

    return { key: month, label: shortMonthLabel(month), value, goal };
  });
}

function buildDailyPoints(
  months: string[],
  valueByDate: Map<string, number>,
  goalByDate: Map<string, number>
): TimelinePoint[] {
  const points: TimelinePoint[] = [];

  for (const month of months) {
    const lastDay = Number(lastDayOfMonth(month).split('-')[2]);

    for (let day = 1; day <= lastDay; day++) {
      const date = `${month}-${String(day).padStart(2, '0')}`;

      points.push({
        key: date,
        label: shortDayLabel(date),
        // Dia sem registro é lacuna, não zero — do contrário os dias que ainda
        // não aconteceram no mês corrente desenhariam uma queda até o chão.
        // Um dia de fato sem movimento chega como linha com valor igual ao do
        // dia anterior, vira diferença zero e continua aparecendo como zero.
        value: valueByDate.has(date) ? valueByDate.get(date) ?? 0 : null,
        goal: goalByDate.has(date) ? goalByDate.get(date) ?? 0 : null,
      });
    }
  }

  return points;
}

/**
 * Remove os pontos sem dado e sem meta das pontas, para o gráfico não começar
 * nem terminar com uma faixa vazia. Lacunas no meio são preservadas.
 */
function trimEmptyEdges(points: TimelinePoint[]): TimelinePoint[] {
  const isEmpty = (point: TimelinePoint) => point.value === null && point.goal === null;

  let start = 0;
  let end = points.length - 1;

  while (start <= end && isEmpty(points[start])) start++;
  while (end >= start && isEmpty(points[end])) end--;

  return points.slice(start, end + 1);
}

