# Administração do Painel de Indicadores (modo consulta) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ao Hub uma tela `/dashboard/administracao` com 7 abas somente-leitura do Painel de Indicadores, garantindo por construção que nenhum caminho de escrita exista no código.

**Architecture:** Continuação do branch `feat/painel-indicadores`. Reaproveita o cliente `supabaseIndicadores`, os tipos e os hooks já portados. A garantia de "somente consulta" não vem de botão desabilitado, e sim da ausência de código de escrita — reforçada por um teste que varre a pasta da feature procurando chamadas de mutação e falha se achar alguma.

**Tech Stack:** Vite 5 · React 18 · TypeScript · React Router · @tanstack/react-query · shadcn/ui · Tailwind · supabase-js · Vitest

**Spec:** [2026-07-30-administracao-indicadores-consulta-design.md](../specs/2026-07-30-administracao-indicadores-consulta-design.md)

## Global Constraints

Valem para **todas** as tarefas:

- **Somente local.** Nunca `./deploy.sh`. Nunca `git push`. Instrução explícita do usuário.
- **Não editar `.env`** (é versionado). Nada novo é necessário em `.env.local` — o cliente de indicadores já existe.
- **Nenhuma dependência nova.**
- **NENHUM código de escrita pode existir** em `src/features/colaborador/indicadores/`. Isso inclui `.insert(`, `.upsert(`, `.update(`, `.delete(` e `functions.invoke(`. É o requisito central deste plano, não um detalhe.
- **Nunca importar `@/integrations/supabase/client`** dentro da feature — o cliente correto é `@/integrations/supabase/indicadores` (`supabaseIndicadores`).
- **Prefixo de query key:** toda chave do React Query começa com `indicadores_`.
- Comentários e textos de UI em português.
- Ambiente Windows/PowerShell (bash disponível). `Set-Content -Encoding utf8` no PowerShell 5.1 grava **BOM** — remover sempre que aparecer.
- Dev server Vite já rodando em `http://localhost:8080` — usar esse, não subir outro.
- Verificação: `npm run test:run`, `npx tsc --noEmit -p tsconfig.app.json` (o projeto já tem ~44 linhas de erros pré-existentes em outras features — critério é *zero erros novos*), `npm run build`, `npm run lint` (baseline 108 problems).

## Como buscar os arquivos de origem

Cole no PowerShell uma vez por sessão:

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

## Estrutura de arquivos

**Criados** (todos sob `src/features/colaborador/indicadores/`, exceto onde indicado):

| Arquivo | Responsabilidade |
|---|---|
| `sem-escrita.test.ts` | Trava: falha se qualquer chamada de mutação existir na feature |
| `hooks/useAnalysisData.ts` | Dados da aba Análise |
| `hooks/useClusterData.ts` | Dados da aba Clusters |
| `hooks/useGlobalGoals.ts` | Metas globais (só leitura) |
| `hooks/useIndicatorOrder.ts` | Ordem dos indicadores (só leitura) |
| `components/admin/ClusterGeneratorTab.tsx` | Aba Clusters |
| `components/admin/GlobalGoalsTab.tsx` | Aba Metas |
| `components/admin/IndicatorOrderTab.tsx` | Aba Ordenação |
| `components/admin/CalculatedMetricsTab.tsx` | Aba Calculadas |
| `components/admin/AnalysisTab.tsx` | Aba Análise |
| `components/admin/CamposTab.tsx` | Aba Campos (extraída do JSX inline da origem) |
| `components/admin/UnidadesTab.tsx` | Aba Unidades (extraída do JSX inline da origem) |
| `Administracao.tsx` | Tela com as 7 abas + banner de somente-consulta |

**Modificados:**

| Arquivo | Mudança |
|---|---|
| `hooks/useUnits.ts` | remove `useSyncUnits` |
| `hooks/useCalculatedMetrics.ts` | remove `useCreateCalculatedMetric`, `useUpdateCalculatedMetric`, `useDeleteCalculatedMetric` |
| `hooks/useIndicatorMapping.ts` | remove `useUpdateIndicatorMapping`, `useCreateIndicatorMapping`, `useDeleteIndicatorMapping` |
| `hooks/useRawData.ts` | remove `useImportCSV` |
| `hooks/useDailyGoals.ts` | remove `useImportGoals` |
| `src/App.tsx` | 1 import `lazy()` + 1 rota |
| `src/components/layout/Sidebar.tsx` | 1 item em `dashboardNavigation` |

