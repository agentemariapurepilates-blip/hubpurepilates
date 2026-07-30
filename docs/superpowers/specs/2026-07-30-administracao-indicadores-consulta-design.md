# Administração do Painel de Indicadores no Hub (modo consulta) — Design Spec

**Data:** 2026-07-30
**Status:** Aguardando revisão do usuário
**Escopo operacional:** implementação **somente local** — sem `./deploy.sh` e sem `git push`
**Depende de:** [2026-07-30-painel-indicadores-no-hub-design.md](2026-07-30-painel-indicadores-no-hub-design.md) (já implementado)

---

## 1. Contexto

O branch `feat/painel-indicadores` já trouxe para o Hub as 4 telas de relatório do Painel de Indicadores (`purepilatesrelatorios`), numa seção "Dashboard" no menu. A tela de **Administração** daquele projeto ficou de fora, registrada como fase 2.

O usuário agora pediu a Administração. A investigação empírica mudou o desenho dessa fase 2 em relação ao que o spec anterior previa.

## 2. O que a investigação mostrou

### 2.1 Nem tudo é alcançável pela chave anônima

Teste de leitura direta na API REST do projeto `bweyyihedqnckbtzbkie`, em 2026-07-30:

| Tabela | Leitura anônima |
|---|---|
| `indicator_mapping`, `calculated_metrics`, `daily_goals`, `dynamic_columns`, `units`, `raw_consolidated_daily` | retorna dados |
| `profiles`, `user_roles`, `integration_logs`, `report_recipients`, `report_settings`, `analysis_summary_order` | retorna vazio (RLS filtra) |

### 2.2 As telas de administração escrevem — e escrevem em produção

Diferença essencial em relação às 4 telas de relatório, que só leem: a Administração altera dados. O banco de indicadores é único, sem cópia de teste, e é o mesmo que o painel do Cloudflare usa. **Uma alteração feita a partir do `localhost` vale para todo mundo, imediatamente.** A restrição "somente local" protege o site do Hub; não protege esse banco.

Agravante medido: um `PATCH` anônimo com filtro que não casa com nenhuma linha retorna HTTP 204 em todas as tabelas testadas — inclusive nas que nem podem ser lidas. Isso significa que o papel `anon` tem permissão de escrita no nível da tabela, mas a RLS ainda filtra as linhas. O efeito prático numa tela de administração seria: **"salvo com sucesso" sem nada ter mudado** — falha silenciosa, o pior modo de falha possível.

### 2.3 Decisão do usuário

Diante disso, o usuário escolheu **trazer apenas para consulta**: ver a configuração dentro do Hub, editar continua sendo no Cloudflare.

## 3. Escopo

### Em escopo

Uma tela `/dashboard/administracao` com **7 abas, todas somente leitura**:

| Aba | Origem | O que mostra |
|---|---|---|
| **Análise** | `AnalysisTab.tsx` | Análise consolidada dos indicadores |
| **Clusters** | `ClusterGeneratorTab.tsx` | Agrupamento de unidades por desempenho |
| **Campos** | inline em `Admin.tsx` (aba `mapping`) | Configuração dos indicadores brutos |
| **Calculadas** | `CalculatedMetricsTab.tsx` | Fórmulas das métricas calculadas |
| **Ordenação** | `IndicatorOrderTab.tsx` | Ordem dos indicadores nas telas |
| **Metas** | `GlobalGoalsTab.tsx` | Metas globais por indicador |
| **Unidades** | inline em `Admin.tsx` (aba `units`) | Lista de unidades cadastradas |

Mais: item "Administração" na seção "Dashboard" do menu, e a remoção das funções de escrita que já vieram de carona no branch anterior (§5.2).

### Fora de escopo

- **Abas `users` (Usuários), `integration` (Integração), `report` (Relatório).** Leem tabelas que a chave anônima não enxerga — viriam vazias. Continuam no Cloudflare.
- **Abas `goals` e `data`.** As duas renderizam o `CSVUploader`, que é ferramenta de upload. Sem escrita, não fazem nada.
- **Qualquer capacidade de edição.** É o ponto central desta decisão.
- **A personalização de ordem do resumo da aba Análise.** Usa `analysis_summary_order`, tabela bloqueada, e é a parte de escrita do `AnalysisTab`.
- Migrations, Edge Functions, mudanças no banco. Continua sendo frontend puro.
- Endurecer a RLS do projeto de indicadores. É trabalho separado, registrado em §8.

