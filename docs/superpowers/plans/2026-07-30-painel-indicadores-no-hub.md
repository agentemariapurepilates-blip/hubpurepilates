# Painel de Indicadores no Hub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trazer as 4 telas de relatório do Painel de Indicadores (`purepilatesrelatorios`, hoje no Cloudflare) para uma seção "Dashboard" no menu da esquerda do Hub, sem exigir um segundo login.

**Architecture:** Um segundo cliente `supabase-js` no Hub, apontando para o projeto Supabase **separado** de indicadores (`bweyyihedqnckbtzbkie`) em modo anônimo — as policies de leitura daquele projeto já permitem acesso sem sessão (verificado em 2026-07-30). As telas são portadas quase 1:1, trocando o cliente Supabase, o layout e a fonte de autorização. Nenhuma migration, nenhuma Edge Function, nenhuma dependência nova: é frontend puro.

**Tech Stack:** Vite 5 · React 18 · TypeScript · React Router · @tanstack/react-query · shadcn/ui · Tailwind · supabase-js · Vitest

**Spec:** [2026-07-30-painel-indicadores-no-hub-design.md](../specs/2026-07-30-painel-indicadores-no-hub-design.md)

## Global Constraints

Valem para **todas** as tarefas:

- **Somente local.** Nunca rodar `./deploy.sh`. Nunca rodar `git push`. Instrução explícita do usuário.
- **Não editar `.env`.** Ele é versionado neste repo (apesar de estar no `.gitignore`). Toda variável nova vai em `.env.local`, que não é rastreado.
- **Nenhuma dependência nova.** Tudo que o port precisa já existe: `date-fns@^4.1.0`, `recharts@^2.15.4`, `@tanstack/react-query@^5.83.0`, `cmdk@^1.1.1`, e os componentes shadcn `table`, `scroll-area`, `select`, `tabs`, `command`, `popover`, `button`. Se algum passo parecer precisar de `npm install <pacote>`, pare e reavalie.
- **Instalação usa `npm ci --legacy-peer-deps`.** O projeto é construído com bun; no npm há um conflito de peer dependency (`react-day-picker@8` pede `date-fns` 2/3, o projeto usa 4) que só passa com essa flag.
- **Destino de todo código portado:** `src/features/colaborador/indicadores/`.
- **Nunca importar `@/integrations/supabase/client`** dentro de `src/features/colaborador/indicadores/`. Esse é o cliente do Hub, onde as tabelas de indicadores não existem. Sempre `@/integrations/supabase/indicadores`.
- **Prefixo de query key:** toda chave do React Query nos arquivos portados começa com `indicadores_`, para não colidir com o cache do Hub.
- **Idioma:** comentários e textos de UI em português, como o resto do repo.

## Pré-requisito: identidade do git

O git desta máquina não tem `user.name` / `user.email` configurados, então `git commit` falha. Antes da Task 1, configure **apenas neste repositório** (não global):

```bash
git config user.name "<nome do usuário>"
git config user.email "<email do usuário>"
```

Se o usuário não quiser configurar, execute o plano sem os passos de commit — mas avise que, sem commits, desfazer parcialmente fica mais difícil.

## Estrutura de arquivos

**Criados:**

| Arquivo | Responsabilidade |
|---|---|
| `src/integrations/supabase/indicadores.ts` | Cliente Supabase somente-leitura do projeto de indicadores |
| `src/integrations/supabase/indicadores.test.ts` | Garante o isolamento de sessão entre os dois clientes |
| `src/features/colaborador/indicadores/types.ts` | Tipos das tabelas de indicadores |
| `src/features/colaborador/indicadores/lib/periods.ts` | Cálculo de períodos (D-1, MTW, MTD, forecast) |
| `src/features/colaborador/indicadores/lib/timeline.ts` | Agrupamento por granularidade da Cronologia |
| `src/features/colaborador/indicadores/lib/formulaParser.ts` | Avaliador das fórmulas de métricas calculadas |
| `src/features/colaborador/indicadores/hooks/*.ts` | 8 hooks de dados (um arquivo por hook, como na origem) |
| `src/features/colaborador/indicadores/components/*.tsx` | 8 componentes de apresentação |
| `src/features/colaborador/indicadores/VisaoGeral.tsx` | Tela — visão geral dos indicadores |
| `src/features/colaborador/indicadores/Top10Unidades.tsx` | Tela — ranking de unidades |
| `src/features/colaborador/indicadores/VisaoDiaria.tsx` | Tela — acompanhamento dia a dia |
| `src/features/colaborador/indicadores/Cronologia.tsx` | Tela — evolução no tempo |
| `.env.local` | Credenciais do banco de indicadores (não versionado) |

