// Helpers da Meta Graph API usados pelos crons e backfill do dashboard de ads.
// Portado de src/lib/meta/* do repo agentemariapurepilates-blip/dashboard-ads-unidades.

const GRAPH_API_VERSION = Deno.env.get('META_GRAPH_VERSION') ?? 'v20.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class MetaApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`Meta API ${status}: ${body.slice(0, 500)}`);
  }
}

export async function metaFetch<T>(
  path: string,
  params: Record<string, string | number>,
  token: string,
): Promise<T> {
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new MetaApiError(r.status, await r.text());
  return r.json() as Promise<T>;
}

export async function* paginate<T>(
  path: string,
  params: Record<string, string | number>,
  token: string,
): AsyncGenerator<T> {
  let next: string | null = null;
  do {
    const url = next ? new URL(next) : new URL(`${GRAPH_API_BASE}${path}`);
    if (!next) {
      url.searchParams.set('access_token', token);
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    }
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new MetaApiError(r.status, await r.text());
    const json = (await r.json()) as { data: T[]; paging?: { next?: string } };
    for (const item of json.data) yield item;
    next = json.paging?.next ?? null;
  } while (next);
}

export type MetaCampaign = { id: string; name: string; objective?: string; status?: string };
export type MetaAdSet = { id: string; name: string; campaign_id: string; status?: string };

export function listCampaigns(adAccountId: string, token: string) {
  return paginate<MetaCampaign>(
    `/${adAccountId}/campaigns`,
    { fields: 'id,name,objective,status,updated_time', limit: 500 },
    token,
  );
}

export function listAdSets(adAccountId: string, token: string) {
  return paginate<MetaAdSet>(
    `/${adAccountId}/adsets`,
    { fields: 'id,name,campaign_id,status,updated_time', limit: 500 },
    token,
  );
}

export type MetaAction = { action_type: string; value: string };

// O Meta retorna o mesmo evento sob dois nomes ao mesmo tempo quando vem do
// Pixel web. Somar inflaciona em dobro. O Ads Manager mostra o namespaced.
export function sumResults(actions: MetaAction[] | undefined): number {
  if (!actions) return 0;
  const pixel = actions.find(
    (a) => a.action_type === 'offsite_conversion.fb_pixel_complete_registration',
  );
  if (pixel) return Number(pixel.value || 0);
  const generic = actions.find((a) => a.action_type === 'complete_registration');
  if (generic) return Number(generic.value || 0);
  return 0;
}

export type DailyInsight = {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  results: number;
};

export async function getInsights(
  adSetId: string,
  fromYmd: string,
  toYmd: string,
  token: string,
): Promise<DailyInsight[]> {
  const json = await metaFetch<{ data: Array<{
    date_start: string;
    impressions?: string;
    clicks?: string;
    spend?: string;
    reach?: string;
    actions?: MetaAction[];
  }> }>(
    `/${adSetId}/insights`,
    {
      fields: 'impressions,clicks,spend,reach,actions',
      time_increment: 1,
      time_range: JSON.stringify({ since: fromYmd, until: toYmd }),
      limit: 500,
    },
    token,
  );
  return (json.data ?? []).map((row) => ({
    date: row.date_start,
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    spend: Number(row.spend ?? 0),
    reach: Number(row.reach ?? 0),
    results: sumResults(row.actions),
  }));
}

export function computeDerived(m: { impressions: number; clicks: number; spend: number; results: number }) {
  return {
    cpm: m.impressions > 0 ? (m.spend / m.impressions) * 1000 : null,
    cpc: m.clicks > 0 ? m.spend / m.clicks : null,
    cost_per_result: m.results > 0 ? m.spend / m.results : null,
  };
}
