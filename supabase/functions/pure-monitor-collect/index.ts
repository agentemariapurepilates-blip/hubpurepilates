// Pure Monitor — coleta de menções (Instagram + notícias) para a saúde de marca.
// Disparada pelo botão "Coletar agora" da tela (usuário autenticado) — verify_jwt
// padrão (true). Reaproveita o token da Meta já configurado no projeto
// (INSTAGRAM_GRAPH_TOKEN). Grava em public.monitor_mentions via service_role.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { metaFetch } from '../_shared/dpp-meta.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

// Conta @purepilatesbr (mesma do snapshot). Sobrescrevível por env.
const IG_USER_ID = Deno.env.get('PURE_MONITOR_IG_USER_ID') ?? '17841401806609112';
const BRAND_NAME = 'Pure Pilates';
const MAX_OWN_POSTS = 25;

interface Mention {
  id: string;
  source: string;
  channel: string;
  category: string | null;
  subtype: string | null;
  author: string | null;
  body: string;
  url: string | null;
  published_at: string;
  reach: number;
  rating: number | null;
  sentiment_label: string;
  sentiment_score: number;
  sentiment_irony: boolean;
}

// ── Sentimento léxico PT-BR (portado de src/sentiment.js do Pure Monitor) ──
const POSITIVE = [
  'amo', 'amei', 'adoro', 'adorei', 'ótimo', 'otimo', 'excelente', 'maravilhoso',
  'maravilhosa', 'incrível', 'incrivel', 'perfeito', 'perfeita', 'recomendo',
  'melhor', 'top', 'sensacional', 'nota 10', 'atenciosa', 'atencioso', 'acolhedor',
  'acolhedora', 'profissional', 'profissionais', 'qualidade', 'evoluí', 'evolui',
  'resultado', 'resultados', 'feliz', 'gratidão', 'gratidao', 'satisfeita',
  'satisfeito', 'parabéns', 'parabens', 'limpo', 'organizado', 'pontual',
];
const NEGATIVE = [
  'odeio', 'odiei', 'péssimo', 'pessimo', 'horrível', 'horrivel', 'ruim',
  'terrível', 'terrivel', 'decepção', 'decepcao', 'decepcionada', 'decepcionado',
  'caro', 'caríssimo', 'carissimo', 'demora', 'demorado', 'atrasado', 'atraso',
  'lotado', 'sujo', 'descaso', 'cancelar', 'cancelamento', 'reembolso',
  'não recomendo', 'nao recomendo', 'mal atendida', 'mal atendido',
  'desorganizado', 'lesão', 'lesao', 'machuquei', 'reclamação', 'reclamacao',
  'problema', 'problemas', 'fila', 'difícil', 'dificil', 'frustrada', 'frustrado',
];
const NEGATORS = ['não', 'nao', 'nunca', 'jamais', 'nem'];

function analyze(text: string): { label: string; score: number } {
  const t = ` ${(text || '').toLowerCase()} `;
  const words = t.trim().split(/\s+/);
  let score = 0;
  const countHits = (lexicon: string[], sign: number) => {
    for (const term of lexicon) {
      if (term.includes(' ')) {
        if (t.includes(` ${term} `)) score += sign;
        continue;
      }
      const idx = words.indexOf(term);
      if (idx !== -1) {
        const negated = words.slice(Math.max(0, idx - 2), idx).some((w) => NEGATORS.includes(w));
        score += negated ? -sign : sign;
      }
    }
  };
  countHits(POSITIVE, 1);
  countHits(NEGATIVE, -1);
  const norm = Math.max(-1, Math.min(1, score / 3));
  let label = 'neutro';
  if (norm > 0.15) label = 'positivo';
  else if (norm < -0.15) label = 'negativo';
  return { label, score: Number(norm.toFixed(2)) };
}

function mention(partial: Omit<Mention, 'sentiment_label' | 'sentiment_score' | 'sentiment_irony'>): Mention {
  const s = analyze(partial.body);
  return { ...partial, sentiment_label: s.label, sentiment_score: s.score, sentiment_irony: false };
}