**Modificados:**

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | 4 imports `lazy()` + 4 rotas |
| `src/components/layout/Sidebar.tsx` | Seção "Dashboard" nova; `SectionKey` e `sectionFromPath` estendidos e exportados |
| `src/components/layout/Sidebar.test.tsx` | Criado — testa o roteamento de seção |

## Como buscar os arquivos de origem

Todas as tarefas de port usam esta função. Cole no PowerShell uma vez por sessão:

```powershell
function Get-Origem($caminho, $destino) {
  $b = gh api "repos/agentemariapurepilates-blip/purepilatesrelatorios/contents/$caminho" | ConvertFrom-Json
  $txt = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b.content))
  $dir = Split-Path $destino -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
  Set-Content -Path $destino -Value $txt -Encoding utf8
  "OK  $caminho -> $destino"
}
```

---

### Task 1: Cliente Supabase de indicadores

Cria a conexão com o banco separado. É a fundação — todo o resto depende dela. O teste existe porque este é o maior risco do projeto: dois clientes `supabase-js` na mesma origem compartilham `localStorage`, e sem isolamento o cliente novo **derruba o login do usuário no Hub**.

**Files:**
- Create: `src/integrations/supabase/indicadores.ts`
- Create: `src/integrations/supabase/indicadores.test.ts`
- Create: `.env.local`

**Interfaces:**
- Consumes: nada (primeira tarefa)
- Produces: `supabaseIndicadores` (cliente Supabase) e `INDICADORES_AUTH_OPTIONS` (objeto de config), ambos importáveis de `@/integrations/supabase/indicadores`

- [ ] **Step 1: Criar o `.env.local` com as credenciais**

A chave anônima está no `.env` do repositório de origem. Buscar e gravar:

```powershell
$b = gh api "repos/agentemariapurepilates-blip/purepilatesrelatorios/contents/.env" | ConvertFrom-Json
$envTxt = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b.content))
$key = ($envTxt -split "`n" | Select-String 'PUBLISHABLE_KEY|ANON_KEY').ToString().Split('=',2)[1].Trim().Trim('"')
@(
  "VITE_INDICADORES_SUPABASE_URL=https://bweyyihedqnckbtzbkie.supabase.co"
  "VITE_INDICADORES_SUPABASE_ANON_KEY=$key"
) | Set-Content -Path ".env.local" -Encoding utf8
```

Confirmar que o git ignora o arquivo — o comando abaixo tem que imprimir o nome do arquivo:

```bash
git check-ignore -v .env.local
```

- [ ] **Step 2: Escrever o teste que falha**

Criar `src/integrations/supabase/indicadores.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { INDICADORES_AUTH_OPTIONS } from './indicadores';

