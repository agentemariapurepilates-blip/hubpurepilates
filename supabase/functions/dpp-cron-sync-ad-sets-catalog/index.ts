// Cron: espelha campanhas + ad sets do Meta em dpp_campaigns/dpp_ad_sets.
// Disparada por pg_cron diariamente. Autentica via Bearer ${CRON_SECRET}.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { listCampaigns, listAdSets } from '../_shared/dpp-meta.ts';
import { startSyncLog, finishSyncLog } from '../_shared/dpp-logger.ts';

Deno.serve(async (req) => {
  const expected = `Bearer ${Deno.env.get('CRON_SECRET') ?? ''}`;
  if (req.headers.get('authorization') !== expected) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = Deno.env.get('META_ACCESS_TOKEN');
  const accountId = Deno.env.get('META_AD_ACCOUNT_ID');
  if (!token || !accountId) {
    return new Response(
      JSON.stringify({ error: 'META_ACCESS_TOKEN ou META_AD_ACCOUNT_ID ausente' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const logId = await startSyncLog(sb, 'ad_sets_catalog');
  try {
    const now = new Date().toISOString();

    let campaigns = 0;
    for await (const c of listCampaigns(accountId, token)) {
      await sb.from('dpp_campaigns').upsert(
        {
          meta_campaign_id: c.id,
          nome: c.name,
          objetivo: c.objective ?? null,
          status: c.status ?? null,
          last_seen_at: now,
        },
        { onConflict: 'meta_campaign_id' },
      );
      campaigns++;
    }

    const { data: campaignRows } = await sb
      .from('dpp_campaigns')
      .select('id, meta_campaign_id');
    const campaignMap = new Map(
      (campaignRows ?? []).map((c) => [c.meta_campaign_id, c.id]),
    );

    let adSets = 0;
    for await (const a of listAdSets(accountId, token)) {
      await sb.from('dpp_ad_sets').upsert(
        {
          meta_ad_set_id: a.id,
          campaign_id: campaignMap.get(a.campaign_id) ?? null,
          nome: a.name,
          status: a.status ?? null,
          last_seen_at: now,
        },
        { onConflict: 'meta_ad_set_id' },
      );
      adSets++;
    }

    await finishSyncLog(sb, logId, 'success', { campaigns, ad_sets: adSets });
    return new Response(JSON.stringify({ ok: true, campaigns, ad_sets: adSets }), {
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