## 4. Decisões e justificativas

| Pergunta | Decisão | Justificativa |
|---|---|---|
| Trazer com edição? | Não — só consulta | Escrita ia direto para produção, sem desfazer e sem registro de autoria; parte falharia em silêncio. |
| Quais abas? | 7 das 12 | 3 viriam vazias, 2 viram botões mortos. Trazer o que não funciona só gera confusão. |
| Como garantir o modo consulta? | Não portar o código de escrita | Botão desabilitado é convenção; código ausente é garantia. Ver §5.2. |
| Navegação? | Um item com abas dentro | Mantém o menu enxuto e espelha o painel do Cloudflare, que as pessoas já conhecem. |
| Quem acessa? | `requireColaborador` | Mesma regra das 4 telas de relatório. |

## 5. Arquitetura

### 5.1 Arquivos

Tudo em `src/features/colaborador/indicadores/`.

**Criados:**

| Arquivo | Responsabilidade |
|---|---|
| `Administracao.tsx` | Tela com as 7 abas; espelha a estrutura de `Admin.tsx` da origem |
| `components/admin/AnalysisTab.tsx` | Aba Análise (sem a parte de escrita) |
| `components/admin/ClusterGeneratorTab.tsx` | Aba Clusters |
| `components/admin/CalculatedMetricsTab.tsx` | Aba Calculadas (sem edição) |
| `components/admin/IndicatorOrderTab.tsx` | Aba Ordenação (sem reordenação) |
| `components/admin/GlobalGoalsTab.tsx` | Aba Metas (sem edição) |
| `components/admin/CamposTab.tsx` | Aba Campos — extraída do JSX inline de `Admin.tsx`, sem CRUD |
| `components/admin/UnidadesTab.tsx` | Aba Unidades — extraída do JSX inline, sem o botão de sincronizar |
| `hooks/useAnalysisData.ts` | Dados da aba Análise |
| `hooks/useClusterData.ts` | Dados da aba Clusters |
| `hooks/useGlobalGoals.ts` | Dados da aba Metas |
| `hooks/useIndicatorOrder.ts` | Dados da aba Ordenação |

**Modificados:**

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | 1 import `lazy()` + 1 rota `/dashboard/administracao` |
| `src/components/layout/Sidebar.tsx` | Item "Administração" em `dashboardNavigation` |
| `hooks/useUnits.ts`, `useCalculatedMetrics.ts`, `useIndicatorMapping.ts`, `useRawData.ts`, `useDailyGoals.ts` | Remoção das funções de escrita (§5.2) |

**Reaproveitados sem alteração** (já vieram no branch anterior): `useIndicatorMappings`, `useCalculatedMetrics`, `useAllUnits`, `useRawData`, `useDailyGoals`, `types.ts`, `lib/formulaParser.ts`.

### 5.2 O modo consulta é garantido pela ausência de código de escrita

Não basta esconder botões. A garantia vem de **não existir caminho de escrita no código do Hub**:

1. **Remover as 9 funções de mutação que já vieram de carona** no branch anterior. Elas não têm nenhum consumidor hoje — a revisão final do branch já as havia apontado como código morto:

   | Arquivo | Funções a remover |
   |---|---|
   | `hooks/useUnits.ts` | `useSyncUnits` |
   | `hooks/useCalculatedMetrics.ts` | `useCreateCalculatedMetric`, `useUpdateCalculatedMetric`, `useDeleteCalculatedMetric` |
   | `hooks/useIndicatorMapping.ts` | `useUpdateIndicatorMapping`, `useCreateIndicatorMapping`, `useDeleteIndicatorMapping` |
   | `hooks/useRawData.ts` | `useImportCSV` |
   | `hooks/useDailyGoals.ts` | `useImportGoals` |

2. **Portar os 4 hooks novos sem as funções de mutação**, se houver.