---

### Task 1: A trava de escrita, e a limpeza que ela força

Escreve primeiro o teste que define a regra central do projeto. Ele vai falhar imediatamente, porque o branch anterior trouxe 9 funções de mutação de carona (sem nenhum consumidor — a revisão final do branch já as apontou como código morto). Removê-las faz o teste passar.

**Files:**
- Create: `src/features/colaborador/indicadores/sem-escrita.test.ts`
- Modify: `src/features/colaborador/indicadores/hooks/useUnits.ts`, `useCalculatedMetrics.ts`, `useIndicatorMapping.ts`, `useRawData.ts`, `useDailyGoals.ts`

**Interfaces:**
- Consumes: nada
- Produces: a garantia de que nenhum arquivo em `src/features/colaborador/indicadores/` contém chamada de mutação. Todas as tarefas seguintes dependem disso e serão barradas por este teste se violarem.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/features/colaborador/indicadores/sem-escrita.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// A área de Dashboard é SOMENTE CONSULTA por decisão de produto: ela lê um
// banco Supabase de produção compartilhado com o painel do Cloudflare, e uma
// escrita feita daqui valeria para todo mundo na hora, sem desfazer e sem
// registro de autoria. A garantia não é "botão desabilitado" — é a ausência
// de qualquer caminho de escrita no código. Este teste é o que sustenta isso.
const RAIZ = 'src/features/colaborador/indicadores';
const PROIBIDOS = ['.insert(', '.upsert(', '.update(', '.delete(', 'functions.invoke('];

function arquivosDe(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivosDe(caminho);
    return /\.(ts|tsx)$/.test(nome) ? [caminho] : [];
  });
}

