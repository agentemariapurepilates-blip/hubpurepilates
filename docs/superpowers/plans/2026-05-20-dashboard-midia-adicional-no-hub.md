# Dashboard de Mídia Adicional no Hub — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trazer o relatório de Mídia Adicional pro hub (réplica 1:1 do projeto externo Dashboard Ads - Unidades), com modelo N-pra-1 (1 usuário → N unidades) gerenciado pelo admin, e consertar o bug do botão "Vincular conjunto".

**Architecture:**
- Nova tabela `dpp_user_units` (many-to-many user↔unidade) com RLS gerenciada por admin.
- Atualização das policies de `dpp_*` pra ler atribuições da tabela nova quando o caller for usuário comum.
- Edge Function `dpp-admin-relink-ad-set` valida admin server-side e chama o RPC existente (que só aceita service_role).
- Componentes (`KpiCard`, `ChartDaily`, `PeriodSelector`, `LastUpdateBanner`, `aggregate`, `resolveRange`) portados do projeto Next.js externo (`c:/Users/renan/Projetos/Dashboard Ads - Unidades/src/...`) pro Vite/React do hub. Adapta `next/navigation` → `react-router-dom`, remove `"use client"`.

**Tech Stack:** Vite + React 18 + TypeScript + shadcn/ui + Tailwind + Supabase (Postgres + RLS + Edge Functions Deno) + @tanstack/react-query + recharts + date-fns + sonner + Vitest.

**Spec:** [`docs/superpowers/specs/2026-05-20-dashboard-midia-adicional-no-hub-design.md`](../specs/2026-05-20-dashboard-midia-adicional-no-hub-design.md)

---

## File Structure

### Criar
| Caminho | Responsabilidade |
|---|---|
| `supabase/migrations/20260520000000_dpp_user_units_table.sql` | Tabela `dpp_user_units` + RLS própria |
| `supabase/migrations/20260520000010_dpp_user_units_rls.sql` | Substitui policies `franqueado_select_own_*` em `dpp_units`, `dpp_ad_sets`, `dpp_unit_ad_set_link`, `dpp_ad_set_daily_metrics` |
| `supabase/functions/dpp-admin-relink-ad-set/index.ts` | Edge Function que valida admin e chama o RPC `dpp_relink_ad_set` com service_role |
| `src/features/colaborador/dashboard/lib/aggregate.ts` | Soma + métricas derivadas (port direto do externo) |
| `src/features/colaborador/dashboard/lib/aggregate.test.ts` | Testes unitários |
| `src/features/colaborador/dashboard/lib/date-range.ts` | Resolução de presets de período (port direto) |
| `src/features/colaborador/dashboard/lib/date-range.test.ts` | Testes unitários |
| `src/features/colaborador/dashboard/components/KpiCard.tsx` | Card de KPI com tooltip (port) |
| `src/features/colaborador/dashboard/components/ChartDaily.tsx` | Gráfico spend × results (port) |
| `src/features/colaborador/dashboard/components/PeriodSelector.tsx` | Botões de preset + popover de range custom (port + adaptação React Router) |
| `src/features/colaborador/dashboard/components/LastUpdateBanner.tsx` | Banner de status do último sync (port) |
| `src/features/colaborador/dashboard/components/UnitPicker.tsx` | Combobox shadcn com busca; lista as unidades acessíveis ao caller |
| `src/features/colaborador/dashboard/DashboardMidiaAdicional.tsx` | Página `/minha-area/dashboard` (orquestra UnitPicker + PeriodSelector + KPIs + Chart) |
| `src/features/colaborador/dashboard/hooks/useHasUnitAccess.ts` | Hook cacheado pra Sidebar saber se exibir o item "Dashboard" |
| `src/features/admin/midia-adicional/UsuariosComAcessoCard.tsx` | Card "Usuários com acesso" pra tela Editar Unidade |

### Modificar
| Caminho | Mudança |
|---|---|
| `src/App.tsx` | Adicionar rota `/minha-area/dashboard` |
| `src/components/layout/Sidebar.tsx` | Adicionar item "Dashboard" em `minhaAreaNavigation` |
| `src/features/admin/midia-adicional/AdSetPickerModal.tsx:64-88` | Trocar `supabase.rpc('dpp_relink_ad_set', ...)` por `supabase.functions.invoke('dpp-admin-relink-ad-set', ...)` |
| `src/features/admin/midia-adicional/MidiaAdicionalUnidade.tsx` | Adicionar o novo card `<UsuariosComAcessoCard unitId={unit.id} />` entre os dois cards existentes |

---

## Chunk 1: Migrations de banco (tabela + RLS)

### Task 1: Criar tabela `dpp_user_units`

**Files:**
- Create: `supabase/migrations/20260520000000_dpp_user_units_table.sql`

- [ ] **Step 1: Escrever a migration**

```sql
-- 20260520000000_dpp_user_units_table.sql
-- Tabela de atribuição N-pra-N entre usuários do hub e unidades.
-- Substitui (no contexto do hub) o vínculo 1-pra-1 de dpp_profiles.unit_id,
-- que continua existindo pro projeto Dashboard Ads externo.

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

ALTER TABLE dpp_user_units ENABLE ROW LEVEL SECURITY;

-- Admin gerencia tudo (INSERT, UPDATE, DELETE, SELECT)
CREATE POLICY admin_manage_user_units ON dpp_user_units
  FOR ALL USING (dpp_is_admin()) WITH CHECK (dpp_is_admin());

-- Usuário comum só vê as próprias atribuições
CREATE POLICY user_select_own_assignments ON dpp_user_units
  FOR SELECT USING (user_id = auth.uid());

COMMENT ON TABLE dpp_user_units IS
  'Atribuições de acesso usuário do hub <-> unidade. Admin do hub gerencia. Usuário comum vê só as próprias linhas.';
```

- [ ] **Step 2: Aplicar localmente**

Não há `db:apply` configurado neste projeto — confirmar com o usuário **antes de rodar a migration em produção** se ele aplica via Supabase Studio ou via CLI. Por ora, registrar nesta task que a aplicação é manual.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260520000000_dpp_user_units_table.sql
git commit -m "feat(db): tabela dpp_user_units pra atribuição N-pra-N user<->unidade"
```

### Task 2: Atualizar RLS das tabelas `dpp_*` pra usar a nova tabela

**Files:**
- Create: `supabase/migrations/20260520000010_dpp_user_units_rls.sql`

- [ ] **Step 1: Escrever a migration**

```sql
-- 20260520000010_dpp_user_units_rls.sql
-- Substitui as policies de SELECT pra "franqueado" (1-pra-1 via dpp_user_unit_id())
-- por policies baseadas em dpp_user_units (N-pra-N).
-- Admin (dpp_is_admin()) continua vendo tudo como antes.

