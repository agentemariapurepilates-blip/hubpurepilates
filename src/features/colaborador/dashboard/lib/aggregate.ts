// Port direto de "Dashboard Ads - Unidades"/src/lib/metrics.ts (sem alteração).

export type DailyMetric = {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  results: number;
  reach: number;
};

export type Derived = {
  cpm: number | null;
  cpc: number | null;
  cost_per_result: number | null;
};

export type Aggregated = DailyMetric & Derived & { from: string; to: string };

export function computeDerived(
  m: Pick<DailyMetric, 'impressions' | 'clicks' | 'spend' | 'results'>,
): Derived {
  return {
    cpm: m.impressions > 0 ? (m.spend / m.impressions) * 1000 : null,
    cpc: m.clicks > 0 ? m.spend / m.clicks : null,
    cost_per_result: m.results > 0 ? m.spend / m.results : null,
  };
}

export function aggregate(days: DailyMetric[]): Aggregated {
  if (days.length === 0) {
    return {
      date: '', from: '', to: '', impressions: 0, clicks: 0, spend: 0, results: 0, reach: 0,
      cpm: null, cpc: null, cost_per_result: null,
    };
  }
  const total = days.reduce(
    (a, d) => ({
      impressions: a.impressions + d.impressions,
      clicks: a.clicks + d.clicks,
      spend: a.spend + d.spend,
      results: a.results + d.results,
    }),
    { impressions: 0, clicks: 0, spend: 0, results: 0 },
  );
  // reach NÃO pode ser somado entre dias — métrica de usuários únicos.
  // Máximo diário como lower bound conservador.
  const reach = Math.max(...days.map((d) => d.reach));
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  return {
    date: sorted[0].date,
    from: sorted[0].date,
    to: sorted[sorted.length - 1].date,
    ...total,
    reach,
    ...computeDerived(total),
  };
}
