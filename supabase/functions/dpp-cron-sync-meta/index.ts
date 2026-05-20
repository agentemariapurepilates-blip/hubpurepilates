// Cron: pra cada ad set vinculado a uma unidade, puxa insights diários
// dos últimos 7 dias (janela rolling) e atualiza dpp_ad_set_daily_metrics.
// Autentica via Bearer ${CRON_SECRET}.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getInsights, computeDerived } from '../_shared/dpp-meta.ts';
import { startSyncLog, finishSyncLog } from '../_shared/dpp-logger.ts';

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  const expected = `Bearer ${Deno.env.get('CRON_SECRET') ?? ''}`;
  if (req.headers.get('authorization') !== expected) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = Deno.env.get('META_ACCESS_TOKEN');
  if (!token) {
    return new Response(JSON.stringify({ error: 'META_ACCESS_TOKEN ausente' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const daysWindow = 7;
  const today = new Date();
  const todayYmd = ymd(today);
  const from = ymd(new Date(today.getTime() - (daysWindow - 1) * 86400000));

  const logId = await startSyncLog(sb, 'meta');
  try {
    const { data: links, error: linkErr } = await sb
      .from('dpp_unit_ad_set_link')
      .select('ad_set_id, dpp_ad_sets!inner(meta_ad_set_id, id)');
    if (linkErr) throw linkErr;

    const errors: { ad_set_id: string; message: string }[] = [];
    let inserted = 0;

    for (const link of links ?? []) {
      const adSet = (link as unknown as {
        dpp_ad_sets: { meta_ad_set_id: string; id: string };
      }).dpp_ad_sets;
      try {
        const insights = await getInsights(adSet.meta_ad_set_id, from, todayYmd, token);
        const rows = insights.map((d) => ({
          ad_set_id: adSet.id,
          date: d.date,
          impressions: d.impressions,
          clicks: d.clicks,
          spend: d.spend,
          results: d.results,
          reach: d.reach,
          ...computeDerived(d),
          is_partial: d.date === todayYmd,
          synced_at: new Date().toISOString(),
        }));
        if (rows.length > 0) {
          const { error: upErr } = await sb
            .from('dpp_ad_set_daily_metrics')
            .upsert(rows, { onConflict: 'ad_set_id,date' });
          if (upErr) throw upErr;
          inserted += rows.length;
        }
      } catch (e) {
        errors.push({ ad_set_id: adSet.meta_ad_set_id, message: String(e) });
      }
    }

    const total = links?.length ?? 0;
    const status: 'success' | 'partial' | 'error' =
      errors.length === 0 ? 'success' : errors.length === total ? 'error' : 'partial';
    await finishSyncLog(sb, logId, status, { ad_sets: total, inserted, errors });
    return new Response(JSON.stringify({ ok: status !== 'error', inserted, errors }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    await finishSyncLog(sb, logId, 'error', { error: String(e) });
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
