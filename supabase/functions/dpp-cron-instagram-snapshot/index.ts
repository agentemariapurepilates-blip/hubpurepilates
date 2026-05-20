// Cron: snapshot diário de seguidores/posts das contas Instagram Business da Pure Pilates.
// Disparada por pg_cron diariamente. Autentica via Bearer ${CRON_SECRET}.
// Upserta em (date, account_id) — idempotente se rodar mais de uma vez no mesmo dia.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { metaFetch } from '../_shared/dpp-meta.ts';

interface IGAccount {
  id: string;
  username: string;
  followers_count: number;
  media_count: number;
}

interface Page {
  id: string;
  name: string;
  instagram_business_account?: IGAccount;
}

interface PagesResponse {
  data: Page[];
}

Deno.serve(async (req) => {
  const expected = `Bearer ${Deno.env.get('CRON_SECRET') ?? ''}`;
  if (req.headers.get('authorization') !== expected) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = Deno.env.get('INSTAGRAM_GRAPH_TOKEN');
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'INSTAGRAM_GRAPH_TOKEN not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    const result = await metaFetch<PagesResponse>(
      '/me/accounts',
      {
        fields: 'instagram_business_account{id,username,followers_count,media_count}',
        limit: 100,
      },
      token,
    );

    const today = new Date().toISOString().slice(0, 10);
    const rows = result.data
      .map((p) => p.instagram_business_account)
      .filter((a): a is IGAccount => Boolean(a))
      .map((a) => ({
        date: today,
        account_id: a.id,
        username: a.username,
        followers_count: a.followers_count,
        media_count: a.media_count,
      }));

    const { error: upErr } = await sb
      .from('instagram_metrics_daily')
      .upsert(rows, { onConflict: 'date,account_id' });
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ ok: true, upserted: rows.length, date: today }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
