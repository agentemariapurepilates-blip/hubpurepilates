# Dashboard de Mídia Adicional no Hub — Design Spec

**Data:** 2026-05-20
**Status:** Aprovado pelo usuário (Renan Vaz) — pronto pra plano de implementação
**Autor:** Brainstorming colaborativo · Renan Vaz + Claude Opus 4.7

---

## 1. Contexto

Hoje a Pure Pilates tem **dois projetos separados** que conversam com o mesmo Supabase (tabelas `dpp_*`):

1. **Hub (este projeto)** — `hub.purepilates.com.br`. Vite/React. Tem a área admin de Mídia Adicional em `/minha-area/midia-adicional`: lista de unidades, vinculação de unidade ↔ ad set do Meta, gestão de status no dashboard.
2. **Dashboard Ads - Unidades** — projeto Next.js separado. É onde franqueados logam e veem o relatório de métricas (KPIs + gráfico diário) da sua unidade.

A separação cria três problemas práticos:

- Quem é admin precisa alternar entre dois apps (e dois logins, já que a base de usuários é distinta — `profiles` no hub vs `dpp_profiles` no dashboard externo).
- O modelo de acesso atual é 1 franqueado ↔ 1 unidade (constraint `role_unit_consistency` em `dpp_profiles`). Não cobre o caso real onde um franqueado é dono de várias unidades.
- O botão "Vincular conjunto" da tela "Editar unidade" no hub está quebrado — o RPC `dpp_relink_ad_set` foi REVOKE'd de `authenticated` e só `service_role` pode chamar, mas o frontend chama direto do navegador.

## 2. Objetivo

Trazer pro hub a tela de relatório de mídia adicional (replicada 1:1 do projeto externo), com um modelo de acesso N-pra-1 (1 usuário pode ter acesso a N unidades) gerenciado pelo admin. Consertar o bug da vinculação no caminho.

## 3. Escopo

### Em escopo

