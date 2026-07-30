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

      // Fetch all data for selected months' last days
      const { data: rawData, error } = await supabaseIndicadores
        .from('raw_consolidated_daily')
        .select('*')
        .in('date', lastDays)
        .not('unit_id', 'is', null);

      if (error) throw error;

      // Aggregate data by unit
      const unitAggregates = new Map<number, number[]>();

      rawData?.forEach((row) => {
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

      unitValues.forEach(unit => {
        for (let i = sortedRanges.length - 1; i >= 0; i--) {
          const range = sortedRanges[i];
          const max = range.max ?? Infinity;

          if (unit.value >= range.min && unit.value <= max) {
            results[i].units.push(unit);
            break;
          }
        }
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
