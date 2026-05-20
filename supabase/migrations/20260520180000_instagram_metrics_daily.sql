-- Snapshot diário das métricas públicas das contas Instagram Business da Pure Pilates.
-- Populada pela Edge Function `dpp-cron-instagram-snapshot`, schedulada via pg_cron.

create table if not exists public.instagram_metrics_daily (
  id bigserial primary key,
  date date not null,
  account_id text not null,
  username text not null,
  followers_count integer not null,
  media_count integer not null,
  created_at timestamptz not null default now(),
  unique (date, account_id)
);

create index if not exists instagram_metrics_daily_date_idx
  on public.instagram_metrics_daily (date desc);

create index if not exists instagram_metrics_daily_account_date_idx
  on public.instagram_metrics_daily (account_id, date desc);

alter table public.instagram_metrics_daily enable row level security;

drop policy if exists "instagram_metrics_daily_select_authenticated"
  on public.instagram_metrics_daily;

create policy "instagram_metrics_daily_select_authenticated"
  on public.instagram_metrics_daily
  for select
  to authenticated
  using (true);
