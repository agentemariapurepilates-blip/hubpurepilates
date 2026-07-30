import { useQuery } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import { format, endOfMonth, parse } from 'date-fns';
import { evaluateFormula } from '../lib/formulaParser';
import type { IndicatorMapping, CalculatedMetric } from '../types';

export interface AnalysisFilter {
  id: string;
  metricKey: string;
  isCalculated: boolean;
  operator: '>=' | '<=' | '>' | '<' | '=';
  value: number;
}

export interface UnitAnalysis {
  id: number;
  name: string;
  values: Record<string, number | null>;
}

export interface MetricSummary {
  key: string;
  name: string;
  avg: number;
  min: number;
  max: number;
  sum: number;
  formatType?: string;
  decimalPlaces?: number;
}

export interface AnalysisResult {
  filteredUnits: UnitAnalysis[];
  totalUnits: number;
  summary: MetricSummary[];
}

type Aggregation = 'avg' | 'sum' | 'max' | 'min' | 'last';

function aggregate(values: number[], agg: Aggregation): number {
  if (values.length === 0) return 0;
  switch (agg) {
    case 'sum': return values.reduce((a, b) => a + b, 0);
    case 'max': return Math.max(...values);
    case 'min': return Math.min(...values);
    case 'last': return values[values.length - 1];
    case 'avg':
    default:
      return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

function applyOperator(val: number | null, op: AnalysisFilter['operator'], target: number): boolean {
  if (val === null || val === undefined) return false;
  switch (op) {
    case '>=': return val >= target;
    case '<=': return val <= target;
    case '>': return val > target;
    case '<': return val < target;
    case '=': return val === target;
    default: return false;
  }
}

interface AnalysisConfig {
  months: string[];
  aggregation: Aggregation;
  filters: AnalysisFilter[];
  indicators: IndicatorMapping[];
  calculatedMetrics: CalculatedMetric[];
}

export function useAnalysisData(config: AnalysisConfig | null) {
  return useQuery({
    queryKey: ['indicadores_analysis-data', config],
    queryFn: async (): Promise<AnalysisResult> => {
      if (!config || config.months.length === 0) {
        return { filteredUnits: [], totalUnits: 0, summary: [] };
      }

      const { months, aggregation: agg, filters, indicators, calculatedMetrics } = config;

      // 1. Get last day with data for each month
      const lastDays: string[] = [];
      for (const month of months) {
        const startDate = `${month}-01`;
        const endDate = format(endOfMonth(parse(month, 'yyyy-MM', new Date())), 'yyyy-MM-dd');
        const { data } = await supabaseIndicadores
          .from('raw_consolidated_daily')
          .select('date')
          .gte('date', startDate)
          .lte('date', endDate)
          .not('unit_id', 'is', null)
          .order('date', { ascending: false })
          .limit(1);
        if (data?.length) lastDays.push(data[0].date);
      }

      if (lastDays.length === 0) {
        return { filteredUnits: [], totalUnits: 0, summary: [] };
      }

      // 2. Fetch units
      const { data: units } = await supabaseIndicadores
        .from('units')
        .select('id, name')
        .eq('active', true);
      const unitMap = new Map(units?.map(u => [u.id, u.name]) || []);

      // 3. Fetch raw data for those days
      const { data: rawData, error } = await supabaseIndicadores
        .from('raw_consolidated_daily')
        .select('*')
        .in('date', lastDays)
        .not('unit_id', 'is', null);
      if (error) throw error;

      // 4. Get all raw_column_names from active indicators
      const rawColumns = indicators.map(i => i.raw_column_name);

      // 5. Aggregate by unit for each raw column
      const unitRawValues = new Map<number, Map<string, number[]>>();

      rawData?.forEach(row => {
        const unitId = row.unit_id as number;
        if (!unitMap.has(unitId)) return;

        if (!unitRawValues.has(unitId)) {
          unitRawValues.set(unitId, new Map());
        }
        const unitCols = unitRawValues.get(unitId)!;

        for (const col of rawColumns) {
          const val = (row as Record<string, unknown>)[col] as number | null;
          if (val !== null && val !== undefined) {
            if (!unitCols.has(col)) unitCols.set(col, []);
            unitCols.get(col)!.push(Number(val));
          }
        }
      });

      // 6. Build UnitAnalysis with aggregated raw values + calculated metrics
      const allUnits: UnitAnalysis[] = [];

      unitRawValues.forEach((colMap, unitId) => {
        const values: Record<string, number | null> = {};

        // Aggregate raw columns
        for (const ind of indicators) {
          const arr = colMap.get(ind.raw_column_name);
          values[ind.raw_column_name] = arr ? aggregate(arr, agg) : null;
        }

        // Calculate calculated metrics using aggregated raw values
        for (const cm of calculatedMetrics) {
          values[cm.metric_key] = evaluateFormula(cm.formula, values);
        }

        allUnits.push({
          id: unitId,
          name: unitMap.get(unitId) || `Unidade ${unitId}`,
          values,
        });
      });

      // 7. Apply filters (AND)
      const filteredUnits = filters.length === 0
        ? allUnits
        : allUnits.filter(unit =>
            filters.every(f => {
              const key = f.isCalculated
                ? f.metricKey
                : indicators.find(i => i.raw_column_name === f.metricKey)?.raw_column_name || f.metricKey;
              return applyOperator(unit.values[key] ?? null, f.operator, f.value);
            })
          );

      // 8. Build summary for all metrics
      const allMetricKeys: { key: string; name: string; formatType?: string; decimalPlaces?: number }[] = [
        ...indicators.map(i => ({ key: i.raw_column_name, name: i.display_name })),
        ...calculatedMetrics.map(cm => ({
          key: cm.metric_key,
          name: cm.display_name,
          formatType: cm.format_type,
          decimalPlaces: cm.decimal_places,
        })),
      ];

      const summary: MetricSummary[] = allMetricKeys.map(mk => {
        const vals = filteredUnits
          .map(u => u.values[mk.key])
          .filter((v): v is number => v !== null && v !== undefined);

        if (vals.length === 0) {
          return { ...mk, avg: 0, min: 0, max: 0, sum: 0 };
        }

        return {
          ...mk,
          avg: vals.reduce((a, b) => a + b, 0) / vals.length,
          min: Math.min(...vals),
          max: Math.max(...vals),
          sum: vals.reduce((a, b) => a + b, 0),
        };
      });

      return {
        filteredUnits,
        totalUnits: allUnits.length,
        summary,
      };
    },
    enabled: !!config && config.months.length > 0,
  });
}
