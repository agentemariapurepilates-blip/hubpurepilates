# Painel de Indicadores no Hub — Design Spec

**Data:** 2026-07-30
**Status:** Aguardando revisão do usuário
**Escopo operacional:** implementação **somente local** — sem `./deploy.sh` e sem `git push`

---

## 1. Contexto

O **Painel de Indicadores** (`purepilatesrelatorios`) é um app Vite/React separado, publicado no Cloudflare Pages em `pure-pilates-insights.pages.dev`. Ele mostra os indicadores operacionais das unidades: metas, ranking, acompanhamento diário e evolução no tempo.

Hoje ele vive fora do Hub, com login próprio. Quem acompanha os números precisa manter dois endereços e duas sessões.

Ponto central da arquitetura: **os dois projetos usam bancos Supabase diferentes.**

| Projeto | Supabase |
|---|---|
| Hub (`hubpurepilates`) | `evprrtvbvjnjixogjsmn` |
| Painel de Indicadores (`purepilatesrelatorios`) | `bweyyihedqnckbtzbkie` |

Uma sessão do Hub não é reconhecida pelo banco do Painel. Isso é o que define as escolhas deste spec.

## 2. Objetivo

Trazer as telas de relatório do Painel de Indicadores para dentro do Hub, acessíveis por uma seção "Dashboard" no menu da esquerda, **sem exigir um segundo login**.

## 3. Escopo

### Em escopo

- Segundo cliente Supabase no Hub, apontando para o banco de indicadores em modo anônimo.
- Port de 4 telas de relatório: **Visão Geral**, **Top 10 Unidades**, **Visão Diária**, **Cronologia**.
- Port dos componentes, hooks, libs e tipos que essas telas usam.
- Seção nova "Dashboard" no `Sidebar`, com os 4 itens, abaixo de "Minha Área".
- 4 rotas novas em `App.tsx`, restritas a admin + colaboradores da sede.

### Fora de escopo

- **Tela de Administração do Painel** (8 abas: `UsersManagementTab`, `GlobalGoalsTab`, `ReportRecipientsTab`, `IntegrationStatusTab`, `AnalysisTab`, `CalculatedMetricsTab`, `ClusterGeneratorTab`, `IndicatorOrderTab`). Depende de `has_role(auth.uid(),'admin')` no banco de indicadores, que uma sessão do Hub não satisfaz. Continua sendo feita no Cloudflare. Ver §10.
- **Tela de login** (`Auth.tsx`) — o Hub já tem a sua.
- **Recorte por unidade.** Decisão do usuário: só admin/sede acessa, e vê todas as unidades.
- Migrations, Edge Functions e qualquer alteração no banco. Este spec é 100% frontend.
- Aposentar o site do Cloudflare. Ele continua no ar, inclusive porque a Administração ainda vive lá.

## 4. Decisões e justificativas

| Pergunta | Decisão | Justificativa |
|---|---|---|
| Como acessar os dados do outro banco? | Segundo cliente Supabase, anônimo | As policies de leitura já permitem anon (verificado — §5). Sem backend novo. |
| Quem vê os relatórios? | Só admin + colaboradores da sede | Evita ter que recriar o recorte por unidade no Hub. |
| E a aba Administração? | Fase 2 | ~110 KB de código e exige Edge Functions novas. Relatórios primeiro. |
| Nome da seção | "Dashboard" | Pedido do usuário. |
| Colisão com o item "Dashboard" que já existe em Minha Área | Aceita conscientemente | Usuário optou por manter os dois após o risco ser apresentado. |
| Posição no menu | Abaixo de "Minha Área" | Escolha do usuário. |

## 5. Arquitetura de dados

### 5.1 Acesso anônimo — verificado, não suposto

Leitura direta na API REST do projeto `bweyyihedqnckbtzbkie` usando apenas a chave anônima, em 2026-07-30:

