-- Módulo Leads RH: os leads dos formulários de recrutamento do Meta, e a lista
-- de quem pode vê-los.
--
-- NÃO APLICADA. O trabalho foi pedido em modo local; para aplicar:
--   supabase db push --project-ref evprrtvbvjnjixogjsmn
--
-- POR QUE OS LEADS FICAM NO BANCO, e não são buscados na Graph API a cada
-- abertura da tela:
--   1. a Graph API só devolve lead de até 90 dias — sem cópia local, o
--      histórico do RH some sozinho;
--   2. o token do Meta não pode viver no navegador;
--   3. a Graph API tem limite de requisições por hora, e a tela seria a
--      primeira a esbarrar nele.
-- A função de borda `rh-leads-sync` alimenta esta tabela.

-- ---------------------------------------------------------------------------
-- Quem pode ver os leads
-- ---------------------------------------------------------------------------

create table if not exists public.rh_leads_autorizados (
  id uuid primary key default gen_random_uuid(),
  -- Autorização por E-MAIL, e não por user_id: o RH precisa liberar alguém que
  -- ainda nem entrou no Hub pela primeira vez. Casar por user_id obrigaria a
  -- pessoa a logar antes de poder ser autorizada.
  email text not null,
  nome text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid references auth.users (id) on delete set null
);

-- Um e-mail, uma linha. Sem isto, desativar alguém deixaria a linha antiga
-- valendo e o acesso continuaria de pé.
create unique index if not exists rh_leads_autorizados_email_unico
  on public.rh_leads_autorizados (lower(email));

alter table public.rh_leads_autorizados enable row level security;

-- A lista de autorizados é gerida só por admin.
drop policy if exists "admin gerencia autorizados" on public.rh_leads_autorizados;
create policy "admin gerencia autorizados"
  on public.rh_leads_autorizados for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- Cada pessoa enxerga a própria linha, para a tela poder dizer "você tem
-- acesso" sem precisar ser admin.
drop policy if exists "cada um ve a propria autorizacao" on public.rh_leads_autorizados;
create policy "cada um ve a propria autorizacao"
  on public.rh_leads_autorizados for select
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- ---------------------------------------------------------------------------
-- Os leads
-- ---------------------------------------------------------------------------

create table if not exists public.rh_leads (
  -- O id do lead no Meta é a chave. Reprocessar o mesmo período não duplica.
  id text primary key,
  criado_em timestamptz not null,

  ad_id text,
  ad_name text,
  adset_id text,
  adset_name text,
  campaign_id text,
  campaign_name text,
  form_id text,
  form_name text,
  platform text,
  is_organic boolean not null default false,

  -- Campos de contato, já extraídos: a tela filtra e ordena por eles, e fazer
  -- isso dentro do JSON a cada consulta seria lento e sem índice.
  nome text,
  email text,
  telefone text,
  unidade_escolhida text,

  -- O formulário inteiro, como veio. Guardar só as colunas extraídas perderia
  -- as perguntas que ainda não existem — e formulário de RH ganha pergunta nova
  -- com frequência.
  field_data jsonb not null default '[]'::jsonb,

  eh_teste boolean not null default false,
  sincronizado_em timestamptz not null default now()
);

create index if not exists rh_leads_criado_em on public.rh_leads (criado_em desc);
create index if not exists rh_leads_adset on public.rh_leads (adset_id);

alter table public.rh_leads enable row level security;

-- Leitura: admin, ou quem estiver ativo na lista de autorizados.
--
-- É a regra que o pedido descreve, e ela mora AQUI, e não na tela: esconder o
-- menu no front não impede ninguém de chamar a API direto. A tela só explica o
-- que o banco já garante.
drop policy if exists "admin ou autorizado le os leads" on public.rh_leads;
create policy "admin ou autorizado le os leads"
  on public.rh_leads for select
  using (
    has_role(auth.uid(), 'admin'::app_role)
    or exists (
      select 1 from public.rh_leads_autorizados a
      where a.ativo
        and lower(a.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Escrita: ninguém pelo cliente. Só a função de borda, que usa a service role
-- e passa por cima da RLS. Sem esta ausência de policy, um autorizado poderia
-- editar o telefone de um candidato pelo navegador.

comment on table public.rh_leads is
  'Leads dos formulários de RH do Meta. Alimentada pela função rh-leads-sync.';
comment on table public.rh_leads_autorizados is
  'Quem pode ver e baixar os leads de RH. Gerida por admin na tela Leads RH.';
