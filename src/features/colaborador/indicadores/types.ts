export interface Unit {
  id: number;
  name: string;
  slug: string | null;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RawConsolidatedDaily {
  id: number;
  unit_id: number;
  date: string;
  created_at: string;
  [key: string]: number | string | null;
}

export interface IndicatorMapping {
  id: number;
  metric_key: string;
  raw_column_name: string;
  display_name: string;
  data_type: string;
  category: string | null;
  active: boolean;
  show_in_dashboard: boolean;
  show_in_daily: boolean;
  show_as_highlight: boolean;
  dashboard_order: number;
  daily_order: number;
  created_at: string;
}

export interface DailyGoal {
  id: number;
  unit_id: number | null;
  date: string;
  metric_key: string;
  daily_target: number;
  created_at: string;
}

export interface DynamicColumn {
  id: number;
  column_name: string;
  data_type: string;
  created_at: string;
}

export interface CalculatedMetric {
  id: number;
  metric_key: string;
  display_name: string;
  formula: string;
  format_type: 'number' | 'currency' | 'percent';
  decimal_places: number;
  category: string | null;
  active: boolean;
  show_in_dashboard: boolean;
  show_as_highlight: boolean;
  show_in_daily: boolean;
  dashboard_order: number;
  daily_order: number;
  created_at: string;
}

export interface MetricCard {
  key: string;
  label: string;
  value: number;
  target: number | null;
  percentage: number | null;
  trend?: 'up' | 'down' | 'neutral';
  formattedValue?: string;
}

export interface PeriodMetric {
  value: number;
  target: number | null;
  achievement: number | null;
}

export interface AggregatedMetric {
  metric_key: string;
  display_name: string;
  d1: PeriodMetric;
  mtw: PeriodMetric;
  mtd: PeriodMetric;
  forecast: PeriodMetric;
}

export interface UnitRanking {
  unit_id: number;
  unit_name: string;
  value: number;
  rank: number;
}

export interface DailyMetric {
  date: string;
  daily_value: number;
  cumulative_value: number;
  target: number | null;
  achievement_pct: number | null;
}