| Tabela | Resultado |
|---|---|
| `units` | OK — retorna dados |
| `raw_consolidated_daily` | OK — retorna dados |
| `daily_goals` | OK — retorna dados |
| `indicator_mapping` | OK — retorna dados |
| `calculated_metrics` | OK — retorna dados |
| `dynamic_columns` | OK — retorna dados |
| `analysis_summary_order` | Vazio (RLS filtra) — só Administração usa |
| `profiles` | Vazio (RLS filtra) — só Administração usa |

As policies de leitura dessas tabelas são `USING (true)` ou incluem `auth.uid() IS NULL`, ou seja, o acesso anônimo é intencional no projeto de origem. **Nenhuma policy é alterada por este spec.**

**Consequência de segurança a registrar:** esses dados já são legíveis por qualquer um que tenha a chave anônima, que está publicada no bundle do site do Cloudflare. Embutir no Hub não expõe nada que já não estivesse exposto — mas também não corrige essa exposição. Endurecer a RLS do projeto de indicadores é um trabalho separado, fora deste spec.

### 5.2 Cliente novo

Arquivo novo: `src/integrations/supabase/indicadores.ts`

```ts
import { createClient } from '@supabase/supabase-js';

// Cliente somente-leitura do banco do Painel de Indicadores (projeto Supabase
// SEPARADO do Hub). Nunca autentica: as telas usam a sessão do Hub para
// autorização, e este cliente só lê tabelas com RLS pública.
export const supabaseIndicadores = createClient(
  import.meta.env.VITE_INDICADORES_SUPABASE_URL,
  import.meta.env.VITE_INDICADORES_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storageKey: 'sb-indicadores-noauth',
    },
  },
);
```

**`persistSession: false` não é opcional.** Dois clientes `supabase-js` na mesma origem compartilham o `localStorage`; sem isolar, o cliente novo sobrescreve a sessão do Hub e derruba o login do usuário. `storageKey` distinto é cinto e suspensório.

### 5.3 Variáveis de ambiente

Vão em **`.env.local`**, não em `.env`.

```
VITE_INDICADORES_SUPABASE_URL=https://bweyyihedqnckbtzbkie.supabase.co
VITE_INDICADORES_SUPABASE_ANON_KEY=<chave anon do projeto de indicadores>
```

Motivo: o `.env` do Hub **é versionado** (está no `.gitignore`, mas foi commitado antes da regra, então o ignore não vale para ele). Editá-lo sujaria o `git status`. Já `.env.local` não é rastreado e é coberto pelo padrão `.env.*` do `.gitignore`. O Vite carrega `.env.local` com prioridade sobre `.env`.

A chave anônima sai do `.env` do repositório `purepilatesrelatorios`.

## 6. Arquitetura de frontend

### 6.1 Arquivos portados

Destino: `src/features/colaborador/indicadores/`

| Origem (`purepilatesrelatorios`) | Destino |
|---|---|
| `src/pages/Index.tsx` | `VisaoGeral.tsx` |
| `src/pages/Ranking.tsx` | `Top10Unidades.tsx` |
| `src/pages/Daily.tsx` | `VisaoDiaria.tsx` |
| `src/pages/Timeline.tsx` | `Cronologia.tsx` |
| `src/types/dashboard.ts` | `types.ts` |
| `src/lib/{periods,timeline,formulaParser}.ts` | `lib/` |
| `src/hooks/useUnits.ts` | `hooks/` |
| `src/hooks/useAggregatedData.ts` | `hooks/` |
| `src/hooks/useRawData.ts` | `hooks/` |
| `src/hooks/useDailyGoals.ts` | `hooks/` |
| `src/hooks/useIndicatorMapping.ts` | `hooks/` |
| `src/hooks/useMetrics.ts` | `hooks/` |
| `src/hooks/useCalculatedMetrics.ts` | `hooks/` |
| `src/hooks/useTimelineData.ts` | `hooks/` |
| `src/components/dashboard/MetricCard.tsx` | `components/` |
| `src/components/dashboard/MetricsTable.tsx` | `components/` |
| `src/components/dashboard/RankingTable.tsx` | `components/` |
| `src/components/dashboard/TimelineTable.tsx` | `components/` |
| `src/components/dashboard/TrendChart.tsx` | `components/` |
| `src/components/dashboard/Filters.tsx` | `components/` |
| `src/components/dashboard/TimelineFilters.tsx` | `components/` |
| `src/components/dashboard/UnitFilter.tsx` | `components/` |

