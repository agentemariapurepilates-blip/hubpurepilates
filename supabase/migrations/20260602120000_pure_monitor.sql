-- Pure Monitor — social listening / saúde de marca da Pure Pilates.
-- Tabela de menções coletadas (Instagram + notícias), populada pela Edge
-- Function `pure-monitor-collect`. Cada menção é classificada num canal
-- (terceiros | nossas | midia) e num sentimento (positivo | neutro | negativo).
-- Alertas = menções negativas; ficam visíveis até `resolved = true`.

create table if not exists public.monitor_mentions (
  id text primary key,                       -- ex.: 'ig-comment:123', 'news:<link>'
  source text not null,                       -- instagram | noticias | x | google
  channel text not null,                      -- terceiros | nossas | midia
  category text,                              -- publicacao | comentario | avaliacao
  subtype text,
  author text,
  body text not null,                         -- texto da menção
  url text,
  published_at timestamptz not null,
  reach integer not null default 0,
  rating integer,
  sentiment_label text not null default 'neutro',
  sentiment_score numeric,
  sentiment_irony boolean not null default false,
  resolved boolean not null default false,    -- estado do alerta (negativas)
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists monitor_mentions_published_idx
  on public.monitor_mentions (published_at desc);
create index if not exists monitor_mentions_channel_idx
  on public.monitor_mentions (channel);
create index if not exists monitor_mentions_sentiment_idx
  on public.monitor_mentions (sentiment_label);
-- alertas em aberto: negativas não resolvidas
create index if not exists monitor_mentions_open_alerts_idx
  on public.monitor_mentions (published_at desc)
  where sentiment_label = 'negativo' and resolved = false;

alter table public.monitor_mentions enable row level security;

-- Leitura: qualquer usuário autenticado do hub.
drop policy if exists "monitor_mentions_select_authenticated" on public.monitor_mentions;
create policy "monitor_mentions_select_authenticated"
  on public.monitor_mentions
  for select
  to authenticated
  using (true);

-- Atualização: autenticados podem marcar/reabrir alertas (resolved).
-- A inserção das menções é feita pela Edge Function via service_role (ignora RLS).
drop policy if exists "monitor_mentions_update_authenticated" on public.monitor_mentions;
create policy "monitor_mentions_update_authenticated"
  on public.monitor_mentions
  for update
  to authenticated
  using (true)
  with check (true);
