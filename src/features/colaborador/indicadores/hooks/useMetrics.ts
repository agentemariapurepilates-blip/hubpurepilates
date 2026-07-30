import { useMemo } from 'react';
import { RawConsolidatedDaily, DailyGoal, IndicatorMapping, AggregatedMetric, MetricCard, UnitRanking, Unit, PeriodMetric, CalculatedMetric } from '../types';
import { format, subDays, getDay, isAfter, isBefore, parseISO, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';
import { evaluateFormula, formatMetricValue } from '../lib/formulaParser';

export function useCalculatedMetrics(
  rawData: RawConsolidatedDaily[] | undefined,
  goals: DailyGoal[] | undefined,
  mappings: IndicatorMapping[] | undefined,
  selectedMonth: string
) {
  return useMemo(() => {
    if (!rawData || rawData.length === 0 || !mappings) {
      return {
        cards: [],
        tableData: [],
        pctPresenca: 0,
        pctConversaoMA: 0,
        pctConversaoMP: 0,
        pctOcupacao: 0,
      };
    }

    const today = new Date();
    const yesterday = subDays(today, 1);
    const [year, month] = selectedMonth.split('-').map(Number);
    const totalDaysInMonth = getDaysInMonth(new Date(year, month - 1));

    // Sort data by date
    const sortedData = [...rawData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get last day with data (D-1)
    const latestDate = sortedData[sortedData.length - 1]?.date;
    const latestDayNum = latestDate ? parseInt(latestDate.split('-')[2]) : 1;

    // Group data by date (aggregate all units)
    const dataByDate = new Map<string, Record<string, number>>();
    for (const row of sortedData) {
      const existing = dataByDate.get(row.date) || {};
      for (const key of Object.keys(row)) {
        if (key !== 'date' && key !== 'unit_id' && key !== 'id' && key !== 'created_at' && key !== 'dt_calculo') {
          const val = Number((row as any)[key]) || 0;
          existing[key] = (existing[key] || 0) + val;
        }
      }
      dataByDate.set(row.date, existing);
    }

    const sortedDates = Array.from(dataByDate.keys()).sort();

    // Calculate daily values from aggregated accumulated data
    const calculateDailyValuesAggregated = (columnName: string) => {
      const result: { date: string; value: number }[] = [];
      
      for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const currentData = dataByDate.get(date);
        const prevData = i > 0 ? dataByDate.get(sortedDates[i - 1]) : null;
        
        const current = currentData?.[columnName] || 0;
        const previous = prevData?.[columnName] || 0;
        
        result.push({
          date,
          value: i === 0 ? current : current - previous,
        });
      }
      
      return result;
    };

    // Calculate MTW (Monday to latestDate) - using string comparison to avoid timezone issues
    const getMTW = (dailyValues: { date: string; value: number }[]) => {
      const latestDateObj = parseISO(latestDate);
      const lastMonday = new Date(latestDateObj);
      while (getDay(lastMonday) !== 1) {
        lastMonday.setDate(lastMonday.getDate() - 1);
      }
      const lastMondayStr = format(lastMonday, 'yyyy-MM-dd');
      
      return dailyValues
        .filter(d => d.date >= lastMondayStr && d.date <= latestDate)
        .reduce((sum, d) => sum + d.value, 0);
    };

    // Get number of days in MTW period
    const getMTWDays = () => {
      const lastMonday = new Date(yesterday);
      while (getDay(lastMonday) !== 1) {
        lastMonday.setDate(lastMonday.getDate() - 1);
      }
      let count = 0;
      const current = new Date(lastMonday);
      while (current <= yesterday) {
        count++;
        current.setDate(current.getDate() + 1);
      }
      return count;
    };

    // Calculate MTD from latest accumulated value
    const getMTD = (columnName: string) => {
      const latestData = dataByDate.get(latestDate);
      return latestData?.[columnName] || 0;
    };

    // Calculate D-1 value
    const getD1 = (columnName: string) => {
      const dailyValues = calculateDailyValuesAggregated(columnName);
      const d1Entry = dailyValues.find(d => d.date === latestDate);
      return d1Entry?.value || 0;
    };

    // Calculate forecast using MTD + remaining daily goals
    const getForecast = (mtd: number, metricKey: string) => {
      if (!goals || goals.length === 0) {
        // Fallback to linear projection if no goals
        return latestDayNum > 0 ? (mtd / latestDayNum) * totalDaysInMonth : 0;
      }
      
      // Sum of remaining goals (days after latestDate)
      const remainingGoals = goals
        .filter(g => g.metric_key === metricKey && g.date > latestDate)
        .reduce((sum, g) => sum + g.daily_target, 0);
      
      return mtd + remainingGoals;
    };

    // Get goals for metric
    const getGoalsByPeriod = (metricKey: string) => {
      if (!goals) return { d1: null, mtw: null, mtd: null, forecast: null };
      
      const metricGoals = goals.filter(g => g.metric_key === metricKey);
      if (metricGoals.length === 0) return { d1: null, mtw: null, mtd: null, forecast: null };

      // D-1 goal: goal for latest date
      const d1Goal = metricGoals.find(g => g.date === latestDate)?.daily_target || null;

      // MTW goal: sum of goals for MTW period - using string comparison and latestDate
      const latestDateObj = parseISO(latestDate);
      const lastMonday = new Date(latestDateObj);
      while (getDay(lastMonday) !== 1) {
        lastMonday.setDate(lastMonday.getDate() - 1);
      }
      const lastMondayStr = format(lastMonday, 'yyyy-MM-dd');
      const mtwGoal = metricGoals
        .filter(g => g.date >= lastMondayStr && g.date <= latestDate)
        .reduce((sum, g) => sum + g.daily_target, 0);

      // MTD goal: sum of all goals up to latest date
      const mtdGoal = metricGoals
        .filter(g => g.date <= latestDate)
        .reduce((sum, g) => sum + g.daily_target, 0);

      // Forecast goal: total monthly goal (sum of all daily goals for the month)
      const forecastGoal = metricGoals.reduce((sum, g) => sum + g.daily_target, 0);

      return {
        d1: d1Goal && d1Goal > 0 ? d1Goal : null,
        mtw: mtwGoal > 0 ? mtwGoal : null,
        mtd: mtdGoal > 0 ? mtdGoal : null,
        forecast: forecastGoal > 0 ? forecastGoal : null,
      };
    };

    // Build cards and table data
    const cards: MetricCard[] = [];
    const tableData: AggregatedMetric[] = [];

    for (const mapping of mappings.filter(m => m.active)) {
      const columnName = mapping.raw_column_name;
      const dailyValues = calculateDailyValuesAggregated(columnName);
      
      const d1Value = getD1(columnName);
      const mtwValue = getMTW(dailyValues);
      const mtdValue = getMTD(columnName);
      const forecastValue = getForecast(mtdValue, mapping.metric_key);
      
      const goals = getGoalsByPeriod(mapping.metric_key);

      const d1: PeriodMetric = {
        value: d1Value,
        target: goals.d1,
        achievement: goals.d1 ? ((d1Value / goals.d1) - 1) * 100 : null,
      };

      const mtw: PeriodMetric = {
        value: mtwValue,
        target: goals.mtw,
        achievement: goals.mtw ? ((mtwValue / goals.mtw) - 1) * 100 : null,
      };

      const mtd: PeriodMetric = {
        value: mtdValue,
        target: goals.mtd,
        achievement: goals.mtd ? ((mtdValue / goals.mtd) - 1) * 100 : null,
      };

      const forecast: PeriodMetric = {
        value: forecastValue,
        target: goals.forecast,
        achievement: goals.forecast ? ((forecastValue / goals.forecast) - 1) * 100 : null,
      };

      tableData.push({
        metric_key: mapping.metric_key,
        display_name: mapping.display_name,
        d1,
        mtw,
        mtd,
        forecast,
      });

      cards.push({
        key: mapping.metric_key,
        label: mapping.display_name,
        value: mtdValue,
        target: goals.mtd,
        percentage: mtd.achievement,
      });
    }

    // Calculate percentages from raw columns
    const experimentais = getMTD('cli_experimentais') || 1;
    const presenca = getMTD('cli_experimentais_presenca') || 0;
    const matriculas = getMTD('cli_matriculas_total') || 0;
    const vagasOcupadas = getMTD('qt_vagas_ocupadas') || 0;
    const vagasTotal = getMTD('qt_vagas_total') || 1;

    const pctPresenca = (presenca / experimentais) * 100;
    const pctConversaoMA = (matriculas / experimentais) * 100;
    const pctConversaoMP = presenca > 0 ? (matriculas / presenca) * 100 : 0;
    const pctOcupacao = (vagasOcupadas / vagasTotal) * 100;

    return {
      cards,
      tableData,
      pctPresenca,
      pctConversaoMA,
      pctConversaoMP,
      pctOcupacao,
    };
  }, [rawData, goals, mappings, selectedMonth]);
}

export function useHighlightMetrics(
  rawData: RawConsolidatedDaily[] | undefined,
  goals: DailyGoal[] | undefined,
  mappings: IndicatorMapping[] | undefined,
  selectedMonth: string
): MetricCard[] {
  return useMemo(() => {
    if (!rawData || rawData.length === 0 || !mappings || mappings.length === 0) {
      return [];
    }

    const [year, month] = selectedMonth.split('-').map(Number);
    const totalDaysInMonth = getDaysInMonth(new Date(year, month - 1));

    // Sort data by date
    const sortedData = [...rawData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const latestDate = sortedData[sortedData.length - 1]?.date;
    const latestDayNum = latestDate ? parseInt(latestDate.split('-')[2]) : 1;

    // Group data by date
    const dataByDate = new Map<string, Record<string, number>>();
    for (const row of sortedData) {
      const existing = dataByDate.get(row.date) || {};
      for (const key of Object.keys(row)) {
        if (key !== 'date' && key !== 'unit_id' && key !== 'id' && key !== 'created_at' && key !== 'dt_calculo') {
          const val = Number((row as any)[key]) || 0;
          existing[key] = (existing[key] || 0) + val;
        }
      }
      dataByDate.set(row.date, existing);
    }

    // Get MTD value for a column (use latest date value since data is accumulated)
    const getMTD = (columnName: string) => {
      const latestData = dataByDate.get(latestDate);
      return latestData?.[columnName] || 0;
    };

    // Get goals for MTD (sum only up to latest date with data)
    const getGoalMTD = (metricKey: string) => {
      if (!goals) return null;
      const metricGoals = goals.filter(g => g.metric_key === metricKey && g.date <= latestDate);
      const sum = metricGoals.reduce((acc, g) => acc + g.daily_target, 0);
      return sum > 0 ? sum : null;
    };

    // Build cards for highlight indicators
    const cards: MetricCard[] = [];

    for (const mapping of mappings.filter(m => m.active)) {
      const columnName = mapping.raw_column_name;
      const mtdValue = getMTD(columnName);
      const mtdGoal = getGoalMTD(mapping.metric_key);
      const achievement = mtdGoal ? ((mtdValue / mtdGoal) - 1) * 100 : null;

      cards.push({
        key: mapping.metric_key,
        label: mapping.display_name,
        value: mtdValue,
        target: mtdGoal,
        percentage: achievement,
      });
    }

    return cards;
  }, [rawData, goals, mappings, selectedMonth]);
}

export function useUnitRankings(
  rawData: RawConsolidatedDaily[] | undefined,
  units: Unit[] | undefined,
  metricKey: string,
  mappings: IndicatorMapping[] | undefined
): UnitRanking[] {
  return useMemo(() => {
    if (!rawData || !units || !mappings) return [];

    const mapping = mappings.find(m => m.metric_key === metricKey);
    const columnName = mapping?.raw_column_name || `cli_${metricKey}`;
    
    const latestDate = rawData.reduce((max, d) => d.date > max ? d.date : max, '');
    const latestData = rawData.filter(d => d.date === latestDate);

    const rankings: UnitRanking[] = latestData
      .map(d => ({
        unit_id: d.unit_id,
        unit_name: units.find(u => u.id === d.unit_id)?.name || `Unidade ${d.unit_id}`,
        value: Number((d as any)[columnName]) || 0,
        rank: 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return rankings;
  }, [rawData, units, metricKey, mappings]);
}

export function usePercentageRankings(
  rawData: RawConsolidatedDaily[] | undefined,
  units: Unit[] | undefined,
  numeratorColumn: string,
  denominatorColumn: string,
  label: string
): UnitRanking[] {
  return useMemo(() => {
    if (!rawData || !units) return [];

    const latestDate = rawData.reduce((max, d) => d.date > max ? d.date : max, '');
    const latestData = rawData.filter(d => d.date === latestDate);

    const rankings: UnitRanking[] = latestData
      .map(d => {
        const numerator = Number((d as any)[numeratorColumn]) || 0;
        const denominator = Number((d as any)[denominatorColumn]) || 1;
        const percentage = (numerator / denominator) * 100;
        
        return {
          unit_id: d.unit_id,
          unit_name: units.find(u => u.id === d.unit_id)?.name || `Unidade ${d.unit_id}`,
          value: isNaN(percentage) || !isFinite(percentage) ? 0 : percentage,
          rank: 0,
        };
      })
      .filter(r => r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return rankings;
  }, [rawData, units, numeratorColumn, denominatorColumn]);
}

export function useCalculatedHighlightMetrics(
  rawData: RawConsolidatedDaily[] | undefined,
  calculatedMetrics: CalculatedMetric[] | undefined,
  selectedMonth: string
): MetricCard[] {
  return useMemo(() => {
    if (!rawData || rawData.length === 0 || !calculatedMetrics || calculatedMetrics.length === 0) {
      return [];
    }

    // Sort data by date
    const sortedData = [...rawData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const latestDate = sortedData[sortedData.length - 1]?.date;

    // Group data by date and aggregate all units
    const dataByDate = new Map<string, Record<string, number>>();
    for (const row of sortedData) {
      const existing = dataByDate.get(row.date) || {};
      for (const key of Object.keys(row)) {
        if (key !== 'date' && key !== 'unit_id' && key !== 'id' && key !== 'created_at' && key !== 'dt_calculo') {
          const val = Number((row as any)[key]) || 0;
          existing[key] = (existing[key] || 0) + val;
        }
      }
      dataByDate.set(row.date, existing);
    }

    // Get latest aggregated data for formula evaluation
    const latestData = dataByDate.get(latestDate) || {};

    const cards: MetricCard[] = [];

    for (const metric of calculatedMetrics.filter(m => m.active)) {
      const result = evaluateFormula(metric.formula, latestData);
      
      if (result !== null) {
        const formattedValue = formatMetricValue(result, metric.format_type, metric.decimal_places);
        
        cards.push({
          key: metric.metric_key,
          label: metric.display_name,
          value: result,
          target: null,
          percentage: metric.format_type === 'percent' ? result : null,
          formattedValue,
        });
      }
    }

    return cards;
  }, [rawData, calculatedMetrics, selectedMonth]);
}