describe('área de Dashboard é somente consulta', () => {
  it('nenhum arquivo da feature contém chamada de escrita no banco', () => {
    const infratores: string[] = [];

    for (const arquivo of arquivosDe(RAIZ)) {
      if (arquivo.endsWith('sem-escrita.test.ts')) continue;
      const linhas = readFileSync(arquivo, 'utf8').split('\n');
      linhas.forEach((linha, i) => {
        for (const proibido of PROIBIDOS) {
          if (linha.includes(proibido)) {
            infratores.push(`${arquivo}:${i + 1} → ${proibido}  ${linha.trim()}`);
          }
        }
      });
    }

    expect(infratores).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm run test:run -- src/features/colaborador/indicadores/sem-escrita.test.ts`
Expected: FAIL, listando as ocorrências nos 5 arquivos de hook. Guarde a lista — ela é o roteiro do Step 3.

**Se aparecer alguma ocorrência que NÃO seja chamada ao Supabase** (por exemplo `.delete(` de um `Map`, ou `.update(` de outra biblioteca), é falso positivo do padrão. Não relaxe o teste para acomodá-lo: prefira reescrever aquele trecho para não casar (usar outra estrutura de dados), ou, se for inevitável, adicione uma exceção **por arquivo e linha específicos, com comentário justificando** — nunca removendo o padrão da lista, o que abriria a porta para escrita real passar despercebida.

- [ ] **Step 3: Remover as 9 funções de mutação**

Remover **a função inteira**, não só a linha da chamada. Nenhuma tem consumidor (confirme com busca antes de remover cada uma):

| Arquivo | Funções a remover |
|---|---|
| `hooks/useUnits.ts` | `useSyncUnits` |
| `hooks/useCalculatedMetrics.ts` | `useCreateCalculatedMetric`, `useUpdateCalculatedMetric`, `useDeleteCalculatedMetric` |
| `hooks/useIndicatorMapping.ts` | `useUpdateIndicatorMapping`, `useCreateIndicatorMapping`, `useDeleteIndicatorMapping` |
| `hooks/useRawData.ts` | `useImportCSV` |
| `hooks/useDailyGoals.ts` | `useImportGoals` |

Verifique ausência de consumidor antes de cada remoção:

```powershell
Get-ChildItem -Recurse -File src | Select-String -Pattern "useSyncUnits|useCreateCalculatedMetric|useUpdateCalculatedMetric|useDeleteCalculatedMetric|useUpdateIndicatorMapping|useCreateIndicatorMapping|useDeleteIndicatorMapping|useImportCSV|useImportGoals"
```

Expected: só as próprias declarações. Se aparecer um uso, PARE e reporte.

Remova também imports que ficarem órfãos (`useMutation`, `useQueryClient`, `toast`) — mas **só** se nenhuma função restante do arquivo os usar.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm run test:run -- src/features/colaborador/indicadores/sem-escrita.test.ts`
Expected: PASS

- [ ] **Step 5: Confirmar que nada quebrou**

Run: `npm run test:run`
Expected: PASS — as 4 telas de relatório não usavam nenhuma das funções removidas.

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: zero erros novos.

Run: `npm run lint`
Expected: **menos** que 108 problems — várias das funções removidas continham `any`.

- [ ] **Step 6: Commit**

```bash
git add src/features/colaborador/indicadores/
git commit -m "feat(indicadores): trava de somente-consulta e remocao das mutacoes"
```

---

### Task 2: Os 4 hooks novos, sem escrita

**Files:**
- Create: `src/features/colaborador/indicadores/hooks/useAnalysisData.ts`
- Create: `src/features/colaborador/indicadores/hooks/useClusterData.ts`
- Create: `src/features/colaborador/indicadores/hooks/useGlobalGoals.ts`
- Create: `src/features/colaborador/indicadores/hooks/useIndicatorOrder.ts`

**Interfaces:**
- Consumes: `supabaseIndicadores` de `@/integrations/supabase/indicadores`; tipos de `../types`; libs de `../lib/*`
- Produces, para as Tasks 3-5:
  - `useAnalysisData` (de `useAnalysisData.ts`)
  - `useClusterData`, `useAvailableMonths` (de `useClusterData.ts`)
  - `useGlobalGoals` (de `useGlobalGoals.ts`)
  - `useDashboardOrderedIndicators`, `useDailyOrderedIndicators` (de `useIndicatorOrder.ts`)

- [ ] **Step 1: Buscar os 4 hooks**

```powershell
$base = "src/features/colaborador/indicadores/hooks"
foreach ($h in 'useAnalysisData','useClusterData','useGlobalGoals','useIndicatorOrder') {
  Get-Origem "src/hooks/$h.ts" "$base/$h.ts"
}
```

- [ ] **Step 2: Remover as funções de escrita destes hooks**

Dois dos quatro trazem mutação. Remova **a função inteira**:

| Arquivo | Remover | Motivo |
|---|---|---|
| `hooks/useGlobalGoals.ts` | `useSaveGlobalGoals` | contém `.upsert()` |
| `hooks/useIndicatorOrder.ts` | `useUpdateIndicatorOrder` | contém `.update()` |

`useAnalysisData.ts` e `useClusterData.ts` não têm escrita — porte-os sem alteração de lógica.

- [ ] **Step 3: Trocar o cliente e corrigir imports**

- `import { supabase } from '@/integrations/supabase/client'` → `import { supabaseIndicadores } from '@/integrations/supabase/indicadores'`, e toda ocorrência de `supabase.` → `supabaseIndicadores.`
- `from '@/types/dashboard'` → `from '../types'`
- `from '@/lib/periods'` → `from '../lib/periods'`, `from '@/lib/timeline'` → `from '../lib/timeline'`, `from '@/lib/formulaParser'` → `from '../lib/formulaParser'`
- **Varra por qualquer outro import `@/...`** que não exista no Hub e corrija. Os que EXISTEM e devem ficar: `@/components/ui/*`, `@/lib/utils`, `@/contexts/AuthContext`, `@/integrations/supabase/indicadores`.

- [ ] **Step 4: Prefixar as query keys**

Primeiro elemento de cada `queryKey` recebe o prefixo `indicadores_`. Se algum hook novo compartilhar chave com um já portado (ex.: `indicadores_units`), use exatamente a mesma string para o cache ser compartilhado de propósito.

- [ ] **Step 5: Rodar a trava e a suíte**

Run: `npm run test:run`
Expected: PASS, incluindo `sem-escrita.test.ts` — se ele falhar, alguma escrita escapou no Step 2.

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: zero erros novos.

- [ ] **Step 6: Commit**

```bash
git add src/features/colaborador/indicadores/hooks/
git commit -m "feat(indicadores): hooks de analise, clusters, metas e ordenacao (somente leitura)"
```

---

### Task 3: As 3 abas menores

`ClusterGeneratorTab` não tem escrita nenhuma na origem — porte quase direto. `GlobalGoalsTab` e `IndicatorOrderTab` são construídas em torno de editar, então o que sobra é a visualização.

**Files:**
- Create: `src/features/colaborador/indicadores/components/admin/ClusterGeneratorTab.tsx`
- Create: `src/features/colaborador/indicadores/components/admin/GlobalGoalsTab.tsx`
- Create: `src/features/colaborador/indicadores/components/admin/IndicatorOrderTab.tsx`

**Interfaces:**
- Consumes: hooks da Task 2 e os já existentes (`useIndicatorMappings`, `useCalculatedMetrics`, `useAllUnits`)
- Produces: os componentes `ClusterGeneratorTab`, `GlobalGoalsTab`, `IndicatorOrderTab` — a Task 6 os importa. **Confirme se a origem usa `export function` (nomeado) ou `export default` e preserve**; `Admin.tsx` da origem importa `ClusterGeneratorTab`, `GlobalGoalsTab` e `IndicatorOrderTab` com chaves (nomeados).

- [ ] **Step 1: Buscar os 3 componentes**

```powershell
$base = "src/features/colaborador/indicadores/components/admin"
foreach ($c in 'ClusterGeneratorTab','GlobalGoalsTab','IndicatorOrderTab') {
  Get-Origem "src/components/admin/$c.tsx" "$base/$c.tsx"
}
```

- [ ] **Step 2: Corrigir os imports**

A partir de `components/admin/`, os caminhos relativos são: `'../../types'`, `'../../lib/<nome>'`, `'../../hooks/<nome>'`. Mantenha `@/components/ui/*` e `@/lib/utils` apontando para o Hub.

- [ ] **Step 3: Remover os controles de edição**

Em cada componente, remova: import e uso dos hooks de mutação que não existem mais, botões de salvar/criar/excluir, `<Input>`/`<Switch>`/`<Select>` que serviam para editar, alças de arrastar-e-soltar, e o estado local que só existia para o formulário.

O que **permanece**: tabelas, listas, gráficos, filtros de leitura (período, unidade) e estados de carregando/vazio.

Se remover um controle deixar um bloco de layout vazio (um `<Card>` só com o formulário, por exemplo), remova o bloco inteiro em vez de deixar uma casca.

- [ ] **Step 4: Rodar a trava e verificar**

Run: `npm run test:run`
Expected: PASS, `sem-escrita.test.ts` incluído.

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: zero erros novos. Erros de "declarado mas não usado" apontam import órfão do Step 3 — corrija.

- [ ] **Step 5: Commit**

```bash
git add src/features/colaborador/indicadores/components/admin/
git commit -m "feat(indicadores): abas Clusters, Metas e Ordenacao (somente leitura)"
```

---

### Task 4: As 2 abas maiores

`CalculatedMetricsTab` (421 linhas) usa as 3 mutações de métricas calculadas. `AnalysisTab` (501 linhas) escreve **direto** com `.delete()` e `.update()`, na tabela `analysis_summary_order` — que, além de tudo, é inacessível pela chave anônima. Ambas exigem remoção cuidadosa.

**Files:**
- Create: `src/features/colaborador/indicadores/components/admin/CalculatedMetricsTab.tsx`
- Create: `src/features/colaborador/indicadores/components/admin/AnalysisTab.tsx`

**Interfaces:**
- Consumes: `useCalculatedMetrics`, `useRawData`, `useAnalysisData`, `useClusterData`, `useIndicatorMappings`
- Produces: os componentes `CalculatedMetricsTab` e `AnalysisTab` (ambos exportados como nomeados na origem — confirme e preserve)

- [ ] **Step 1: Buscar os 2 componentes**

```powershell
$base = "src/features/colaborador/indicadores/components/admin"
Get-Origem "src/components/admin/CalculatedMetricsTab.tsx" "$base/CalculatedMetricsTab.tsx"
Get-Origem "src/components/admin/AnalysisTab.tsx"          "$base/AnalysisTab.tsx"
```

- [ ] **Step 2: Corrigir os imports** (mesmas regras da Task 3, Step 2)

- [ ] **Step 3: `CalculatedMetricsTab` — remover a edição**

Remova o uso de `useCreateCalculatedMetric`, `useUpdateCalculatedMetric` e `useDeleteCalculatedMetric` (que não existem mais), o diálogo de criar/editar métrica, o botão de excluir e o estado do formulário.

O que permanece: a tabela das métricas calculadas com nome, fórmula, formato e onde cada uma aparece. É exatamente o que serve para consulta — conferir uma fórmula sem abrir o Cloudflare.

- [ ] **Step 4: `AnalysisTab` — remover a escrita direta**

Este componente chama `.delete()` e `.update()` diretamente, na personalização da ordem do resumo. Remova essa funcionalidade inteira: as chamadas, os controles que as disparam e o estado associado.

A análise em si (que lê `raw_consolidated_daily` e `units`, ambas acessíveis) permanece — é a parte de maior valor de todo este plano.

Se a ordem do resumo vier de `analysis_summary_order` para *exibição*, saiba que essa tabela **retorna vazio na leitura anônima**. Trate o caso vazio com a ordem padrão do componente, sem quebrar. Se isso não for possível sem reescrever a lógica, PARE e reporte — não invente uma ordenação nova.

- [ ] **Step 5: Rodar a trava e verificar**

Run: `npm run test:run`
Expected: PASS. Se `sem-escrita.test.ts` falhar, ele aponta arquivo e linha exatos do que escapou.

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: zero erros novos.

- [ ] **Step 6: Commit**

```bash
git add src/features/colaborador/indicadores/components/admin/
git commit -m "feat(indicadores): abas Calculadas e Analise (somente leitura)"
```

---

### Task 5: As 2 abas que não existem como componente

Na origem, as abas `mapping` (Campos) e `units` (Unidades) são JSX escrito direto dentro de `Admin.tsx`, não componentes separados. Aqui elas viram componentes próprios — o que também mantém `Administracao.tsx` pequeno.

**Files:**
- Create: `src/features/colaborador/indicadores/components/admin/CamposTab.tsx`
- Create: `src/features/colaborador/indicadores/components/admin/UnidadesTab.tsx`

**Interfaces:**
- Consumes: `useIndicatorMappings` (de `../../hooks/useIndicatorMapping`), `useAllUnits` (de `../../hooks/useUnits`)
- Produces: `CamposTab` e `UnidadesTab`, ambos `export function` (nomeados), sem props

- [ ] **Step 1: Ler o JSX de origem**

```powershell
$b = gh api "repos/agentemariapurepilates-blip/purepilatesrelatorios/contents/src/pages/Admin.tsx" | ConvertFrom-Json
[System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b.content)) | Set-Content "$env:TEMP\Admin-origem.tsx" -Encoding utf8
```

Localize `<TabsContent value="mapping">` e `<TabsContent value="units">`.

- [ ] **Step 2: Criar `CamposTab.tsx`**

Extraia a tabela de `indicator_mapping` do bloco `mapping`: colunas de nome do campo, nome de exibição, tipo, categoria e os indicadores de onde aparece (dashboard/diário/destaque).

**Não** porte: o `<Dialog>` de criar campo, o botão de excluir, os `<Switch>` que alternavam visibilidade, os `<Input>` de edição. Onde havia `<Switch>`, mostre o estado como texto ou `<Badge>` — o dado continua visível, só não editável.

- [ ] **Step 3: Criar `UnidadesTab.tsx`**

Extraia a tabela de `units` do bloco `units`: nome, slug e situação de cada unidade.

**Não** porte: o botão "Sincronizar unidades" (usava `useSyncUnits`, removido na Task 1).

- [ ] **Step 4: Verificar**

Run: `npm run test:run` — PASS, trava incluída.
Run: `npx tsc --noEmit -p tsconfig.app.json` — zero erros novos.

- [ ] **Step 5: Commit**

```bash
git add src/features/colaborador/indicadores/components/admin/
git commit -m "feat(indicadores): abas Campos e Unidades extraidas como componentes"
```

---

### Task 6: A tela com as 7 abas

**Files:**
- Create: `src/features/colaborador/indicadores/Administracao.tsx`

**Interfaces:**
- Consumes: os 7 componentes das Tasks 3, 4 e 5; `MainLayout` de `@/components/layout/MainLayout` (**export default** — import sem chaves)
- Produces: componente `Administracao` com `export default` — a Task 7 o carrega via `lazy()`

- [ ] **Step 1: Escrever a tela**

Criar `src/features/colaborador/indicadores/Administracao.tsx`. Estrutura: `MainLayout` → banner de somente-consulta → `Tabs` do shadcn com as 7 abas, na ordem: **Análise, Clusters, Campos, Calculadas, Ordenação, Metas, Unidades**. Aba inicial: `analise`.

O banner segue o padrão visual que as telas de relatório já usam (ver `VisaoGeral.tsx`, o bloco `bg-pure-red/5 border border-pure-red/20`), com o texto:

> **Somente consulta** — esta área mostra a configuração do Painel de Indicadores. Para alterar qualquer coisa, use o painel em `pure-pilates-insights.pages.dev`.

Sem isso, quem procura o botão de salvar conclui que a tela está quebrada.

Use `Tabs`, `TabsList`, `TabsTrigger` e `TabsContent` de `@/components/ui/tabs`. Em telas estreitas a lista de 7 abas precisa rolar horizontalmente sem quebrar o layout — aplique `overflow-x-auto` na `TabsList`.

- [ ] **Step 2: Verificar que compila pelo Vite**

```powershell
try {
  $r = Invoke-WebRequest "http://localhost:8080/src/features/colaborador/indicadores/Administracao.tsx" -UseBasicParsing -TimeoutSec 30
  "Administracao.tsx  HTTP $($r.StatusCode)"
} catch { "FALHOU: $($_.Exception.Message)" }
```

Expected: HTTP 200.

- [ ] **Step 3: Verificar**

Run: `npm run test:run` — PASS.
Run: `npx tsc --noEmit -p tsconfig.app.json` — zero erros novos.

- [ ] **Step 4: Commit**

```bash
git add src/features/colaborador/indicadores/Administracao.tsx
git commit -m "feat(indicadores): tela de Administracao com as 7 abas de consulta"
```

---

### Task 7: Rota e item de menu

**Files:**
- Modify: `src/App.tsx` (bloco de imports do Painel de Indicadores, e o grupo de rotas `/dashboard/*` dentro do `ErrorBoundary`)
- Modify: `src/components/layout/Sidebar.tsx` (`dashboardNavigation` e o import de ícones)

**Interfaces:**
- Consumes: `Administracao` (Task 6)
- Produces: rota `/dashboard/administracao` e o item de menu correspondente

- [ ] **Step 1: Adicionar o import `lazy()`**

Em `src/App.tsx`, junto dos outros imports do Painel de Indicadores:

```tsx
const IndicadoresAdministracao = lazy(() => import("./features/colaborador/indicadores/Administracao"));
```

- [ ] **Step 2: Adicionar a rota**

**Dentro do `ErrorBoundary`** que já envolve as rotas `/dashboard/*` — se ficar fora, um `.env.local` ausente volta a derrubar o Hub inteiro em tela branca, que foi um achado corrigido no branch anterior:

```tsx
<Route path="/dashboard/administracao" element={<ProtectedRoute requireColaborador><IndicadoresAdministracao /></ProtectedRoute>} />
```

- [ ] **Step 3: Adicionar o item de menu**

Em `src/components/layout/Sidebar.tsx`, ao final de `dashboardNavigation`:

```ts
    { name: 'Administração', href: '/dashboard/administracao', icon: SlidersHorizontal },
```

Adicione `SlidersHorizontal` ao import de `lucide-react`. **Não use `Settings`** — a seção "Administração" do próprio Hub já usa esse ícone, e repetir faria dois itens de mesmo nome e mesmo ícone apontarem para coisas diferentes.

`sectionFromPath` não muda: `/dashboard/administracao` já casa com o prefixo `/dashboard/`.

- [ ] **Step 4: Verificar**

Run: `npm run test:run` — PASS, incluindo os testes do Sidebar.
Run: `npx tsc --noEmit -p tsconfig.app.json` — zero erros novos.
Run: `npm run build` — passa.

```powershell
try { "Hub: HTTP $((Invoke-WebRequest 'http://localhost:8080/' -UseBasicParsing -TimeoutSec 15).StatusCode)" } catch { "FALHOU" }
```

Expected: HTTP 200.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/layout/Sidebar.tsx
git commit -m "feat(indicadores): rota e item de menu da Administracao"
```

---

### Task 8: Verificação final

**Files:** nenhum (só verificação; correções pontuais se algo falhar)

- [ ] **Step 1: Suíte completa**

Run: `npm run test:run`
Expected: PASS, com `sem-escrita.test.ts` verde.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: sucesso.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: **igual ou menor** que 108 problems. Remover 9 funções de mutação com `any` na Task 1 deve ter reduzido a contagem; se subiu, investigue.

- [ ] **Step 4: Auditoria manual da trava**

O teste cobre a pasta da feature. Confirme que nada foi contornado:

```powershell
Get-ChildItem -Recurse -File "src/features/colaborador/indicadores" | Select-String -Pattern "\.insert\(|\.upsert\(|\.update\(|\.delete\(|functions\.invoke\(" | Where-Object { $_.Path -notmatch "sem-escrita.test.ts" }
```

Expected: **nenhum resultado.**

- [ ] **Step 5: Validação visual (usuário humano)**

Não executável por agente — requer navegador e login. Registrar como pendente e relatar:
- as 7 abas abrem e mostram dados reais;
- os dados batem com as abas equivalentes no Cloudflare;
- **nenhuma aba tem botão de salvar, criar, excluir ou campo editável**;
- o banner de somente-consulta aparece;
- nada visualmente quebrado (risco conhecido: componentes portados usarem estilos inexistentes no Hub — custou 2 achados no branch anterior);
- o login do Hub sobrevive à navegação e ao F5.

- [ ] **Step 6: Confirmar que nada vazou**

```bash
git status --short
git log origin/main..HEAD --oneline
```

Expected: commits **locais, sem push**. `./deploy.sh` não executado.

- [ ] **Step 7: Relatar ao usuário**

O que funciona, o que ficou diferente da origem (especialmente o que foi removido de cada aba), e o que precisa da validação visual dele.

---

## Cobertura do spec

| Requisito do spec | Onde é atendido |
|---|---|
| §3 as 7 abas em escopo | Tasks 3, 4, 5, 6 |
| §3 as 5 abas fora de escopo | Nunca portadas — nenhuma task as menciona como entrega |
| §5.1 arquivos criados e modificados | Tasks 1-7 |
| §5.2 item 1 — remover as 9 mutações | Task 1, Step 3 |
| §5.2 item 2 — hooks novos sem mutação | Task 2, Step 2 |
| §5.2 item 3 — remover controles de edição | Tasks 3 (Step 3), 4 (Steps 3-4), 5 (Steps 2-3) |
| §5.2 item 4 — teste-trava | Task 1, Steps 1-2 |
| §5.3 banner de somente-consulta | Task 6, Step 1 |
| §5.4 rota, menu e ícone | Task 7 |
| §6 borda: `analysis_summary_order` vazia | Task 4, Step 4 |
| §7 testes e validação | Tasks 1-8 |
| §9 somente local | Global Constraints + Task 8, Step 6 |