describe('cliente Supabase de indicadores', () => {
  it('não persiste sessão — senão sobrescreve o login do Hub no localStorage', () => {
    expect(INDICADORES_AUTH_OPTIONS.persistSession).toBe(false);
    expect(INDICADORES_AUTH_OPTIONS.autoRefreshToken).toBe(false);
  });

  it('usa uma storageKey própria, diferente da do cliente do Hub', () => {
    expect(INDICADORES_AUTH_OPTIONS.storageKey).toBe('sb-indicadores-noauth');
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npm run test:run -- src/integrations/supabase/indicadores.test.ts`
Expected: FAIL — `Failed to resolve import "./indicadores"`

- [ ] **Step 4: Escrever a implementação**

Criar `src/integrations/supabase/indicadores.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

// Cliente somente-leitura do banco do Painel de Indicadores.
// ATENÇÃO: é um projeto Supabase DIFERENTE do Hub (bweyyihedqnckbtzbkie).
// Nunca autentica: a autorização de quem pode ver essas telas é feita pela
// sessão do Hub (ProtectedRoute), e este cliente só lê tabelas com RLS pública.
//
// persistSession/autoRefreshToken em false e storageKey própria são
// OBRIGATÓRIOS: dois clientes supabase-js na mesma origem disputam o
// localStorage, e sem isolamento este aqui derruba o login do Hub.
export const INDICADORES_AUTH_OPTIONS = {
  persistSession: false,
  autoRefreshToken: false,
  storageKey: 'sb-indicadores-noauth',
} as const;

const url = import.meta.env.VITE_INDICADORES_SUPABASE_URL;
const anonKey = import.meta.env.VITE_INDICADORES_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'VITE_INDICADORES_SUPABASE_URL e VITE_INDICADORES_SUPABASE_ANON_KEY precisam estar no .env.local. ' +
      'Sem elas as telas de Dashboard não carregam.',
  );
}

export const supabaseIndicadores = createClient(url, anonKey, {
  auth: { ...INDICADORES_AUTH_OPTIONS },
});
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npm run test:run -- src/integrations/supabase/indicadores.test.ts`
Expected: PASS — 2 testes

- [ ] **Step 6: Confirmar que a suíte inteira segue verde**

Run: `npm run test:run`
Expected: PASS — nenhum teste pré-existente quebrado

- [ ] **Step 7: Commit**

```bash
git add src/integrations/supabase/indicadores.ts src/integrations/supabase/indicadores.test.ts
git commit -m "feat(indicadores): cliente Supabase do Painel de Indicadores"
```

(`.env.local` não entra no commit — é ignorado pelo git de propósito.)

---

### Task 2: Tipos e libs puras

Camada sem dependência de rede nem de React. Vem antes dos hooks porque eles importam daqui.

**Files:**
- Create: `src/features/colaborador/indicadores/types.ts`
- Create: `src/features/colaborador/indicadores/lib/periods.ts`
- Create: `src/features/colaborador/indicadores/lib/timeline.ts`
- Create: `src/features/colaborador/indicadores/lib/formulaParser.ts`

**Interfaces:**
- Consumes: nada
- Produces: os tipos `Unit`, `RawConsolidatedDaily`, `IndicatorMapping`, `DailyGoal`, `DynamicColumn`, `CalculatedMetric`, `MetricCard`, `PeriodMetric`, `AggregatedMetric`, `UnitRanking`, `DailyMetric` (de `types.ts`); e as funções exportadas por `lib/periods.ts`, `lib/timeline.ts`, `lib/formulaParser.ts` — as Tasks 3, 4 e 5 importam delas com os mesmos nomes que tinham na origem.

- [ ] **Step 1: Buscar os 4 arquivos**

```powershell
$base = "src/features/colaborador/indicadores"
Get-Origem "src/types/dashboard.ts"     "$base/types.ts"
Get-Origem "src/lib/periods.ts"         "$base/lib/periods.ts"
Get-Origem "src/lib/timeline.ts"        "$base/lib/timeline.ts"
Get-Origem "src/lib/formulaParser.ts"   "$base/lib/formulaParser.ts"
```

- [ ] **Step 2: Corrigir os imports internos**

Nesses 4 arquivos, todo `from '@/types/dashboard'` vira `from '../types'` (nos arquivos dentro de `lib/`) ou `from './types'` (se algum estiver na raiz da feature). Verificar com:

```powershell
Get-ChildItem -Recurse -File "src/features/colaborador/indicadores" | Select-String -Pattern "@/types/dashboard"
```

Expected depois da correção: nenhum resultado. (Use `Get-ChildItem -Recurse` — o `Select-String -Path` sozinho **não** expande `**` no PowerShell, e a checagem passaria falsamente.)

- [ ] **Step 3: Confirmar que compila**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: nenhum erro nos arquivos de `features/colaborador/indicadores/`

- [ ] **Step 4: Commit**

```bash
git add src/features/colaborador/indicadores/
git commit -m "feat(indicadores): tipos e libs puras portados"
```

---

### Task 3: Hooks de dados

Os 8 hooks que leem o banco de indicadores. Aqui mora a troca de cliente — o erro mais fácil de cometer e o mais silencioso (a query vai para o banco errado e volta vazia, sem erro óbvio).

**Files:**
- Create: `src/features/colaborador/indicadores/hooks/useUnits.ts`
- Create: `src/features/colaborador/indicadores/hooks/useAggregatedData.ts`
- Create: `src/features/colaborador/indicadores/hooks/useRawData.ts`
- Create: `src/features/colaborador/indicadores/hooks/useDailyGoals.ts`
- Create: `src/features/colaborador/indicadores/hooks/useIndicatorMapping.ts`
- Create: `src/features/colaborador/indicadores/hooks/useMetrics.ts`
- Create: `src/features/colaborador/indicadores/hooks/useCalculatedMetrics.ts`
- Create: `src/features/colaborador/indicadores/hooks/useTimelineData.ts`

**Interfaces:**
- Consumes: `supabaseIndicadores` (Task 1); tipos e libs (Task 2)
- Produces: os hooks com os nomes exportados na origem, que a Task 5 importa —
  `useUnits`; `useAggregatedData`; `useRawData`; `useDailyGoals`;
  `useDashboardIndicators`, `useHighlightIndicators`, `useDailyIndicators`, `useActiveIndicatorMappings` (todos de `useIndicatorMapping.ts`);
  `useCalculatedMetrics`, `useHighlightMetrics`, `useCalculatedHighlightMetrics`, `useUnitRankings`, `usePercentageRankings` (de `useMetrics.ts`);
  `useHighlightCalculatedMetrics` (de `useCalculatedMetrics.ts`);
  `useTimelineData` e o tipo `Granularity` (de `useTimelineData.ts`)

- [ ] **Step 1: Buscar os 8 hooks**

```powershell
$base = "src/features/colaborador/indicadores/hooks"
foreach ($h in 'useUnits','useAggregatedData','useRawData','useDailyGoals','useIndicatorMapping','useMetrics','useCalculatedMetrics','useTimelineData') {
  Get-Origem "src/hooks/$h.ts" "$base/$h.ts"
}
```

- [ ] **Step 2: Trocar o cliente Supabase em todos**

Em cada arquivo:
- `import { supabase } from '@/integrations/supabase/client';` → `import { supabaseIndicadores } from '@/integrations/supabase/indicadores';`
- toda ocorrência de `supabase.` → `supabaseIndicadores.`

- [ ] **Step 3: Corrigir os demais imports**

- `from '@/types/dashboard'` → `from '../types'`
- `from '@/lib/formulaParser'` → `from '../lib/formulaParser'`
- `from '@/lib/periods'` → `from '../lib/periods'`
- `from '@/lib/timeline'` → `from '../lib/timeline'`

- [ ] **Step 4: Prefixar as query keys**

Em cada `useQuery({ queryKey: [...] })`, o primeiro elemento do array recebe o prefixo `indicadores_`. Exemplo: `queryKey: ['units']` vira `queryKey: ['indicadores_units']`.

- [ ] **Step 5: Verificar que nenhum hook aponta para o banco errado**

```powershell
Get-ChildItem -Recurse -File "src/features/colaborador/indicadores" | Select-String -Pattern "integrations/supabase/client"
```

Expected: **nenhum resultado.** Se aparecer algo, a query vai para o banco do Hub e volta vazia sem erro.

- [ ] **Step 6: Confirmar que compila**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: nenhum erro nos arquivos da feature

- [ ] **Step 7: Commit**

```bash
git add src/features/colaborador/indicadores/hooks/
git commit -m "feat(indicadores): hooks de dados apontando para o banco de indicadores"
```

---

### Task 4: Componentes de apresentação

Os 8 componentes que as telas montam. Não acessam rede — recebem dados por props.

**Files:**
- Create: `src/features/colaborador/indicadores/components/MetricCard.tsx`
- Create: `src/features/colaborador/indicadores/components/MetricsTable.tsx`
- Create: `src/features/colaborador/indicadores/components/RankingTable.tsx`
- Create: `src/features/colaborador/indicadores/components/TimelineTable.tsx`
- Create: `src/features/colaborador/indicadores/components/TrendChart.tsx`
- Create: `src/features/colaborador/indicadores/components/Filters.tsx`
- Create: `src/features/colaborador/indicadores/components/TimelineFilters.tsx`
- Create: `src/features/colaborador/indicadores/components/UnitFilter.tsx`

**Interfaces:**
- Consumes: tipos e libs (Task 2); `useTimelineData` (Task 3, usado por `TimelineFilters`)
- Produces: os componentes `MetricCard`, `MetricsTable`, `RankingTable`, `TimelineTable`, `TrendChart`, `Filters`, `TimelineFilters`, `UnitFilter` — importados pela Task 5 com esses nomes

- [ ] **Step 1: Buscar os 8 componentes**

```powershell
$base = "src/features/colaborador/indicadores/components"
foreach ($c in 'MetricCard','MetricsTable','RankingTable','TimelineTable','TrendChart','Filters','TimelineFilters','UnitFilter') {
  Get-Origem "src/components/dashboard/$c.tsx" "$base/$c.tsx"
}
```

- [ ] **Step 2: Corrigir os imports**

Manter apontando para o Hub (esses existem lá e são equivalentes):
- `@/components/ui/table`, `@/components/ui/scroll-area`, `@/components/ui/select`, `@/components/ui/tabs`, `@/components/ui/command`, `@/components/ui/popover`, `@/components/ui/button`, `@/lib/utils`

Reapontar para a feature:
- `from '@/types/dashboard'` → `from '../types'`
- `from '@/lib/periods'` → `from '../lib/periods'`
- `from '@/lib/timeline'` → `from '../lib/timeline'`
- `from '@/hooks/useTimelineData'` → `from '../hooks/useTimelineData'`

- [ ] **Step 3: Confirmar que compila**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: nenhum erro nos arquivos da feature

- [ ] **Step 4: Commit**

```bash
git add src/features/colaborador/indicadores/components/
git commit -m "feat(indicadores): componentes de apresentacao portados"
```

---

### Task 5: As 4 telas

Onde o layout e a autorização mudam de dono: o menu lateral do Painel é descartado (o Hub tem o seu), e a checagem de admin passa a vir do `AuthContext` do Hub.

**Files:**
- Create: `src/features/colaborador/indicadores/VisaoGeral.tsx`
- Create: `src/features/colaborador/indicadores/Top10Unidades.tsx`
- Create: `src/features/colaborador/indicadores/VisaoDiaria.tsx`
- Create: `src/features/colaborador/indicadores/Cronologia.tsx`

**Interfaces:**
- Consumes: hooks (Task 3); componentes (Task 4); `MainLayout` de `@/components/layout/MainLayout`; `useAuth` de `@/contexts/AuthContext`
- Produces: 4 componentes React com `export default` — a Task 6 os carrega via `lazy()`

- [ ] **Step 1: Buscar as 4 telas**

```powershell
$base = "src/features/colaborador/indicadores"
Get-Origem "src/pages/Index.tsx"    "$base/VisaoGeral.tsx"
Get-Origem "src/pages/Ranking.tsx"  "$base/Top10Unidades.tsx"
Get-Origem "src/pages/Daily.tsx"    "$base/VisaoDiaria.tsx"
Get-Origem "src/pages/Timeline.tsx" "$base/Cronologia.tsx"
```

- [ ] **Step 2: Renomear os componentes**

Cada arquivo tem um componente com o nome antigo. Renomear a declaração e o `export default`:

| Arquivo | Nome antigo | Nome novo |
|---|---|---|
| `VisaoGeral.tsx` | `Index` | `VisaoGeral` |
| `Top10Unidades.tsx` | `Ranking` | `Top10Unidades` |
| `VisaoDiaria.tsx` | `Daily` | `VisaoDiaria` |
| `Cronologia.tsx` | `Timeline` | `Cronologia` |

- [ ] **Step 3: Trocar o layout**

Em cada tela:
- remover `import { DashboardLayout } from '@/components/dashboard/DashboardLayout';`
- adicionar `import MainLayout from '@/components/layout/MainLayout';`
- trocar as tags `<DashboardLayout>` / `</DashboardLayout>` por `<MainLayout>` / `</MainLayout>`

- [ ] **Step 4: Trocar a fonte de autorização**

As telas importam `useUserProfile` e `useIsAdmin` de `@/hooks/useAuth` (do projeto de origem). Esses hooks leem as tabelas `profiles` e `user_roles`, que **voltam vazias no acesso anônimo** — deixá-los quebra as telas.

- remover `import { useUserProfile, useIsAdmin } from '@/hooks/useAuth';`
- adicionar `import { useAuth } from '@/contexts/AuthContext';`
- trocar `const { isAdmin } = useIsAdmin();` por `const { isAdmin } = useAuth();`
- onde houver `const { data: profile } = useUserProfile();`: como só admin/sede acessa estas telas e todos veem todas as unidades, remover a linha e substituir qualquer uso de `profile?.unit_id` pelo comportamento de admin (sem filtro de unidade). Em `Top10Unidades.tsx` há um bloqueio visual com ícone `Lock` para não-admin — pode permanecer, já que `isAdmin` agora vem do Hub.

- [ ] **Step 5: Corrigir os imports restantes**

- `from '@/components/dashboard/<X>'` → `from './components/<X>'`
- `from '@/hooks/<X>'` → `from './hooks/<X>'`
- `from '@/lib/periods'` → `from './lib/periods'`
- `from '@/types/dashboard'` → `from './types'`
- manter `@/components/ui/*` e `@/lib/utils` apontando para o Hub

- [ ] **Step 6: Verificar que nenhum resquício da origem sobrou**

```powershell
Get-ChildItem -Recurse -File "src/features/colaborador/indicadores" | Select-String -Pattern "DashboardLayout|@/hooks/useAuth|integrations/supabase/client"
```

Expected: **nenhum resultado.**

- [ ] **Step 7: Confirmar que compila**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: nenhum erro nos arquivos da feature

- [ ] **Step 8: Commit**

```bash
git add src/features/colaborador/indicadores/
git commit -m "feat(indicadores): 4 telas de relatorio adaptadas ao Hub"
```

---

### Task 6: Rotas

Torna as telas alcançáveis por URL. Depois desta tarefa dá para validar tudo no navegador digitando o endereço, mesmo antes do menu existir.

**Files:**
- Modify: `src/App.tsx:41` (bloco de imports do colaborador) e `src/App.tsx:111` (bloco de rotas)

**Interfaces:**
- Consumes: as 4 telas (Task 5)
- Produces: as rotas `/dashboard/visao-geral`, `/dashboard/top-10-unidades`, `/dashboard/visao-diaria`, `/dashboard/cronologia` — a Task 7 aponta o menu para elas

- [ ] **Step 1: Adicionar os imports `lazy()`**

Em `src/App.tsx`, logo depois da linha 41 (`const DashboardMidiaAdicional = ...`), inserir:

```tsx
// Painel de Indicadores (banco Supabase separado — ver integrations/supabase/indicadores.ts)
const IndicadoresVisaoGeral = lazy(() => import("./features/colaborador/indicadores/VisaoGeral"));
const IndicadoresTop10Unidades = lazy(() => import("./features/colaborador/indicadores/Top10Unidades"));
const IndicadoresVisaoDiaria = lazy(() => import("./features/colaborador/indicadores/VisaoDiaria"));
const IndicadoresCronologia = lazy(() => import("./features/colaborador/indicadores/Cronologia"));
```

- [ ] **Step 2: Adicionar as 4 rotas**

Logo depois da linha `<Route path="/minha-area/dashboard" ... />` (linha 111), inserir:

```tsx
<Route path="/dashboard/visao-geral" element={<ProtectedRoute requireColaborador><IndicadoresVisaoGeral /></ProtectedRoute>} />
<Route path="/dashboard/top-10-unidades" element={<ProtectedRoute requireColaborador><IndicadoresTop10Unidades /></ProtectedRoute>} />
<Route path="/dashboard/visao-diaria" element={<ProtectedRoute requireColaborador><IndicadoresVisaoDiaria /></ProtectedRoute>} />
<Route path="/dashboard/cronologia" element={<ProtectedRoute requireColaborador><IndicadoresCronologia /></ProtectedRoute>} />
```

`requireColaborador` já existe em `ProtectedRoute` ([ProtectedRoute.tsx:25-27](../../../src/components/auth/ProtectedRoute.tsx#L25-L27)) e `isColaborador` já engloba admin ([AuthContext.tsx:48](../../../src/contexts/AuthContext.tsx#L48)) — cobre admin + sede e exclui franqueado.

- [ ] **Step 3: Validar no navegador**

Subir `npm run dev` (se não estiver rodando) e abrir, logado como admin:
- http://localhost:8080/dashboard/visao-geral
- http://localhost:8080/dashboard/top-10-unidades
- http://localhost:8080/dashboard/visao-diaria
- http://localhost:8080/dashboard/cronologia

Expected: as 4 telas carregam dentro do layout do Hub, com dados reais. Abrir o console do navegador — não pode haver erro de rede vindo de `bweyyihedqnckbtzbkie`.

**Se uma tela vier vazia:** conferir na aba Network se a requisição foi para `bweyyihedqnckbtzbkie.supabase.co`. Se foi para o projeto do Hub, algum import de cliente escapou na Task 3.

- [ ] **Step 4: Confirmar que o login do Hub sobreviveu**

Ainda no navegador: recarregar a página (F5) e navegar para `/` .
Expected: continua logado. Se caiu para a tela de login, o isolamento da Task 1 falhou.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(indicadores): rotas /dashboard/* restritas a colaboradores"
```

---

### Task 7: Seção "Dashboard" no menu

Última peça funcional. O teste existe por um motivo específico: o Hub **já tem** uma rota `/minha-area/dashboard`, e a função que decide qual seção do menu abre é baseada em prefixo de caminho — sem cuidado, as duas seções disputam.

**Files:**
- Modify: `src/components/layout/Sidebar.tsx:79` (`SectionKey`), `:92-111` (constantes e `sectionFromPath`), `:214-222` (`minhaAreaNavigation`), `:526` (inserir a seção nova)
- Create: `src/components/layout/Sidebar.test.tsx`

**Interfaces:**
- Consumes: as rotas (Task 6)
- Produces: `sectionFromPath` exportado (hoje é privado do módulo) e o tipo `SectionKey` com o valor `'dashboard'`

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/layout/Sidebar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { sectionFromPath } from './Sidebar';

describe('sectionFromPath', () => {
  it('abre a seção Dashboard nas rotas do Painel de Indicadores', () => {
    expect(sectionFromPath('/dashboard/visao-geral')).toBe('dashboard');
    expect(sectionFromPath('/dashboard/top-10-unidades')).toBe('dashboard');
    expect(sectionFromPath('/dashboard/visao-diaria')).toBe('dashboard');
    expect(sectionFromPath('/dashboard/cronologia')).toBe('dashboard');
  });

  it('mantém /minha-area/dashboard em Minha Área — não confunde com a seção nova', () => {
    expect(sectionFromPath('/minha-area/dashboard')).toBe('minha-area');
  });

  it('não mexe nas seções que já existiam', () => {
    expect(sectionFromPath('/feed')).toBe('colaboradores');
    expect(sectionFromPath('/agente-design/gerar-foto')).toBe('agentes');
    expect(sectionFromPath('/admin/usuarios')).toBe('admin');
    expect(sectionFromPath('/avisos')).toBe(null);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm run test:run -- src/components/layout/Sidebar.test.tsx`
Expected: FAIL — `sectionFromPath` não é exportado

- [ ] **Step 3: Estender `SectionKey` e exportar `sectionFromPath`**

Em `src/components/layout/Sidebar.tsx`, linha 79:

```ts
type SectionKey = 'geral' | 'colaboradores' | 'agentes' | 'minha-area' | 'admin' | 'dashboard';
```

E na linha 105, trocar `const sectionFromPath = ...` por `export const sectionFromPath = ...`, adicionando o teste de `/dashboard` **antes** do teste de `/minha-area`:

```ts
export const sectionFromPath = (path: string): SectionKey | null => {
  if (AGENTES_DE_IA_ROUTE_PREFIXES.some((p) => path.startsWith(p))) return 'agentes';
  if (['/feed', '/pedidos-demanda', '/academy', '/colaborador/midias-sociais'].some((p) => path.startsWith(p))) return 'colaboradores';
  // Antes de '/minha-area': o Hub tem /minha-area/dashboard (Mídia Adicional),
  // que NÃO pertence a esta seção. Por isso o teste é '/dashboard/' com barra.
  if (path.startsWith('/dashboard/')) return 'dashboard';
  if (path.startsWith('/minha-area')) return 'minha-area';
  if (path.startsWith('/admin')) return 'admin';
  return null;
};
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm run test:run -- src/components/layout/Sidebar.test.tsx`
Expected: PASS — 3 testes

- [ ] **Step 5: Adicionar a lista de navegação**

Depois de `minhaAreaNavigation` (linha ~222), inserir:

```ts
  // Painel de Indicadores — banco Supabase separado, leitura anônima.
  // Rótulos e ícones espelham o menu do projeto de origem.
  const dashboardNavigation = [
    { name: 'Visão Geral', href: '/dashboard/visao-geral', icon: LayoutDashboard },
    { name: 'Top 10 Unidades', href: '/dashboard/top-10-unidades', icon: Trophy },
    { name: 'Visão Diária', href: '/dashboard/visao-diaria', icon: Calendar },
    { name: 'Cronologia', href: '/dashboard/cronologia', icon: LineChart },
  ];
```

Adicionar os ícones novos ao import de `lucide-react` do topo do arquivo (linhas 7-42): `LayoutDashboard`, `Trophy`, `Calendar`, `LineChart`. `BarChart3` já está importado.

- [ ] **Step 6: Renderizar a seção**

Entre o fechamento da seção "Minha Área" (`</Collapsible>` da linha ~526) e a abertura da seção "Admin" (`{isAdmin && (` da linha ~529), inserir:

```tsx
        {/* Dashboard — Painel de Indicadores */}
        {(isColaborador || isAdmin) && (
          <Collapsible open={openSection === 'dashboard'} onOpenChange={(o) => setOpenSection(o ? 'dashboard' : null)}>
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full">
                <SectionHeader icon={BarChart3} label="Dashboard" open={openSection === 'dashboard'} onMouseDown={(e) => e.preventDefault()} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <div className="space-y-0.5 pb-1">
                {dashboardNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
```

- [ ] **Step 7: Rodar a suíte inteira**

Run: `npm run test:run`
Expected: PASS — tudo verde

- [ ] **Step 8: Validar o menu no navegador**

Com `npm run dev` rodando e logado como admin:
- a seção "Dashboard" aparece entre "Minha Área" e "Administração";
- clicar nela expande os 4 itens e fecha a seção que estava aberta (comportamento acordeão);
- clicar em cada item navega e destaca o item certo;
- entrar direto em `/dashboard/cronologia` pela URL abre a seção "Dashboard" já expandida;
- entrar em `/minha-area/dashboard` abre "Minha Área", **não** a seção nova.

- [ ] **Step 9: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/Sidebar.test.tsx
git commit -m "feat(indicadores): secao Dashboard no menu da esquerda"
```

---

### Task 8: Verificação final

Fecha o ciclo com as checagens que o `CLAUDE.md` exige e com o teste de permissão, que é o único que precisa de uma segunda conta.

**Files:** nenhum (só verificação; correções pontuais se algo falhar)

**Interfaces:**
- Consumes: tudo
- Produces: nada

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: nenhum erro **novo**. Comparar com a saída do `main` limpo se houver dúvida — o projeto pode já ter avisos pré-existentes.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build conclui sem erro

- [ ] **Step 3: Suíte de testes**

Run: `npm run test:run`
Expected: PASS, incluindo os testes novos das Tasks 1 e 7

- [ ] **Step 4: Validação visual completa**

Com `npm run dev`, percorrer as 4 telas e conferir:
- os números batem com os do site do Cloudflare (`pure-pilates-insights.pages.dev`) no mesmo período — **é o teste que prova que o port está correto**;
- filtros de período, unidade e granularidade funcionam;
- o gráfico da Cronologia renderiza;
- nada aparece visualmente quebrado (é o risco mais provável — componentes portados podem usar classes de estilo que não existem no Hub);
- navegar pelas 4 telas e recarregar: **o login do Hub não cai.**

- [ ] **Step 5: Teste de permissão**

Logar com uma conta de **franqueado** e confirmar:
- a seção "Dashboard" não aparece no menu;
- acessar `/dashboard/visao-geral` pela URL redireciona para `/`.

- [ ] **Step 6: Confirmar que nada vazou para produção**

```bash
git status --short
git log origin/main..HEAD --oneline
```

Expected: os commits do plano aparecem como **locais, sem push**. `./deploy.sh` não foi executado em nenhum momento.

- [ ] **Step 7: Relatar ao usuário**

Resumir: o que funciona, o que ficou diferente do original, e qualquer ajuste visual que tenha sido necessário. Perguntar se quer que a Administração (fase 2) entre em algum momento.

---

## Cobertura do spec

| Requisito do spec | Onde é atendido |
|---|---|
| §5.2 cliente novo com `persistSession: false` | Task 1 |
| §5.3 credenciais em `.env.local` | Task 1, Step 1 |
| §6.1 arquivos portados | Tasks 2, 3, 4, 5 |
| §6.2.1 troca do cliente Supabase | Task 3, Steps 2 e 5 |
| §6.2.2 troca de layout | Task 5, Step 3 |
| §6.2.3 troca de auth | Task 5, Step 4 |
| §6.2.4 prefixo de query key | Task 3, Step 4 |
| §6.2.5 ajuste de estilos | Task 8, Step 4 |
| §6.3 rotas com `requireColaborador` | Task 6 |
| §6.4 seção no Sidebar + `sectionFromPath` | Task 7 |
| §7 caso de borda: `.env.local` ausente | Task 1, Step 4 (erro explícito) |
| §7 caso de borda: franqueado na URL | Task 8, Step 5 |
| §8 lint / build / testes / validação visual | Task 8 |
| §9 risco do `localStorage` | Task 1 (teste) + Task 6, Step 4 |
| §9 risco de colisão de rota | Task 7 (teste) |
| §9 risco de cliente errado | Task 3, Step 5 |
| §11 somente local | Global Constraints + Task 8, Step 6 |