-- dpp_units
DROP POLICY IF EXISTS franqueado_select_own_unit ON dpp_units;
CREATE POLICY user_select_assigned_unit ON dpp_units FOR SELECT
  USING (id IN (SELECT unit_id FROM dpp_user_units WHERE user_id = auth.uid()));

-- dpp_ad_sets
DROP POLICY IF EXISTS franqueado_select_own_ad_set ON dpp_ad_sets;
CREATE POLICY user_select_assigned_ad_sets ON dpp_ad_sets FOR SELECT
  USING (id IN (
    SELECT l.ad_set_id
    FROM dpp_unit_ad_set_link l
    JOIN dpp_user_units uu ON uu.unit_id = l.unit_id
    WHERE uu.user_id = auth.uid()
  ));

-- dpp_unit_ad_set_link
DROP POLICY IF EXISTS franqueado_select_own_link ON dpp_unit_ad_set_link;
CREATE POLICY user_select_assigned_links ON dpp_unit_ad_set_link FOR SELECT
  USING (unit_id IN (SELECT unit_id FROM dpp_user_units WHERE user_id = auth.uid()));

-- dpp_ad_set_daily_metrics
DROP POLICY IF EXISTS franqueado_select_own_metrics ON dpp_ad_set_daily_metrics;
CREATE POLICY user_select_assigned_metrics ON dpp_ad_set_daily_metrics FOR SELECT
  USING (ad_set_id IN (
    SELECT l.ad_set_id
    FROM dpp_unit_ad_set_link l
    JOIN dpp_user_units uu ON uu.unit_id = l.unit_id
    WHERE uu.user_id = auth.uid()
  ));
```

- [ ] **Step 2: Roteiro de teste SQL manual (rodar no Supabase Studio depois de aplicar)**

```sql
-- 1. Criar usuário teste via Studio (Auth > Users) OU usar um existente
-- 2. Anotar o user.id

-- 3. Como admin (no Studio, role: service_role)
INSERT INTO dpp_user_units (user_id, unit_id, created_by)
SELECT '<USER_ID>', id, '<ADMIN_ID>'
FROM dpp_units WHERE nome = 'Sacomã'
LIMIT 1;

-- 4. Trocar pra usuário teste no Studio (SQL Editor > Set role > authenticated, JWT = token do user)
SELECT id, nome FROM dpp_units;
-- Esperado: APENAS Sacomã

-- 5. Limpar
DELETE FROM dpp_user_units WHERE user_id = '<USER_ID>';
-- Como user de novo:
SELECT id FROM dpp_units;
-- Esperado: vazio
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260520000010_dpp_user_units_rls.sql
git commit -m "feat(db): RLS de dpp_* usa dpp_user_units pra acesso de usuário comum"
```

---

## Chunk 2: Edge Function `dpp-admin-relink-ad-set` (conserta bug #3)

### Task 3: Criar Edge Function

**Files:**
- Create: `supabase/functions/dpp-admin-relink-ad-set/index.ts`

- [ ] **Step 1: Escrever o código da Function**

```ts
// supabase/functions/dpp-admin-relink-ad-set/index.ts
//
// Admin: troca o ad set vinculado a uma unidade.
// Chamado pelo client React via supabase.functions.invoke. Valida que o
// caller é admin (user_roles.role='admin') e chama o RPC dpp_relink_ad_set
// com service_role (o RPC foi REVOKE'd de authenticated por design).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'No authorization header' }, 401);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

  const { data: roleData } = await userClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (!roleData) return json({ error: 'Apenas admins podem vincular ad sets' }, 403);

  const body = (await req.json()) as { unit_id?: string; ad_set_id?: string };
  const unitId = body.unit_id;
  const adSetId = body.ad_set_id;
  if (!unitId || !adSetId) {
    return json({ error: 'unit_id e ad_set_id são obrigatórios' }, 400);
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await sb.rpc('dpp_relink_ad_set', {
    p_unit_id: unitId,
    p_ad_set_id: adSetId,
    p_actor: user.id,
  });
  if (error) return json({ error: error.message }, 500);

  // O RPC retorna TABLE — vem como array com 1 linha
  const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
  return json({
    ok: true,
    moved_from_unit_id: row?.moved_from_unit_id ?? null,
    was_noop: row?.was_noop ?? false,
  });
});
```

- [ ] **Step 2: Verificar se precisa registrar no `supabase/config.toml`**

Rodar:
```bash
grep -n "dpp-admin-backfill" supabase/config.toml
```
Se aparecer, copiar o mesmo bloco pro `dpp-admin-relink-ad-set`. Se não aparecer (registro implícito), nada a fazer.

- [ ] **Step 3: Smoke local com `supabase functions serve` (opcional, se o usuário tiver supabase CLI)**

Se o usuário não tiver CLI configurado, pular pro Step 4 e testar via integração com o frontend (Task 4).

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/dpp-admin-relink-ad-set/
git commit -m "feat(functions): dpp-admin-relink-ad-set valida admin e chama RPC"
```

### Task 4: Trocar chamada no `AdSetPickerModal`

**Files:**
- Modify: `src/features/admin/midia-adicional/AdSetPickerModal.tsx:64-88`

- [ ] **Step 1: Editar `linkMutation`**

Substituir o bloco `mutationFn` atual (linhas ~65-81) por:

```ts
const linkMutation = useMutation({
  mutationFn: async ({ adSetId }: { adSetId: string }) => {
    const { data, error } = await supabase.functions.invoke('dpp-admin-relink-ad-set', {
      body: { unit_id: unitId, ad_set_id: adSetId },
    });
    if (error) throw error;
    if (data && typeof data === 'object' && 'error' in data && data.error) {
      throw new Error(String(data.error));
    }

    // Dispara backfill 180d em background via Edge Function (fire-and-forget)
    void supabase.functions
      .invoke('dpp-admin-backfill', { body: { ad_set_id: adSetId, days: 180 } })
      .catch((e) => console.error('backfill falhou', e));
  },
  onSuccess: () => {
    toast.success('Ad set vinculado. Backfill de 180 dias iniciado em background.');
    queryClient.invalidateQueries({ queryKey: ['dpp_units'] });
    onOpenChange(false);
  },
  onError: (e: Error) => toast.error(`Erro ao vincular: ${e.message}`),
});
```

- [ ] **Step 2: Smoke manual no browser**

1. `npm run dev` (servidor já está em `bd76vyjwl` na porta 8080)
2. Logar como admin
3. Abrir `/minha-area/midia-adicional/<slug-de-alguma-unidade>`
4. Clicar "Vincular conjunto" → escolher um ad set
5. Esperar: toast "Ad set vinculado. Backfill de 180 dias iniciado em background."
6. Tela atualiza mostrando o ad set vinculado

