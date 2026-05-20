// Retorna métricas públicas das contas Instagram Business vinculadas ao System User
// "Pure Pilates - Hub". Usa o token global INSTAGRAM_GRAPH_TOKEN (não depende de OAuth do usuário).
// Também retorna histórico de 30 dias dos snapshots gravados por `dpp-cron-instagram-snapshot`.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { metaFetch } from '../_shared/dpp-meta.ts';

interface IGAccount {
  id: string;
  username: string;
  followers_count: number;
  media_count: number;
  profile_picture_url?: string;
  name?: string;
}

interface Page {
  id: string;
  name: string;
  instagram_business_account?: IGAccount;
}

interface PagesResponse {
  data: Page[];
}

interface HistoryRow {
  date: string;
  account_id: string;
  username: string;
  followers_count: number;
  media_count: number;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const token = Deno.env.get('INSTAGRAM_GRAPH_TOKEN');
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'INSTAGRAM_GRAPH_TOKEN not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const liveP = metaFetch<PagesResponse>(
      '/me/accounts',
      {
        fields:
          'name,instagram_business_account{id,username,followers_count,media_count,profile_picture_url,name}',
        limit: 100,
      },
      token,
    );

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const historyP = sb
      .from('instagram_metrics_daily')
      .select('date,account_id,username,followers_count,media_count')
      .gte('date', cutoff)
      .order('date', { ascending: true });

    const [live, historyRes] = await Promise.all([liveP, historyP]);

    const accounts = live.data
      .map((p) => p.instagram_business_account)
      .filter((a): a is IGAccount => Boolean(a))
      .sort((a, b) => b.followers_count - a.followers_count);

    const history = (historyRes.data ?? []) as HistoryRow[];

    return new Response(
      JSON.stringify({ accounts, history, fetched_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