// ── Coletores ──
async function collectInstagram(token: string): Promise<Mention[]> {
  const out: Mention[] = [];
  // 1) Posts de terceiros com a hashtag #purepilates
  try {
    const hs = await metaFetch<{ data?: { id: string }[] }>(
      '/ig_hashtag_search', { user_id: IG_USER_ID, q: 'purepilates' }, token,
    );
    const hashtagId = hs.data?.[0]?.id;
    if (hashtagId) {
      const rec = await metaFetch<{ data?: any[] }>(
        `/${hashtagId}/recent_media`,
        { user_id: IG_USER_ID, fields: 'id,caption,permalink,timestamp,like_count,comments_count' },
        token,
      );
      for (const p of rec.data ?? []) {
        out.push(mention({
          id: `instagram:${p.id}`, source: 'instagram', channel: 'terceiros',
          category: 'publicacao', subtype: null, author: null, body: p.caption || '',
          url: p.permalink ?? null, published_at: p.timestamp,
          reach: (p.like_count || 0) + (p.comments_count || 0), rating: null,
        }));
      }
    }
  } catch (e) {
    console.error('[ig-hashtag]', (e as Error).message);
  }
  // 2) Comentários nos posts da nossa conta oficial
  try {
    const media = await metaFetch<{ data?: any[] }>(
      `/${IG_USER_ID}/media`, { fields: 'id,permalink,timestamp,comments_count', limit: MAX_OWN_POSTS }, token,
    );
    for (const post of media.data ?? []) {
      if (!post.comments_count) continue;
      const cs = await metaFetch<{ data?: any[] }>(
        `/${post.id}/comments`, { fields: 'id,text,timestamp,username,like_count', limit: 50 }, token,
      );
      for (const c of cs.data ?? []) {
        if (!c.text) continue;
        out.push(mention({
          id: `ig-comment:${c.id || `${post.id}:${c.timestamp}`}`, source: 'instagram',
          channel: 'nossas', category: 'comentario', subtype: 'comentário',
          author: c.username ?? null, body: c.text, url: post.permalink ?? null,
          published_at: c.timestamp, reach: c.like_count || 0, rating: null,
        }));
      }
    }
  } catch (e) {
    console.error('[ig-comments]', (e as Error).message);
  }
  return out;
}

function decodeXml(s = ''): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .trim();
}

async function collectNews(): Promise<Mention[]> {
  const out: Mention[] = [];
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`"${BRAND_NAME}"`)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  try {
    const xml = await (await fetch(url, { headers: { 'User-Agent': 'PureMonitor/1.0' } })).text();
    for (const raw of xml.split(/<item>/).slice(1)) {
      const block = raw.split('</item>')[0];
      const get = (tag: string) => {
        const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
        return m ? decodeXml(m[1]) : '';
      };
      const title = get('title');
      if (!title) continue;
      const link = get('link');
      const pub = get('pubDate');
      out.push(mention({
        id: `news:${link || title}`, source: 'noticias', channel: 'midia',
        category: 'publicacao', subtype: null, author: get('source') || null,
        body: title, url: link || null,
        published_at: pub ? new Date(pub).toISOString() : new Date().toISOString(),
        reach: 0, rating: null,
      }));
    }
  } catch (e) {
    console.error('[news]', (e as Error).message);
  }
  return out;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    const token = Deno.env.get('INSTAGRAM_GRAPH_TOKEN') ?? '';
    const collected: Mention[] = [];
    if (token) collected.push(...(await collectInstagram(token)));
    collected.push(...(await collectNews()));

    let inserted = 0;
    if (collected.length) {
      // ignoreDuplicates: preserva linhas existentes (e o estado `resolved`).
      const { data, error } = await sb
        .from('monitor_mentions')
        .upsert(collected, { onConflict: 'id', ignoreDuplicates: true })
        .select('id');
      if (error) throw error;
      inserted = data?.length ?? 0;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        collected: collected.length,
        inserted,
        instagram: Boolean(token),
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('[pure-monitor-collect]', (e as Error).message);
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }
});
