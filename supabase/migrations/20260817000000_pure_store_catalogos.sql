-- Pure Store — catálogo digital por unidade.
-- Mapeia o slug do link público para o nome da unidade + WhatsApp de pedidos.
-- Já APLICADA em produção via Management API (não usar db push — histórico remoto vazio).
-- Serve como documentação do schema no repo.

create table if not exists public.catalogos (
  slug text primary key,
  nome text not null,
  whatsapp text not null,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.catalogos enable row level security;

grant select on public.catalogos to anon, authenticated;
grant insert, update on public.catalogos to authenticated;

-- Leitura pública: o catálogo é aberto (cliente final, sem login).
drop policy if exists catalogos_select_public on public.catalogos;
create policy catalogos_select_public on public.catalogos
  for select using (true);

-- Escrita só do dono (franqueado logado no Hub).
drop policy if exists catalogos_insert_own on public.catalogos;
create policy catalogos_insert_own on public.catalogos
  for insert to authenticated with check (owner = auth.uid());

drop policy if exists catalogos_update_own on public.catalogos;
create policy catalogos_update_own on public.catalogos
  for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