**Não portados:** `DashboardLayout.tsx` (o Hub tem `MainLayout`), `useAuth.ts` e `ProtectedRoute.tsx` (o Hub tem os seus), `Auth.tsx` (login, excluído a pedido), `CSVUploader.tsx` e `lib/exportUtils.ts` (só a Administração usa), toda a pasta `components/admin/`, e os hooks exclusivos da Administração (`useAnalysisData`, `useClusterData`, `useGlobalGoals`, `useIndicatorOrder`, `useIntegrationLogs`, `useReportSettings`).

**Sem dependências novas.** O Hub já tem `date-fns`, `recharts`, `@tanstack/react-query`, `cmdk`, e os componentes shadcn necessários (`table`, `scroll-area`, `select`, `tabs`, `command`, `popover`, `button`).

### 6.2 Adaptações obrigatórias no port

1. **Cliente Supabase.** Todo `import { supabase } from '@/integrations/supabase/client'` vira `import { supabaseIndicadores } from '@/integrations/supabase/indicadores'`. Errar isso aponta a query para o banco do Hub, onde as tabelas não existem.
2. **Layout.** `<DashboardLayout>` vira `<MainLayout>` do Hub. O menu lateral do Painel é descartado — o menu do Hub o substitui.
3. **Auth.** `useUserProfile` e `useIsAdmin` (de `@/hooks/useAuth` do Painel) leem `profiles` e `user_roles`, que voltam vazias no acesso anônimo. Trocar pelo `useAuth` do Hub (`@/contexts/AuthContext`). Como só admin/sede acessa, o que essas telas condicionavam a `isAdmin` fica sempre ligado.
4. **Query keys.** Prefixar com `indicadores_` para não colidir com o cache do React Query do Hub.
5. **Estilos.** As telas de origem usam tokens e classes próprias do Painel. Onde não existirem no Hub, ajustar para os equivalentes do Hub durante a validação visual.

### 6.3 Rotas — `src/App.tsx`

```
/dashboard/visao-geral        → VisaoGeral
/dashboard/top-10-unidades    → Top10Unidades
/dashboard/visao-diaria       → VisaoDiaria
/dashboard/cronologia         → Cronologia
```

Todas via `lazy()` (padrão do arquivo) e envolvidas em **`<ProtectedRoute requireColaborador>`**.