3. **Remover os controles de edição** dos componentes portados: botões de salvar/criar/excluir, diálogos de edição, campos de formulário editáveis, alças de arrastar. O que sobra é tabela e leitura.

4. **Trava automatizada:** um teste que varre `src/features/colaborador/indicadores/` procurando `.insert(`, `.update(`, `.upsert(`, `.delete(` e `functions.invoke(`, e falha se encontrar qualquer um. Isso impede que a capacidade de escrita volte por descuido numa alteração futura — que é exatamente o risco que a decisão do usuário quer evitar.

### 5.3 Aviso na tela

Banner no topo da página, no padrão dos avisos que o Hub já usa, com o texto:

> **Somente consulta** — esta área mostra a configuração do Painel de Indicadores. Para alterar qualquer coisa, use o painel em `pure-pilates-insights.pages.dev`.

Motivo: sem isso, alguém procura o botão de salvar, não acha, e conclui que a tela está quebrada.

### 5.4 Rota e menu

- Rota: `/dashboard/administracao`, via `lazy()`, dentro do mesmo `ErrorBoundary` que já protege as rotas `/dashboard/*`, com `<ProtectedRoute requireColaborador>`.
- Menu: item **"Administração"** ao final de `dashboardNavigation`, depois de "Cronologia". Ícone **`SlidersHorizontal`** — deliberadamente diferente de `Settings`, que a seção "Administração" do próprio Hub já usa ([Sidebar.tsx:533](../../../src/components/layout/Sidebar.tsx#L533)). Repetir o ícone faria dois itens de nome igual e ícone igual apontarem para coisas completamente diferentes.
- `sectionFromPath` não muda: `/dashboard/administracao` já casa com o prefixo `/dashboard/` existente.

## 6. Casos de borda

| Situação | Comportamento |
|---|---|
| Aba sem dados no período | Estado vazio do componente de origem, preservado |
| Banco de indicadores fora do ar | Estado de erro na aba; o `ErrorBoundary` já cobre falha de carregamento do módulo |
| Usuário procura como editar | Banner de §5.3 aponta para o Cloudflare |
| Franqueado tenta a URL direto | Bloqueado por `requireColaborador`, como as outras rotas do Dashboard |
| RLS do projeto de indicadores endurecer no futuro | As abas passam a vir vazias. Sem risco de escrita indevida, porque não há escrita. |

## 7. Testes e validação

1. **Teste da trava de escrita** (§5.2 item 4) — o mais importante deste spec.
2. `npm run lint` — sem erros novos. Remover as 9 funções de mutação deve **reduzir** a contagem de erros `no-explicit-any`.
3. `npm run build` e `npm run test:run` — sem regressão.
4. **Validação visual** das 7 abas com dados reais, comparando com as abas equivalentes no Cloudflare.
5. **Verificação explícita de que não há nenhum controle de edição** em nenhuma das 7 abas.

## 8. Riscos e pendências

| Risco | Tratamento |
|---|---|
| Alguém reintroduzir escrita numa alteração futura | Teste-trava de §5.2 item 4 |
| Componentes portados usarem estilos que não existem no Hub | Mesmo risco do branch anterior, que custou 2 achados. Validação visual aba a aba. |
| Remover os controles de edição quebrar o layout do componente | Cada aba validada visualmente após a remoção |
| Usuário achar a tela inútil sem edição | Decisão consciente dele, com o caminho de edição sinalizado no banner |

**Pendência registrada, fora deste spec:** o papel `anon` do projeto `bweyyihedqnckbtzbkie` tem permissão de escrita no nível de tabela, e a chave anônima é pública desde antes deste trabalho (está no bundle do site do Cloudflare). Endurecer a RLS daquele projeto é trabalho separado e vale não deixar cair no esquecimento. Nada neste spec piora essa exposição — ao contrário, o Hub não ganha nenhum caminho de escrita.

## 9. Restrição operacional

Enquanto durar a instrução do usuário: sem `./deploy.sh`, sem `git push`, validação em `npm run dev`, commits locais como mecanismo de desfazer. Nada aqui altera banco de dados — e, por desenho, nada aqui **pode** alterar.