Se ainda falhar com 403/permission: confirmar que a Edge Function foi deployada (`supabase functions deploy dpp-admin-relink-ad-set` ou via Studio).

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/midia-adicional/AdSetPickerModal.tsx
git commit -m "fix(midia-adicional): vincular ad set via Edge Function (RPC bloqueia authenticated)"
```

---

## Chunk 3: Port das libs (TDD)

### Task 5: Portar e testar `aggregate`

**Files:**
- Create: `src/features/colaborador/dashboard/lib/aggregate.ts`
- Create: `src/features/colaborador/dashboard/lib/aggregate.test.ts`

- [ ] **Step 1: Escrever teste primeiro**

```ts
// src/features/colaborador/dashboard/lib/aggregate.test.ts
import { describe, it, expect } from 'vitest';
import { aggregate, computeDerived } from './aggregate';

describe('computeDerived', () => {
  it('calcula CPM, CPC e cost_per_result', () => {
    expect(computeDerived({ impressions: 1000, clicks: 10, spend: 50, results: 5 })).toEqual({
      cpm: 50,
      cpc: 5,
      cost_per_result: 10,
    });
  });

  it('retorna null quando denominador é zero', () => {
    expect(computeDerived({ impressions: 0, clicks: 0, spend: 10, results: 0 })).toEqual({
      cpm: null,
      cpc: null,
      cost_per_result: null,
    });
  });
});

describe('aggregate', () => {
  it('retorna zero/null pra array vazio', () => {
    const r = aggregate([]);
    expect(r.impressions).toBe(0);
    expect(r.cpm).toBeNull();
    expect(r.from).toBe('');
  });

  it('soma campos aditivos e usa MÁXIMO pra reach', () => {
    const r = aggregate([
      { date: '2026-05-01', impressions: 100, clicks: 5, spend: 10, results: 1, reach: 80 },
      { date: '2026-05-02', impressions: 200, clicks: 10, spend: 20, results: 2, reach: 150 },
    ]);
    expect(r.impressions).toBe(300);
    expect(r.clicks).toBe(15);
    expect(r.spend).toBe(30);
    expect(r.results).toBe(3);
    expect(r.reach).toBe(150); // máximo, não soma
    expect(r.from).toBe('2026-05-01');
    expect(r.to).toBe('2026-05-02');
  });
});
```

- [ ] **Step 2: Rodar teste — deve falhar (módulo não existe)**

```bash
npx vitest run src/features/colaborador/dashboard/lib/aggregate.test.ts
```
Esperado: FAIL com "Cannot find module './aggregate'".

- [ ] **Step 3: Implementar (port direto do externo)**

```ts
// src/features/colaborador/dashboard/lib/aggregate.ts
// Port direto de "Dashboard Ads - Unidades"/src/lib/metrics.ts (sem alteração).

export type DailyMetric = {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  results: number;
  reach: number;
};

export type Derived = {
  cpm: number | null;
  cpc: number | null;
  cost_per_result: number | null;
};

export type Aggregated = DailyMetric & Derived & { from: string; to: string };

export function computeDerived(
  m: Pick<DailyMetric, 'impressions' | 'clicks' | 'spend' | 'results'>,
): Derived {
  return {
    cpm: m.impressions > 0 ? (m.spend / m.impressions) * 1000 : null,
    cpc: m.clicks > 0 ? m.spend / m.clicks : null,
    cost_per_result: m.results > 0 ? m.spend / m.results : null,
  };
}

export function aggregate(days: DailyMetric[]): Aggregated {
  if (days.length === 0) {
    return {
      date: '', from: '', to: '', impressions: 0, clicks: 0, spend: 0, results: 0, reach: 0,
      cpm: null, cpc: null, cost_per_result: null,
    };
  }
  const total = days.reduce(
    (a, d) => ({
      impressions: a.impressions + d.impressions,
      clicks: a.clicks + d.clicks,
      spend: a.spend + d.spend,
      results: a.results + d.results,
    }),
    { impressions: 0, clicks: 0, spend: 0, results: 0 },
  );
  // reach NÃO pode ser somado entre dias — é métrica de usuários únicos.
  // Usar máximo diário como estimativa conservadora (lower bound).
  const reach = Math.max(...days.map((d) => d.reach));
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  return {
    date: sorted[0].date,
    from: sorted[0].date,
    to: sorted[sorted.length - 1].date,
    ...total,
    reach,
    ...computeDerived(total),
  };
}
```

- [ ] **Step 4: Rodar teste — deve passar**

```bash
npx vitest run src/features/colaborador/dashboard/lib/aggregate.test.ts
```
Esperado: 4 testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/features/colaborador/dashboard/lib/aggregate.ts src/features/colaborador/dashboard/lib/aggregate.test.ts
git commit -m "feat(dashboard): port aggregate + testes (do projeto Dashboard Ads externo)"
```

### Task 6: Portar e testar `resolveRange`

**Files:**
- Create: `src/features/colaborador/dashboard/lib/date-range.ts`
- Create: `src/features/colaborador/dashboard/lib/date-range.test.ts`

- [ ] **Step 1: Escrever teste primeiro**

```ts
// src/features/colaborador/dashboard/lib/date-range.test.ts
import { describe, it, expect } from 'vitest';
import { resolveRange } from './date-range';

const today = new Date('2026-05-20T12:00:00Z');

describe('resolveRange', () => {
  it('preset "ontem" = D-1, mode absolute_day', () => {
    const r = resolveRange({ preset: 'ontem', today });
    expect(r.from).toBe('2026-05-19');
    expect(r.to).toBe('2026-05-19');
    expect(r.mode).toBe('absolute_day');
  });

  it('preset "7d" cobre 7 dias terminando em D-1', () => {
    const r = resolveRange({ preset: '7d', today });
    expect(r.to).toBe('2026-05-19');
    expect(r.from).toBe('2026-05-13');
    expect(r.mode).toBe('rolling');
  });

  it('preset "180d" cobre 180 dias terminando em D-1', () => {
    const r = resolveRange({ preset: '180d', today });
    expect(r.to).toBe('2026-05-19');
    expect(r.from).toBe('2025-11-21');
  });

  it('custom: clampa "to" se for futuro', () => {
    const r = resolveRange({ from: '2026-05-10', to: '2026-06-30', today });
    expect(r.to).toBe('2026-05-19');
    expect(r.mode).toBe('custom');
  });

  it('custom: limita janela a 180 dias', () => {
    const r = resolveRange({ from: '2024-01-01', to: '2026-05-19', today });
    // de '2026-05-19' menos 180 dias = '2025-11-20'
    expect(r.from).toBe('2025-11-20');
  });
});
```

