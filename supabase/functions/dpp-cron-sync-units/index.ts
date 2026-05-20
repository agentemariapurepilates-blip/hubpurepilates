// Cron: busca unidades da página pública Pure Pilates e upserta em dpp_units.
// Disparada por pg_cron diariamente. Autentica via Bearer ${CRON_SECRET}.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { fetchPPUnits } from '../_shared/dpp-purepilates.ts';
import { startSyncLog, finishSyncLog } from '../_shared/dpp-logger.ts';

Deno.serve(async (req) => {
  const expected = `Bearer ${Deno.env.get('CRON_SECRET') ?? ''}`;
  if (req.headers.get('authorization') !== expected) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const logId = await startSyncLog(sb, 'units');
  try {
    const units = await fetchPPUnits();
    const now = new Date().toISOString();
    const rows = units.map((u) => ({
      external_id: String(u.id),
      nome: u.nome,
      latitude: u.latitude,
      longitude: u.longitude,
      last_seen_at: now,
      removed_from_source: false,
    }));
    const { error: upErr } = await sb
      .from('dpp_units')
      .upsert(rows, { onConflict: 'external_id' });
    if (upErr) throw upErr;

    // Marca como removida quem não aparece há > 4 dias
    const cutoff = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    await sb.from('dpp_units').update({ removed_from_source: true }).lt('last_seen_at', cutoff);

    await finishSyncLog(sb, logId, 'success', { upserted: rows.length });
    return new Response(JSON.stringify({ ok: true, upserted: rows.length }), {
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