- Nova tabela `dpp_user_units` (N-pra-N entre `auth.users` e `dpp_units`).
- Atualização de RLS em `dpp_units`, `dpp_ad_sets`, `dpp_unit_ad_set_link`, `dpp_ad_set_daily_metrics` pra usar `dpp_user_units` no lugar de `dpp_profiles.unit_id` quando o caller for usuário comum.
- Nova rota `/minha-area/dashboard` (réplica 1:1 do `/dashboard/page.tsx` do projeto externo), com combobox de seleção de unidade (admin vê todas; usuário comum vê só as atribuídas).
- Card novo "Usuários com acesso" na tela `/minha-area/midia-adicional/:slug` (Editar Unidade).
- Item novo "Dashboard" no Sidebar, dentro do grupo "Minha Área".
- Edge Function `dpp-admin-relink-ad-set` (conserta o bug #3 e padroniza com `dpp-admin-backfill`).
- Port dos componentes/utils do projeto externo: `KpiCard`, `ChartDaily`, `PeriodSelector`, `LastUpdateBanner`, `aggregate`, `resolveRange`.
- Testes Vitest pra `aggregate` e `resolveRange`.
- Teste de RLS via SQL (manual) confirmando isolamento de unidades por usuário.

### Fora de escopo

- Mudar/migrar `dpp_profiles` ou descontinuar o projeto Dashboard Ads externo. Ele continua funcionando paralelo com sua tabela própria.
- View agregada multi-unidade (Pergunta 4 — usuário escolheu opção A: uma unidade por vez via seletor).
- Atribuição feita do lado do usuário (Pergunta 5 — usuário escolheu opção A: só edita-se pela tela da unidade).
- Telas separadas de "lista de unidades pro admin escolher" no dashboard (Pergunta 6 — opção A: combobox com busca cobre o caso de 425+).
- Mudanças no fluxo de `midia_adicional_requests` (a outra "Mídia Adicional" — solicitações de verba — fica como está).

## 4. Decisões e justificativas (resumo do brainstorming)

| Pergunta | Decisão | Justificativa |
|---|---|---|
| Onde o usuário vê o relatório? | A — Embutir no hub | Admin tem hub + dashboard num único login/sidebar. |
| Cardinalidade usuário ↔ unidade? | 1 usuário → N unidades (definido pelo admin) | Cobre franqueado dono de várias unidades; admin é o curador. |
| Conteúdo do relatório? | Réplica 1:1 do dashboard externo | Código pronto + usuários já acostumados. |
| Navegação multi-unidade? | A — Seletor no topo | Mantém a tela idêntica à externa; uma unidade por vez. |
| De onde admin atribui? | A — Direto na tela "Editar unidade" | Fluxo "unidade nova → quem vê?" é o caso real. |
| UX do admin pra 425+ unidades? | A — Combobox com busca | Não duplica a tela `/minha-area/midia-adicional` (que já é lista). |
| Bug #3 (relink quebrado)? | Edge Function nova | Padrão do projeto pra ação admin (igual `dpp-admin-backfill`). |
| Atribuição user↔unit? | RLS direto, sem Edge Function | INSERT/DELETE simples, não justifica Function. |

## 5. Modelo de dados

### Tabela nova

```sql
CREATE TABLE dpp_user_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES dpp_units(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, unit_id)
);
CREATE INDEX idx_dpp_user_units_user ON dpp_user_units(user_id);
CREATE INDEX idx_dpp_user_units_unit ON dpp_user_units(unit_id);
```

### RLS na própria `dpp_user_units`

```sql
ALTER TABLE dpp_user_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_manage_user_units ON dpp_user_units
  FOR ALL USING (dpp_is_admin()) WITH CHECK (dpp_is_admin());

CREATE POLICY user_select_own_assignments ON dpp_user_units
  FOR SELECT USING (user_id = auth.uid());
```

### Atualização de RLS nas tabelas `dpp_*`

Substituir as policies `franqueado_select_own_*` que dependem de `dpp_user_unit_id()` por checks contra `dpp_user_units`:

```sql
-- Exemplo em dpp_units:
DROP POLICY franqueado_select_own_unit ON dpp_units;
CREATE POLICY user_select_assigned_unit ON dpp_units FOR SELECT
  USING (id IN (SELECT unit_id FROM dpp_user_units WHERE user_id = auth.uid()));
```

Mesmo padrão em `dpp_ad_sets`, `dpp_unit_ad_set_link`, `dpp_ad_set_daily_metrics` (via JOIN no `unit_id`).

A função `dpp_is_admin()` continua igual (lê `dpp_profiles.role = 'admin'`). Pra que o admin do hub seja reconhecido aqui, garantir que ele tenha linha em `dpp_profiles` com `role='admin'` e `unit_id=NULL` — já é o caso hoje.

**Decisão deliberada:** não tocar em `dpp_profiles` nem na função `dpp_user_unit_id()`. O projeto Dashboard Ads externo continua funcionando com elas. A migração completa fica pra spec futuro, se/quando o externo for descontinuado.

## 6. Arquitetura de frontend

### 6.1 Nova rota `/minha-area/dashboard`

Componente `DashboardMidiaAdicional` em `src/features/colaborador/dashboard/DashboardMidiaAdicional.tsx`. Estrutura igual à `app/dashboard/page.tsx` do externo, mas adaptado pra React Router (client-side, não server component).

- **Header** com nome+bairro da unidade selecionada
- **UnitPicker** (combobox shadcn `Command` com input de busca) — lista as unidades da query `dpp_units` que o RLS retornar. URL guarda `?unit=<external_id>` pra deep-link e refresh.
- **Banner Mídia Adicional** (texto fixo)
- **PeriodSelector** — ontem / 7d / 30d / 90d / 180d / custom; URL guarda `?range=<preset>` ou `?from=YYYY-MM-DD&to=YYYY-MM-DD`.
- **8 KpiCards** (Aulas experimentais, Custo por aula, Gasto, Alcance, Impressões, Cliques, CPM, CPC)
- **ChartDaily** (recharts) — desempenho diário spend × results.
- **LastUpdateBanner** mostrando `synced_at` do último registro.

Fetch via `@tanstack/react-query` (padrão do hub). Query keys: `['dpp_dashboard', unitId, range.from, range.to]`.

Estado vazio:
- Sem unidades atribuídas: mostra "Nenhuma unidade atribuída a você. Contate o administrador."
- Unidade sem ad set vinculado: mostra "Sua unidade ainda não tem conjunto de anúncio vinculado. Contate o administrador."
- URL com `?unit=X` que não pertence ao usuário (RLS retorna vazio): mostra "Unidade não encontrada ou sem acesso."

### 6.2 Tela `/minha-area/midia-adicional/:slug` — card novo

Adicionar o terceiro card `UsuariosComAcesso` em `MidiaAdicionalUnidade.tsx`, abaixo de "Conjunto de anúncio" e acima de "Status no dashboard".

Conteúdo:
- Lista os usuários atualmente em `dpp_user_units` pra esta unidade (JOIN com `profiles` pra pegar nome+email). Cada linha tem botão X de remover (`AlertDialog` confirma).
- Botão "Adicionar usuário" abre `Dialog` com `Command` de busca nos `profiles` (filtra os que já estão atribuídos). Selecionar grava em `dpp_user_units` via INSERT direto (RLS permite porque o caller é admin).

Component em `src/features/admin/midia-adicional/UsuariosComAcessoCard.tsx`.

### 6.3 Sidebar

Em `src/components/layout/Sidebar.tsx`, adicionar item **"Dashboard"** no grupo "Minha Área" (acima de "Mídia adicional"). Lógica de visibilidade:
- Visível se `isAdmin` é `true`
- Visível se o usuário tem ≥1 linha em `dpp_user_units`

Pra evitar query extra no render do Sidebar, expor um hook `useHasUnitAccess()` que cacheia o resultado por sessão.

### 6.4 Componentes/utils portados do projeto externo

Copiar (com mínimas adaptações):

| Origem (Dashboard Ads externo) | Destino (Hub) |
|---|---|
| `src/app/dashboard/_components/kpi-card.tsx` | `src/features/colaborador/dashboard/components/KpiCard.tsx` |
| `src/app/dashboard/_components/chart-daily.tsx` | `src/features/colaborador/dashboard/components/ChartDaily.tsx` |
| `src/app/dashboard/_components/period-selector.tsx` | `src/features/colaborador/dashboard/components/PeriodSelector.tsx` |
| `src/app/dashboard/_components/last-update-banner.tsx` | `src/features/colaborador/dashboard/components/LastUpdateBanner.tsx` |
| `src/lib/metrics.ts` (função `aggregate`) | `src/features/colaborador/dashboard/lib/aggregate.ts` |
| `src/lib/date-range.ts` (função `resolveRange`) | `src/features/colaborador/dashboard/lib/date-range.ts` |

Adaptações: trocar imports do Next pra React Router, remover `"use client"` directives (no Vite todo client), trocar `next/link` por `react-router-dom`.

## 7. Arquitetura de backend

### 7.1 Edge Function nova `dpp-admin-relink-ad-set`

Em `supabase/functions/dpp-admin-relink-ad-set/index.ts`. Mesmo padrão de `dpp-admin-backfill`:

1. Valida `Authorization` header (JWT do user).
2. Checa `user_roles.role = 'admin'` via cliente com JWT.
3. Cria cliente com `SUPABASE_SERVICE_ROLE_KEY` e chama `dpp_relink_ad_set(unit_id, ad_set_id, user_id)`.
4. Retorna `{ moved_from_unit_id, was_noop }`.
5. CORS via `_shared/cors.ts`.

Atualizar `AdSetPickerModal.tsx` pra chamar `supabase.functions.invoke('dpp-admin-relink-ad-set', { body: { unit_id, ad_set_id } })` no lugar de `supabase.rpc(...)`.

### 7.2 Atribuição de usuários (sem Edge Function)

INSERT/DELETE direto em `dpp_user_units` pelo cliente, com RLS validando admin. Nenhuma function nova precisa.

## 8. Fluxos principais

### Admin atribui João à unidade Sacomã

1. Admin abre `/minha-area/midia-adicional/sacomã`
2. No card "Usuários com acesso", clica em "Adicionar usuário"
3. Modal de busca em `profiles`; admin digita "João"
4. Seleciona → INSERT em `dpp_user_units (user_id=João, unit_id=Sacomã, created_by=admin)`
5. Card atualiza, mostra João na lista

### João abre o dashboard

1. João clica em "Dashboard" no sidebar (item agora visível porque tem 1 atribuição)
2. Rota `/minha-area/dashboard`
3. Query `dpp_units` retorna só Sacomã (RLS)
4. UnitPicker mostra Sacomã pré-selecionada (única opção)
5. KPIs + gráfico renderizam, filtrados pela `dpp_ad_set_daily_metrics` do ad set vinculado à Sacomã (RLS bloqueia outros)

### Admin abre o dashboard

1. Admin entra em `/minha-area/dashboard`
2. Query `dpp_units` retorna TODAS (RLS via `dpp_is_admin()`)
3. UnitPicker exige seleção (combobox com busca por nome/bairro)
4. Admin digita "Aclim", seleciona "Aclimação 2", dashboard renderiza
5. Admin pode trocar pra qualquer outra unidade no mesmo combobox

### Admin troca/vincula ad set de uma unidade

1. Admin abre `/minha-area/midia-adicional/aclimacao-2`
2. Clica "Vincular conjunto"
3. Modal `AdSetPickerModal` lista ad sets
4. Seleciona um → chama `supabase.functions.invoke('dpp-admin-relink-ad-set', ...)` (novo, antes era `rpc`)
5. Edge Function valida admin server-side e chama o RPC `dpp_relink_ad_set` com service_role
6. Toast de sucesso + invalidação do query cache
7. Backfill de 180d disparado em background (já existe)

## 9. Casos de borda

| Situação | Comportamento |
|---|---|
| Usuário sem atribuições acessa `/minha-area/dashboard` direto | Estado vazio "Nenhuma unidade atribuída". Sem combobox. |
| Usuário tenta `?unit=X` que não é dele | RLS bloqueia; mostra "Unidade não encontrada ou sem acesso." |
| Unidade tem `ativa_dashboard = false` | Continua aparecendo no combobox (admin pode estar conferindo); o badge "Desativada" sinaliza. Decisão: não esconder no combobox pra não criar "unidade fantasma". |
| Ad set não vinculado | Mostra mensagem "Sua unidade ainda não tem conjunto de anúncio vinculado." |
| Admin sem `dpp_user_units` próprio | Combobox mostra TODAS as unidades via RLS de admin. |
| Remover atribuição de usuário | `AlertDialog` confirma. Hard delete. Sem soft-delete (atribuição não tem histórico relevante). |
| Vincular ad set já vinculado a outra unidade | Mantém o `confirm()` atual do modal; RPC remove o vínculo antigo na mesma transação. |
| Deletar usuário do hub (cascade) | `ON DELETE CASCADE` em `user_id` remove atribuições automaticamente. |
| Deletar unidade (cascade) | `ON DELETE CASCADE` em `unit_id` remove atribuições automaticamente. |

## 10. Testes

### Vitest (unitários, portados do externo)

- `aggregate.test.ts` — soma, média, derivados (CPM, CPC, cost_per_result, reach máximo diário)
- `date-range.test.ts` — presets `ontem/7d/30d/90d/180d` e modo custom

### Manual / SQL

Roteiro pra rodar no Supabase SQL Editor depois do deploy:

```sql
-- 1. Criar usuário test
-- 2. INSERT dpp_user_units (user_id=test, unit_id=Sacomã)
-- 3. Como test: SELECT * FROM dpp_units → só Sacomã
-- 4. Como test: SELECT * FROM dpp_units WHERE id = '<id Aclimação>' → vazio
-- 5. DELETE dpp_user_units WHERE user_id=test
-- 6. Como test: SELECT * FROM dpp_units → vazio
```

### Smoke manual

- Vincular ad set via tela "Editar unidade" → confirma toast de sucesso + backfill iniciado.
- Atribuir/remover usuário → confirma persistência ao recarregar.
- Logar como usuário comum, verificar que sidebar mostra "Dashboard" só se atribuído.
- Logar como admin, verificar que combobox lista todas as unidades.

## 11. Migrations e ordem de deploy

Ordem das migrations novas (timestamp 2026-05-20 ou posterior):

1. `<ts>_dpp_user_units_table.sql` — cria tabela + índices + RLS própria
2. `<ts>_dpp_user_units_rls_units.sql` — substitui policies em `dpp_units`, `dpp_ad_sets`, `dpp_unit_ad_set_link`, `dpp_ad_set_daily_metrics`

Edge Function:

3. `supabase/functions/dpp-admin-relink-ad-set/index.ts` — código novo
4. Atualizar `supabase/config.toml` se necessário pra registrar a função

Frontend:

5. Mover/portar componentes do externo
6. Criar `DashboardMidiaAdicional.tsx`
7. Criar `UsuariosComAcessoCard.tsx`
8. Atualizar `Sidebar.tsx` (item novo) e `App.tsx` (rota nova)
9. Atualizar `AdSetPickerModal.tsx` (troca `rpc` por `functions.invoke`)

Deploy: testar localmente, depois seguir o protocolo de [CLAUDE.md](../../../CLAUDE.md) pra `./deploy.sh` (commit + push antes).

## 12. Pendências e riscos

- **`dpp_profiles` continua existindo.** O dashboard externo continua usando. Risco baixo de inconsistência (duas fontes de verdade pra "esse user vê qual unidade"); mitigado por não modificar `dpp_profiles` neste spec. Migração unificada fica pra depois.
- **Sidebar query extra:** o check "tem ≥1 atribuição" adiciona uma query ao carregar a sidebar. Mitigado via React Query cache (5 min).
- **Combobox com 425 itens:** medir performance; se necessário, adicionar virtualização (`react-window`). Provavelmente desnecessário porque o `Command` do cmdk já filtra eficientemente.
- **`dpp_is_admin()` lê de `dpp_profiles`.** Se um admin do hub não tiver linha lá, RLS quebra. Validar antes do deploy. Alternativa: trocar `dpp_is_admin()` pra ler de `user_roles.role` (mais "fonte única" pro hub) — mas mexe na função usada pelo externo também. Manter como está por enquanto.