O guard já existe e faz exatamente o necessário: `ProtectedRoute` aceita `requireColaborador` e redireciona para `/` quem não passa ([ProtectedRoute.tsx:25-27](../../../src/components/auth/ProtectedRoute.tsx#L25-L27)). E `isColaborador` já engloba admin — `userType === 'colaborador' || isAdmin` ([AuthContext.tsx:48](../../../src/contexts/AuthContext.tsx#L48)) — então a flag sozinha cobre admin + colaboradores da sede e exclui franqueados. Nenhum guard novo é necessário.

### 6.4 Sidebar — `src/components/layout/Sidebar.tsx`

Seção nova entre "Minha Área" e "Administração":

```
⬛ Dashboard              ▾
   📊 Visão Geral
   🏆 Top 10 Unidades
   📅 Visão Diária
   📈 Cronologia
```

- Ícones iguais aos do projeto de origem: `LayoutDashboard`, `Trophy`, `Calendar`, `LineChart`. Ícone da seção: `BarChart3`.
- Visível para `isColaborador || isAdmin`, escrito assim por consistência com as outras seções do arquivo (o `|| isAdmin` é redundante, já que `isColaborador` engloba admin).
- `SectionKey` ganha `'dashboard'`; `sectionFromPath` passa a mapear `/dashboard/*` para essa seção.
- **Atenção na ordem do `sectionFromPath`:** o Hub já tem `/minha-area/dashboard`. O teste de `/dashboard` precisa ser por prefixo exato de rota, senão as duas seções disputam qual abre.

**Duplicidade de nome aceita:** o menu passa a ter uma seção "Dashboard" (indicadores) e, dentro de "Minha Área", um item "Dashboard" (Mídia Adicional). O risco de confusão foi apresentado e o usuário optou por manter.

## 7. Casos de borda

| Situação | Comportamento |
|---|---|
| Franqueado tenta abrir `/dashboard/*` pela URL | Bloqueado pelo guard de rota, como qualquer rota restrita do Hub. |
| Banco de indicadores fora do ar | Estado de erro na tela; o resto do Hub não é afetado (cliente isolado). |
| `.env.local` ausente | O cliente é criado com `undefined` e as queries falham. Adicionar checagem explícita com mensagem clara em vez de deixar quebrar silenciosamente. |
| Período sem dados | Estado vazio das telas de origem, preservado no port. |
| Sessão do Hub expira | Comportamento normal do Hub; o cliente de indicadores não interfere (não persiste sessão). |

## 8. Testes e validação

Não há teste automatizado a portar — o projeto de origem não tem testes.

1. `npm run lint` — sem erros novos.
2. `npm run build` — compila.
3. `npm run test:run` — a suíte existente do Hub segue passando (garante que o cliente novo não quebrou nada).
4. **Validação visual no `npm run dev`**, obrigatória pelo `CLAUDE.md`, tela a tela:
   - as 4 telas renderizam com dados reais;
   - os filtros (período, unidade, granularidade) funcionam;
   - o menu abre a seção certa em cada rota;
   - **o login do Hub sobrevive a navegar pelas 4 telas e recarregar a página** — é o teste que prova que o `persistSession: false` funcionou;
   - franqueado não vê a seção.

## 9. Riscos

| Risco | Mitigação |
|---|---|
| Os dois clientes Supabase brigarem pelo `localStorage` e derrubarem o login | `persistSession: false` + `storageKey` próprio. Verificado no item 4 da validação visual. |
| Estilos do Painel não existirem no Hub e as telas saírem tortas | Validação visual tela a tela antes de considerar pronto. É o risco mais provável de custar tempo. |
| Esquecer de trocar o cliente em algum hook | Revisão dirigida: `grep` por `integrations/supabase/client` dentro de `features/colaborador/indicadores/` deve voltar vazio. |
| Colisão de `sectionFromPath` entre `/dashboard` e `/minha-area/dashboard` | Teste de prefixo explícito; validado navegando pelas duas. |
| A RLS do projeto de indicadores mudar e cortar o acesso anônimo | Fora do controle deste spec. As telas passariam a vir vazias. Se acontecer, o caminho é o mesmo da fase 2 (Edge Function com service-role). |

## 10. Fase 2 (registrada, não planejada)

Trazer a Administração exige:

1. Edge Functions no Supabase do Hub guardando a chave de serviço do projeto de indicadores.
2. Cada função valida que quem chama é admin **do Hub**, e só então consulta o outro projeto com service-role.
3. Reescrever a camada de dados das 8 abas admin para chamar essas funções em vez do `supabase-js` direto.

São ~110 KB de código e exige deploy real de Edge Functions — não é implementável apenas localmente. Só faz sentido quando a intenção for aposentar o site do Cloudflare.

## 11. Restrição operacional

Enquanto durar a instrução do usuário:

- **sem `./deploy.sh`** — nada vai para `hub.purepilates.com.br`;
- **sem `git push`** — nada vai para o GitHub;
- commits locais são permitidos, e são o mecanismo de desfazer (`git checkout`);
- validação sempre em `npm run dev`.

Nada neste spec altera banco de dados. Todo o trabalho é reversível apagando a pasta `src/features/colaborador/indicadores/`, o arquivo `src/integrations/supabase/indicadores.ts`, o `.env.local`, e revertendo `App.tsx` e `Sidebar.tsx`.
