// Admin: backfill de 180 dias de métricas de UM ad set, em janelas de 30 dias.
// Chamado pelo client React (via supabase.functions.invoke). Valida que o
// caller é admin (user_roles.role='admin') e usa service_role pra escrever.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getInsights, computeDerived } from '../_shared/dpp-meta.ts';
import { startSyncLog, finishSyncLog } from '../_shared/dpp-logger.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'No authorization header' }, 401);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Valida quem é o caller (com JWT do user)
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

  const { data: roleData } = await userClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (!roleData) return json({ error: 'Apenas admins podem disparar backfill' }, 403);

  const body = (await req.json()) as { ad_set_id?: string; days?: number };
  const adSetId = body.ad_set_id;
  const days = body.days ?? 180;
  if (!adSetId) return json({ error: 'ad_set_id é obrigatório' }, 400);

  const token = Deno.env.get('META_ACCESS_TOKEN');
  if (!token) return json({ error: 'META_ACCESS_TOKEN ausente' }, 500);

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const logId = await startSyncLog(sb, 'backfill');
  try {
    const { data: adSet } = await sb
      .from('dpp_ad_sets')
      .select('id, meta_ad_set_id')
      .eq('id', adSetId)
      .maybeSingle();
    if (!adSet) throw new Error(`Ad set ${adSetId} não encontrado`);

    const today = new Date();
    const todayYmd = ymd(today);
    let inserted = 0;
    const windowSize = 30;

    for (let offset = days - 1; offset >= 0; offset -= windowSize) {
      const to = ymd(new Date(today.getTime() - Math.max(0, offset - windowSize + 1) * 86400000));
      const from = ymd(new Date(today.getTime() - offset * 86400000));
      const insights = await getInsights(adSet.meta_ad_set_id, from, to, token);
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
        await sb
          .from('dpp_ad_set_daily_metrics')
          .upsert(rows, { onConflict: 'ad_set_id,date' });
        inserted += rows.length;
      }
    }

    await finishSyncLog(sb, logId, 'success', { ad_set_id: adSetId, inserted, days });
    return json({ ok: true, inserted });
  } catch (e) {
    await finishSyncLog(sb, logId, 'error', { error: String(e), ad_set_id: adSetId });
    return json({ error: String(e) }, 500);
  }
});