- [ ] **Step 2: Rodar — deve falhar**

```bash
npx vitest run src/features/colaborador/dashboard/lib/date-range.test.ts
```

- [ ] **Step 3: Implementar (port direto)**

```ts
// src/features/colaborador/dashboard/lib/date-range.ts
// Port direto de "Dashboard Ads - Unidades"/src/lib/date-range.ts.

import { format, subDays, parseISO, isAfter, differenceInDays } from 'date-fns';

export type Preset = 'ontem' | '7d' | '30d' | '90d' | '180d';

export type RangeInput =
  | { preset: Preset; today?: Date }
  | { from: string; to: string; today?: Date };

export type Range = {
  from: string;
  to: string;
  preset?: Preset;
  mode: 'absolute_day' | 'rolling' | 'custom';
};

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

export function resolveRange(input: RangeInput): Range {
  const today = input.today ?? new Date();
  const yesterday = subDays(today, 1);

  if ('preset' in input) {
    if (input.preset === 'ontem') {
      const d = fmt(yesterday);
      return { from: d, to: d, preset: 'ontem', mode: 'absolute_day' };
    }
    const days = { '7d': 7, '30d': 30, '90d': 90, '180d': 180 }[input.preset];
    return {
      from: fmt(subDays(yesterday, days - 1)),
      to: fmt(yesterday),
      preset: input.preset,
      mode: 'rolling',
    };
  }

  let from = parseISO(input.from);
  let to = parseISO(input.to);
  if (isAfter(to, yesterday)) to = yesterday;
  if (differenceInDays(to, from) > 180) from = subDays(to, 180);
  return { from: fmt(from), to: fmt(to), mode: 'custom' };
}
```

- [ ] **Step 4: Rodar — deve passar**

```bash
npx vitest run src/features/colaborador/dashboard/lib/date-range.test.ts
```
Esperado: 5 testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/features/colaborador/dashboard/lib/date-range.ts src/features/colaborador/dashboard/lib/date-range.test.ts
git commit -m "feat(dashboard): port resolveRange + testes"
```

---

## Chunk 4: Componentes visuais (port)

### Task 7: Portar `KpiCard`

**Files:**
- Create: `src/features/colaborador/dashboard/components/KpiCard.tsx`

- [ ] **Step 1: Criar arquivo**

```tsx
// src/features/colaborador/dashboard/components/KpiCard.tsx
// Port direto de "Dashboard Ads - Unidades"/src/app/dashboard/_components/kpi-card.tsx.
// Sem alteração — usa classes pure-* que já existem no Tailwind do hub.

import { Info } from 'lucide-react';

export function KpiCard({
  label,
  value,
  hint,
  info,
  accent = false,
  size = 'md',
}: {
  label: string;
  value: string;
  hint?: string;
  info?: string;
  accent?: boolean;
  size?: 'md' | 'sm';
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-4 ${accent ? 'border-t-[3px] border-t-pure-red' : ''}`}
    >
      <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-pure-gray">
        <span>{label}</span>
        {info && (
          <span className="relative inline-flex group" tabIndex={0}>
            <Info className="size-3.5 text-pure-gray/70 cursor-help" strokeWidth={2} />
            <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 hidden group-hover:block group-focus:block w-56 bg-pure-dark text-white text-[11px] font-normal normal-case tracking-normal leading-snug rounded-md px-3 py-2 shadow-lg">
              {info}
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-pure-dark rotate-45" />
            </span>
          </span>
        )}
      </div>
      <div
        className={`${size === 'md' ? 'text-3xl' : 'text-xl'} font-bold ${accent ? 'text-pure-red' : 'text-pure-dark'} mt-1`}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-pure-gray mt-1">{hint}</div>}
    </div>
  );
}

export const fmtInt = (n: number) => n.toLocaleString('pt-BR');
export const fmtBrl = (n: number | null) =>
  n === null
    ? '—'
    : `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
```

- [ ] **Step 2: Verificar que as classes `pure-red`, `pure-dark`, `pure-gray` existem no Tailwind do hub**

```bash
grep -n "pure-red\|pure-dark\|pure-gray" tailwind.config.ts
```
Se NÃO existirem, precisa adicionar. O Dashboard externo tem essas cores no tailwind.config dele — copiar do externo (`c:/Users/renan/Projetos/Dashboard Ads - Unidades/tailwind.config.ts`) pras `colors:` do hub. Se já existirem (provável, é a mesma marca), seguir adiante.

- [ ] **Step 3: Smoke visual rápido**

Importar `KpiCard` num lugar de teste qualquer (ex.: `src/features/geral/home/Index.tsx`, comentar depois) e ver se renderiza sem erro. Remover o import temporário no final.

Alternativa: pular o smoke aqui — vai aparecer naturalmente na Task 11 (`DashboardMidiaAdicional`).

- [ ] **Step 4: Commit**

```bash
git add src/features/colaborador/dashboard/components/KpiCard.tsx
git commit -m "feat(dashboard): port KpiCard"
```

### Task 8: Portar `ChartDaily`

**Files:**
- Create: `src/features/colaborador/dashboard/components/ChartDaily.tsx`

- [ ] **Step 1: Criar arquivo**

```tsx
// src/features/colaborador/dashboard/components/ChartDaily.tsx
// Port direto de "Dashboard Ads - Unidades"/src/app/dashboard/_components/chart-daily.tsx.
// Removido o "use client" (no Vite todo o código é client-side).

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

type Row = { date: string; spend: number; results: number };

export function ChartDaily({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <div className="text-sm text-pure-gray">Sem dados para o período.</div>;
  const useBars = rows.length <= 14;

  if (useBars) {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7D7C7C' }} tickFormatter={(d) => d.slice(5)} />
          <YAxis yAxisId="spend" tick={{ fontSize: 11, fill: '#7D7C7C' }} />
          <YAxis yAxisId="results" orientation="right" tick={{ fontSize: 11, fill: '#7D7C7C' }} />
          <Tooltip />
          <Bar yAxisId="spend" dataKey="spend" name="Gasto (R$)" fill="#C12030" />
          <Bar yAxisId="results" dataKey="results" name="Aulas experimentais" fill="#231F20" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7D7C7C' }} tickFormatter={(d) => d.slice(5)} />
        <YAxis yAxisId="spend" tick={{ fontSize: 11, fill: '#7D7C7C' }} />
        <YAxis yAxisId="results" orientation="right" tick={{ fontSize: 11, fill: '#7D7C7C' }} />
        <Tooltip />
        <Line yAxisId="spend" dataKey="spend" name="Gasto (R$)" stroke="#C12030" dot={false} />
        <Line yAxisId="results" dataKey="results" name="Aulas experimentais" stroke="#231F20" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/colaborador/dashboard/components/ChartDaily.tsx
git commit -m "feat(dashboard): port ChartDaily"
```

### Task 9: Portar `PeriodSelector` (adapta Next → React Router)

**Files:**
- Create: `src/features/colaborador/dashboard/components/PeriodSelector.tsx`

- [ ] **Step 1: Criar arquivo (adaptação Next → React Router)**

```tsx
// src/features/colaborador/dashboard/components/PeriodSelector.tsx
// Adaptado de "Dashboard Ads - Unidades"/src/app/dashboard/_components/period-selector.tsx.
// Trocas:
// - useRouter/usePathname/useSearchParams do next/navigation → useSearchParams/useLocation do react-router-dom
// - router.push → setSearchParams
// - removido "use client"

import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

const presets = [
  { id: 'ontem', label: 'Ontem' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
  { id: '180d', label: '180d' },
] as const;

export function PeriodSelector({ active }: { active: string }) {
  const [sp, setSp] = useSearchParams();
  const [open, setOpen] = useState(false);
  const isCustom = sp.has('from') && sp.has('to');

  function pick(id: string) {
    const next = new URLSearchParams(sp);
    next.delete('from');
    next.delete('to');
    next.set('range', id);
    setSp(next);
  }

  return (
    <div className="flex gap-1 bg-white p-1 border border-gray-200 rounded-lg">
      {presets.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => pick(p.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
            active === p.id && !isCustom ? 'bg-pure-red text-white' : 'text-pure-gray hover:text-pure-dark'
          }`}
        >
          {p.label}
        </button>
      ))}
      <div className="w-px bg-gray-200 mx-1" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 ${
              isCustom ? 'bg-pure-red text-white' : 'text-pure-dark'
            }`}
          >
            <CalendarIcon className="size-3.5" />
            {isCustom ? `${sp.get('from')} → ${sp.get('to')}` : 'Personalizado'}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          <CustomRange
            onApply={(from, to) => {
              const next = new URLSearchParams(sp);
              next.delete('range');
              next.set('from', from);
              next.set('to', to);
              setSp(next);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function CustomRange({ onApply }: { onApply: (from: string, to: string) => void }) {
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({});
  return (
    <div className="p-2 space-y-2">
      <Calendar mode="range" selected={range as never} onSelect={setRange as never} numberOfMonths={2} />
      <p className="text-xs text-pure-gray bg-pure-red/5 px-3 py-2 rounded">
        Janela máxima: 180 dias. Datas futuras ou anteriores a 180 dias atrás são ajustadas.
      </p>
      <Button
        className="w-full bg-pure-red hover:bg-pure-red/90"
        disabled={!range.from || !range.to}
        onClick={() =>
          range.from && range.to && onApply(
            range.from.toISOString().slice(0, 10),
            range.to.toISOString().slice(0, 10),
          )
        }
      >
        Aplicar
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/colaborador/dashboard/components/PeriodSelector.tsx
git commit -m "feat(dashboard): port PeriodSelector adaptado pra React Router"
```

### Task 10: Portar `LastUpdateBanner`

**Files:**
- Create: `src/features/colaborador/dashboard/components/LastUpdateBanner.tsx`

- [ ] **Step 1: Copiar direto (sem adaptação)**

```tsx
// src/features/colaborador/dashboard/components/LastUpdateBanner.tsx
// Port direto, sem alteração.

export function LastUpdateBanner({ lastSyncAt, status }: { lastSyncAt?: string; status?: string }) {
  if (!lastSyncAt)
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-4 py-2">
        Ainda não há dados sincronizados para esta unidade. O próximo sync roda às 03h.
      </div>
    );
  const dt = new Date(lastSyncAt);
  const fmt = dt.toLocaleString('pt-BR');
  const todayYmd = new Date().toISOString().slice(0, 10);
  const syncedToday = dt.toISOString().slice(0, 10) === todayYmd;

  if (status === 'error')
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-2">
        Sync de hoje falhou. Dados mostrados são do último sync bem-sucedido em {fmt}.
      </div>
    );
  if (!syncedToday)
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-4 py-2">
        Sync de hoje ainda não rodou. Dados mostrados são do último sync em {fmt}.
      </div>
    );
  return <div className="text-xs text-pure-gray mt-1">Atualizado em {fmt} (sync diário)</div>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/colaborador/dashboard/components/LastUpdateBanner.tsx
git commit -m "feat(dashboard): port LastUpdateBanner"
```

---

## Chunk 5: Página do Dashboard

### Task 11: Criar `UnitPicker`

**Files:**
- Create: `src/features/colaborador/dashboard/components/UnitPicker.tsx`

- [ ] **Step 1: Implementar**

Usa o `Command` do shadcn (já instalado — é `cmdk`) pra ter busca eficiente até com 425+ unidades.

```tsx
// src/features/colaborador/dashboard/components/UnitPicker.tsx
// Combobox com busca. Lista vem de RLS — admin vê todas, usuário vê só as atribuídas.

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type UnitOption = {
  id: string;
  external_id: string;
  nome: string;
  bairro: string | null;
  cidade: string | null;
};

export function UnitPicker({
  units,
  selectedId,
  onSelect,
}: {
  units: UnitOption[];
  selectedId: string | null;
  onSelect: (unit: UnitOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = units.find((u) => u.id === selectedId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {selected ? (
            <span className="truncate">
              {selected.nome}
              {selected.bairro && <span className="text-muted-foreground"> · {selected.bairro}</span>}
            </span>
          ) : (
            <span className="text-muted-foreground">Selecione a unidade...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Buscar por nome ou bairro..." />
          <CommandList>
            <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
            <CommandGroup>
              {units.map((u) => (
                <CommandItem
                  key={u.id}
                  value={`${u.nome} ${u.bairro ?? ''} ${u.cidade ?? ''}`}
                  onSelect={() => {
                    onSelect(u);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', selectedId === u.id ? 'opacity-100' : 'opacity-0')} />
                  <span>{u.nome}</span>
                  {u.bairro && <span className="ml-2 text-xs text-muted-foreground">{u.bairro}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Confirmar que `Command` do shadcn existe**

```bash
ls src/components/ui/command.tsx
```
Se não existir, copiar de outro projeto shadcn ou rodar `npx shadcn@latest add command`.

- [ ] **Step 3: Commit**

```bash
git add src/features/colaborador/dashboard/components/UnitPicker.tsx
git commit -m "feat(dashboard): UnitPicker combobox com busca"
```

### Task 12: Criar `DashboardMidiaAdicional` (a página)

**Files:**
- Create: `src/features/colaborador/dashboard/DashboardMidiaAdicional.tsx`

- [ ] **Step 1: Implementar a página completa**

```tsx
// src/features/colaborador/dashboard/DashboardMidiaAdicional.tsx
// Página /minha-area/dashboard — réplica 1:1 do /dashboard do projeto externo,
// adaptada pra Vite/React Router + RLS multi-unidade.

import { useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { resolveRange, type Preset } from './lib/date-range';
import { aggregate } from './lib/aggregate';
import { KpiCard, fmtBrl, fmtInt } from './components/KpiCard';
import { ChartDaily } from './components/ChartDaily';
import { PeriodSelector } from './components/PeriodSelector';
import { LastUpdateBanner } from './components/LastUpdateBanner';
import { UnitPicker, type UnitOption } from './components/UnitPicker';

const VALID_PRESETS: Preset[] = ['ontem', '7d', '30d', '90d', '180d'];

type UnitWithLink = UnitOption & {
  dpp_unit_ad_set_link: { ad_set_id: string }[] | null;
};

export default function DashboardMidiaAdicional() {
  const [sp, setSp] = useSearchParams();

  const { data: units, isLoading: loadingUnits } = useQuery({
    queryKey: ['dpp_dashboard_units'],
    queryFn: async (): Promise<UnitWithLink[]> => {
      const { data, error } = await supabase
        .from('dpp_units' as never)
        .select('id, external_id, nome, bairro, cidade, dpp_unit_ad_set_link (ad_set_id)')
        .order('nome');
      if (error) throw error;
      return (data ?? []) as unknown as UnitWithLink[];
    },
  });

  const selectedExternalId = sp.get('unit');
  const selectedUnit = useMemo(
    () => (units ?? []).find((u) => u.external_id === selectedExternalId) ?? null,
    [units, selectedExternalId],
  );

  // Auto-selecionar se o usuário só tem 1 unidade e nenhuma está na URL
  useEffect(() => {
    if (!loadingUnits && units && units.length === 1 && !selectedExternalId) {
      const next = new URLSearchParams(sp);
      next.set('unit', units[0].external_id);
      setSp(next, { replace: true });
    }
  }, [loadingUnits, units, selectedExternalId, sp, setSp]);

  const range = useMemo(() => {
    const from = sp.get('from');
    const to = sp.get('to');
    if (from && to) return resolveRange({ from, to });
    const presetParam = sp.get('range');
    const preset = (VALID_PRESETS.includes(presetParam as Preset) ? presetParam : '7d') as Preset;
    return resolveRange({ preset });
  }, [sp]);

  const adSetIds = selectedUnit?.dpp_unit_ad_set_link?.map((l) => l.ad_set_id) ?? [];

  const { data: metrics } = useQuery({
    queryKey: ['dpp_dashboard_metrics', selectedUnit?.id, range.from, range.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dpp_ad_set_daily_metrics' as never)
        .select('date, impressions, clicks, spend, results, reach, synced_at')
        .in('ad_set_id', adSetIds.length > 0 ? adSetIds : ['00000000-0000-0000-0000-000000000000'])
        .gte('date', range.from)
        .lte('date', range.to)
        .order('date');
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        date: string; impressions: number; clicks: number; spend: number;
        results: number; reach: number; synced_at: string;
      }>;
    },
    enabled: !!selectedUnit && adSetIds.length > 0,
  });

  const rows = (metrics ?? []).map((r) => ({
    date: r.date,
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    spend: Number(r.spend),
    results: r.results,
    reach: Number(r.reach),
    synced_at: r.synced_at,
  }));
  const agg = aggregate(rows.map(({ synced_at: _s, ...m }) => m));
  const lastSync = rows.length ? rows[rows.length - 1].synced_at : undefined;
  const isYesterdayMode = range.mode === 'absolute_day' && range.from === range.to;

  // Estado vazio: usuário sem unidades atribuídas
  if (!loadingUnits && (!units || units.length === 0)) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <h1 className="text-xl font-heading font-bold mb-2">Sem acesso a relatório</h1>
          <p className="text-muted-foreground">
            Nenhuma unidade atribuída a você. Contate o administrador.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
        <div className="bg-pure-red/5 border border-pure-red/20 text-pure-dark text-sm rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
          <span className="font-bold text-pure-red shrink-0">Mídia Adicional</span>
          <span className="text-pure-gray">
            Os números abaixo são apenas das campanhas de mídia adicional que a sua unidade roda. Não incluem as campanhas globais da Pure Pilates.
          </span>
        </div>

        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide font-bold text-pure-gray">Unidade</div>
            <div className="mt-1">
              <UnitPicker
                units={units ?? []}
                selectedId={selectedUnit?.id ?? null}
                onSelect={(u) => {
                  const next = new URLSearchParams(sp);
                  next.set('unit', u.external_id);
                  setSp(next);
                }}
              />
            </div>
          </div>
          <PeriodSelector active={range.preset ?? 'custom'} />
        </div>

        {!selectedUnit ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-pure-gray">Selecione uma unidade pra ver o relatório.</p>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-wide font-bold text-pure-gray">
                  {isYesterdayMode ? 'Dados de' : `Visão geral · ${range.preset ?? 'personalizado'}`}
                </div>
                <h3 className="text-2xl font-bold text-pure-dark mt-1">
                  {range.from} {range.to !== range.from && `→ ${range.to}`}
                </h3>
                <LastUpdateBanner lastSyncAt={lastSync} />
              </div>
            </div>

            {adSetIds.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <p className="text-pure-gray">
                  Sua unidade ainda não tem conjunto de anúncio vinculado. Contate o administrador.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <KpiCard label="Aulas experimentais" value={fmtInt(agg.results)} hint="agendadas no período"
                    info="Quantas pessoas preencheram o formulário de aula experimental vindas dos anúncios. Conta o evento de cadastro completo registrado pelo Pixel."
                    accent />
                  <KpiCard label="Custo por aula" value={fmtBrl(agg.cost_per_result)} hint="média do período"
                    info="Quanto você investe em média para gerar uma aula experimental agendada. Quanto menor, mais eficiente o anúncio." />
                  <KpiCard label="Gasto" value={fmtBrl(agg.spend)} hint="total no período"
                    info="Quanto a sua unidade gastou em anúncios no Meta (Facebook + Instagram) somando todos os dias do período selecionado." />
                  <KpiCard label="Alcance" value={fmtInt(agg.reach)} hint="máximo diário"
                    info="Número máximo de pessoas únicas que viram o anúncio em um dia do período. Não é a soma dos dias — uma pessoa que viu em vários dias só conta uma vez." />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <KpiCard label="Impressões" value={fmtInt(agg.impressions)} size="sm"
                    info="Quantas vezes o anúncio apareceu na tela no período. A mesma pessoa pode contar várias vezes." />
                  <KpiCard label="Cliques" value={fmtInt(agg.clicks)} size="sm"
                    info="Quantas vezes alguém clicou no anúncio. Inclui cliques em links, no perfil e em outras áreas do anúncio." />
                  <KpiCard label="CPM" value={fmtBrl(agg.cpm)} size="sm"
                    info="Custo por mil impressões. Quanto custou em média para o anúncio aparecer mil vezes." />
                  <KpiCard label="CPC" value={fmtBrl(agg.cpc)} size="sm"
                    info="Custo por clique. Quanto você paga em média por cada pessoa que clica no anúncio." />
                </div>
                {!isYesterdayMode && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-bold text-pure-dark mb-4">Desempenho diário</h3>
                    <ChartDaily rows={rows.map((r) => ({ date: r.date, spend: r.spend, results: r.results }))} />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </MainLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/colaborador/dashboard/DashboardMidiaAdicional.tsx
git commit -m "feat(dashboard): página /minha-area/dashboard com KPIs + chart + multi-unidade"
```

### Task 13: Hook `useHasUnitAccess` pro Sidebar

**Files:**
- Create: `src/features/colaborador/dashboard/hooks/useHasUnitAccess.ts`

- [ ] **Step 1: Implementar**

```ts
// src/features/colaborador/dashboard/hooks/useHasUnitAccess.ts
// Retorna true se o caller tem ≥1 atribuição em dpp_user_units (cacheado 5 min).
// Admin já é considerado true pelo componente que usa o hook (via useAuth().isAdmin).

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useHasUnitAccess(): boolean {
  const { user, isAdmin } = useAuth();

  const { data } = useQuery({
    queryKey: ['dpp_user_units_has_any', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('dpp_user_units' as never)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id);
      if (error) return false;
      return (count ?? 0) > 0;
    },
    enabled: !!user && !isAdmin, // admin não precisa da query
    staleTime: 5 * 60 * 1000,
  });

  return isAdmin || data === true;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/colaborador/dashboard/hooks/useHasUnitAccess.ts
git commit -m "feat(dashboard): hook useHasUnitAccess pra controle de sidebar"
```

### Task 14: Adicionar rota em `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Adicionar o lazy import e a `<Route>`**

Próximo aos outros imports de `colaborador` (~linha 37):

```ts
const DashboardMidiaAdicional = lazy(() => import("./features/colaborador/dashboard/DashboardMidiaAdicional"));
```

Próximo à rota `/minha-area/midia-adicional` (~linha 105). Adicionar ANTES dela (não tem `requireAdmin` — é aberta a admin + usuários atribuídos; a página filtra internamente):

```tsx
<Route path="/minha-area/dashboard" element={<ProtectedRoute><DashboardMidiaAdicional /></ProtectedRoute>} />
```

- [ ] **Step 2: Smoke**

```bash
# servidor já está rodando em :8080
# abrir http://localhost:8080/minha-area/dashboard
```
Esperado: página carrega. Se usuário tem 0 atribuições, mostra "Sem acesso a relatório". Se admin, mostra UnitPicker com todas as unidades.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(routes): rota /minha-area/dashboard"
```

### Task 15: Adicionar item no Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx:192-199`

- [ ] **Step 1: Importar o hook e a icon**

No topo do arquivo, adicionar import:

```ts
import { useHasUnitAccess } from '@/features/colaborador/dashboard/hooks/useHasUnitAccess';
```

Reutilizar a icon `BarChart3` (já está importada na linha 30).

- [ ] **Step 2: Usar o hook dentro do componente `Sidebar`**

Depois de `const isFranqueado = userType === 'franqueado';` (linha ~109), adicionar:

```ts
const hasUnitAccess = useHasUnitAccess();
```

- [ ] **Step 3: Editar `minhaAreaNavigation`**

Substituir o bloco atual (linhas ~194-199) por:

```ts
const minhaAreaNavigation = [
  ...(hasUnitAccess
    ? [{ name: 'Dashboard', href: '/minha-area/dashboard', icon: BarChart3, disabled: false }]
    : []),
  ...(isAdmin
    ? [{ name: 'Mídia adicional', href: '/minha-area/midia-adicional', icon: Megaphone, disabled: false }]
    : []),
  { name: 'Minhas solicitações', href: '/minha-area/minhas-solicitacoes', icon: Inbox, disabled: false },
];
```

- [ ] **Step 4: Smoke**

1. Logar como admin → "Dashboard" aparece em "Minha Área".
2. Logar como usuário sem atribuição → "Dashboard" some.
3. Atribuir a unidade pelo admin (Task 16+) e relogar → aparece.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(sidebar): item Dashboard pra admin e usuários atribuídos"
```

---

## Chunk 6: Card de atribuição (admin)

### Task 16: Criar `UsuariosComAcessoCard`

**Files:**
- Create: `src/features/admin/midia-adicional/UsuariosComAcessoCard.tsx`

- [ ] **Step 1: Implementar**

```tsx
// src/features/admin/midia-adicional/UsuariosComAcessoCard.tsx
// Card que vai na tela /minha-area/midia-adicional/:slug (Editar Unidade, admin only).
// Lista usuários atribuídos à unidade e permite adicionar/remover.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Users, UserPlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Assignment = {
  id: string;
  user_id: string;
  profiles: { full_name: string | null; email: string | null } | null;
};

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

export function UsuariosComAcessoCard({ unitId }: { unitId: string }) {
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['dpp_user_units', unitId],
    queryFn: async (): Promise<Assignment[]> => {
      const { data, error } = await supabase
        .from('dpp_user_units' as never)
        .select('id, user_id, profiles!inner (full_name, email)')
        .eq('unit_id', unitId);
      if (error) throw error;
      return (data ?? []) as unknown as Assignment[];
    },
  });

  const { data: candidates } = useQuery({
    queryKey: ['profiles_candidates', unitId, assignments?.length ?? 0],
    queryFn: async (): Promise<Profile[]> => {
      const assignedIds = (assignments ?? []).map((a) => a.user_id);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('is_approved', true)
        .order('full_name');
      if (error) throw error;
      return (data as Profile[]).filter((p) => !assignedIds.includes(p.user_id));
    },
    enabled: pickerOpen,
  });

  const addMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('dpp_user_units' as never)
        .insert({ user_id: userId, unit_id: unitId, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Usuário adicionado.');
      queryClient.invalidateQueries({ queryKey: ['dpp_user_units', unitId] });
      setPickerOpen(false);
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const removeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('dpp_user_units' as never)
        .delete()
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Acesso removido.');
      queryClient.invalidateQueries({ queryKey: ['dpp_user_units', unitId] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários com acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-2 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...
            </div>
          ) : (assignments ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum usuário com acesso ainda. Adicione abaixo.
            </p>
          ) : (
            <div className="space-y-1">
              {assignments!.map((a) => (
                <div key={a.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <div className="text-sm">
                    <div className="font-medium">{a.profiles?.full_name ?? '(sem nome)'}</div>
                    <div className="text-xs text-muted-foreground">{a.profiles?.email}</div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {a.profiles?.full_name ?? a.profiles?.email} vai parar de ver o relatório dessa unidade.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeMutation.mutate(a.id)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1" /> Adicionar usuário
          </Button>
        </CardContent>
      </Card>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>Adicionar usuário</DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Buscar por nome ou e-mail..." />
            <CommandList>
              <CommandEmpty>Nenhum usuário disponível.</CommandEmpty>
              <CommandGroup>
                {(candidates ?? []).map((p) => (
                  <CommandItem
                    key={p.user_id}
                    value={`${p.full_name ?? ''} ${p.email ?? ''}`}
                    onSelect={() => addMutation.mutate(p.user_id)}
                  >
                    <div>
                      <div className="text-sm font-medium">{p.full_name ?? '(sem nome)'}</div>
                      <div className="text-xs text-muted-foreground">{p.email}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {addMutation.isPending && (
            <div className="px-4 pb-3 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Adicionando...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/admin/midia-adicional/UsuariosComAcessoCard.tsx
git commit -m "feat(midia-adicional): UsuariosComAcessoCard pra atribuir/remover usuários"
```

### Task 17: Adicionar card na tela Editar Unidade

**Files:**
- Modify: `src/features/admin/midia-adicional/MidiaAdicionalUnidade.tsx`

- [ ] **Step 1: Importar e renderizar**

Adicionar import no topo:

```ts
import { UsuariosComAcessoCard } from './UsuariosComAcessoCard';
```

Inserir o `<UsuariosComAcessoCard unitId={unit.id} />` entre os dois cards existentes — depois do `</Card>` do "Conjunto de anúncio" (após a linha ~235) e antes do `<Card>` do "Status no dashboard" (~linha 237).

- [ ] **Step 2: Smoke**

1. Logar como admin
2. Abrir `/minha-area/midia-adicional/<slug>`
3. Ver o card novo no meio
4. Clicar "Adicionar usuário" → modal abre, busca por nome → selecionar
5. Usuário aparece na lista; recarregar → continua lá
6. Remover via X → confirma → some

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/midia-adicional/MidiaAdicionalUnidade.tsx
git commit -m "feat(midia-adicional): card UsuariosComAcessoCard na tela Editar Unidade"
```

---

## Chunk 7: Validação fim-a-fim

### Task 18: Smoke completo

- [ ] **Step 1: Aplicar as migrations no Supabase (manual)**

Pela Supabase Studio ou CLI. Conferir que as duas migrations rodaram e RLS está ativo.

- [ ] **Step 2: Deploy da Edge Function**

Via Supabase Studio ou CLI:
```bash
supabase functions deploy dpp-admin-relink-ad-set
```

- [ ] **Step 3: Smoke como admin**

1. Logar como admin
2. Sidebar mostra "Dashboard" e "Mídia adicional" em "Minha Área"
3. Em `/minha-area/dashboard`: UnitPicker lista todas as unidades; seleciona uma vinculada → KPIs aparecem; troca período; testa custom range
4. Em `/minha-area/midia-adicional/<slug>`: clica "Vincular conjunto" → escolhe ad set → vê toast de sucesso (bug #3 ✓)
5. No mesmo lugar: adiciona um usuário ao card "Usuários com acesso"

- [ ] **Step 4: Smoke como usuário comum (atribuído)**

1. Logar como o usuário atribuído acima
2. Sidebar mostra "Dashboard" em "Minha Área", **não mostra** "Mídia adicional"
3. Em `/minha-area/dashboard`: UnitPicker mostra só a unidade dele; KPIs aparecem
4. Tentar acessar `/minha-area/dashboard?unit=<external_id-de-outra-unidade>` direto → mostra "Selecione uma unidade pra ver o relatório." (RLS retorna vazio)
5. Tentar acessar `/minha-area/midia-adicional` direto → `ProtectedRoute` bloqueia (não é admin)

- [ ] **Step 5: Smoke como usuário comum (sem atribuição)**

1. Logar como usuário sem nenhuma `dpp_user_units`
2. Sidebar **não mostra** "Dashboard"
3. Acessar `/minha-area/dashboard` direto → mostra "Sem acesso a relatório. Nenhuma unidade atribuída a você."

- [ ] **Step 6: Rodar suite de testes**

```bash
npx vitest run
```
Esperado: testes de `aggregate` e `date-range` passando. Demais testes do projeto: passar pelo menos o que já passava antes.

### Task 19: Reportar resultado

- [ ] **Step 1: Confirmar com o usuário antes de deploy de produção**

Antes de rodar `./deploy.sh`, conferir com o usuário:
- Todas as migrations aplicadas no Supabase de produção? (manual)
- Edge Function deployada no Supabase de produção? (manual)
- Variáveis de ambiente OK?

Conforme [CLAUDE.md](../../../CLAUDE.md): `git status` deve estar limpo; `git fetch origin && git log origin/main..HEAD --oneline` deve estar vazio. Se houver commits locais sem push, **fazer `git push origin main` antes de qualquer `./deploy.sh`**.

---

## Resumo de commits esperados

```
feat(db): tabela dpp_user_units pra atribuição N-pra-N user<->unidade
feat(db): RLS de dpp_* usa dpp_user_units pra acesso de usuário comum
feat(functions): dpp-admin-relink-ad-set valida admin e chama RPC
fix(midia-adicional): vincular ad set via Edge Function (RPC bloqueia authenticated)
feat(dashboard): port aggregate + testes (do projeto Dashboard Ads externo)
feat(dashboard): port resolveRange + testes
feat(dashboard): port KpiCard
feat(dashboard): port ChartDaily
feat(dashboard): port PeriodSelector adaptado pra React Router
feat(dashboard): port LastUpdateBanner
feat(dashboard): UnitPicker combobox com busca
feat(dashboard): página /minha-area/dashboard com KPIs + chart + multi-unidade
feat(dashboard): hook useHasUnitAccess pra controle de sidebar
feat(routes): rota /minha-area/dashboard
feat(sidebar): item Dashboard pra admin e usuários atribuídos
feat(midia-adicional): UsuariosComAcessoCard pra atribuir/remover usuários
feat(midia-adicional): card UsuariosComAcessoCard na tela Editar Unidade
```
