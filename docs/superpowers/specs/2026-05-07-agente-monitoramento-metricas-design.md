# Agente Monitoramento · Métricas — Design Spec

**Data:** 2026-05-07
**Status:** Em revisão (aguarda aprovação do usuário antes de plano de implementação)
**Escopo:** Fase 1 (módulo Métricas, conta nacional)
**Autor:** Brainstorming colaborativo · Renata Ramos Flores + Claude Opus 4.7

---

## 1. Contexto

A Pure Pilates opera 425+ unidades e tem três contas oficiais nacionais nas redes:
- Instagram `@purepilatesbr`
- Facebook `/pure.pilates.br`
- TikTok `@purepilatesbr`

Hoje o time editorial não tem um lugar único para acompanhar o desempenho dessas contas em relação às metas do **Guia Editorial Multicanal 2026**. As métricas estão dispersas em Meta Business Suite e TikTok Analytics, e a comparação contra meta é manual.

Este spec descreve o módulo **Agente Monitoramento → Métricas**, primeiro de dois módulos previstos sob a nova seção "Agente Monitoramento" do hub. O segundo módulo (**Saúde de Marca**, NPS adaptado de comentários) será objeto de spec próprio.

## 2. Objetivo

Consolidar em uma única página do hub:
1. **Status de conexão** das três contas oficiais (OAuth)
2. **Métricas de desempenho** dos últimos N dias (7, 28 ou 90)
3. **Comparativo contra metas** do Guia Editorial 2026 com semáforo visual (🟢🟡🔴)
4. **Histórico de crescimento** de seguidores por canal
5. **Top posts** do período por canal

## 3. Escopo

### Em escopo (Fase 1)

- Apenas a conta **nacional** `@purepilatesbr` (não as 425 unidades)
- **Integração real** via Meta Graph API + TikTok Business API (não mock, não upload manual)
- Tokens armazenados criptografados no Supabase
- Dashboard responsivo (desktop + mobile)
- Acesso restrito a usuários com role `admin`
- Nova seção no Sidebar: "Agente Monitoramento" com item "Métricas" (e placeholder "Saúde de marca · Em breve")

### Fora de escopo (Fase 2 ou outros specs)

- Métricas por unidade da rede (multi-tenant) — Fase 2
- Demografia de audiência (idade/gênero/cidade)
- Hashtag analytics
- Concorrentes / benchmark (vai pra Saúde de Marca)
- Sentimento de comentários (vai pra Saúde de Marca)
- Stories analytics granulares
- Export de relatório em PDF

## 4. Decisões já tomadas (durante brainstorming)

| Decisão | Escolha | Justificativa |
|---|---|---|
| Foco do monitoramento | Métricas de desempenho | Resposta do usuário em brainstorm |
| Fonte de dados | APIs oficiais (Meta + TikTok) | Versão "profissa" sustentável |
| Quantas contas | Só nacional na Fase 1, expansão futura | Reduz complexidade, valida stack |
| Estratégia de entrega | Fatiada B1 → B2 → B3 | Vê resultado cedo, reduz risco |
| Onde guardar tokens | Supabase (`social_connections` cifrada) | Nunca em frontend, RLS protege |
| Comparativo contra meta | Sim, semáforo 🟢🟡🔴 com tolerância ±10% | Conecta dashboard ao plano editorial |

## 5. Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  HUB PURE PILATES (frontend Vite + React)                   │
│                                                             │
│  /agente-monitoramento/metricas                             │
│    ├── ConnectionCard × 3 (IG, FB, TikTok)                  │
│    ├── MetricCard × N (com semáforo vs meta)                │
│    ├── MetricsTrendChart (B3, recharts)                     │
│    └── TopPostsTable × 3 (B3)                               │
│                                                             │
│  /auth/callback/meta                                        │
│  /auth/callback/tiktok                                      │
│    └── chamam Edge Functions de troca de código             │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTPS (autenticado por sessão Supabase)
               ▼
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE                                                   │
│                                                             │
│  Edge Functions:                                            │
│    ├── oauth-exchange-meta       (B1)                       │
│    ├── oauth-exchange-tiktok     (B1)                       │
│    ├── fetch-social-metrics      (B1, expande em B2)        │
│    ├── refresh-tokens            (B2 — cron diário 4h)      │
│    └── sync-social-metrics       (B3 — cron diário 5h)      │
│                                                             │
│  Tabelas:                                                   │
│    ├── social_connections        (B1)                       │
│    └── social_metrics_snapshots  (B3)                       │
│                                                             │
│  Secrets (variáveis de ambiente das Edge Functions):        │
│    META_APP_ID, META_APP_SECRET                             │
│    TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET                  │
│    PG_ENCRYPT_KEY  (chave do pgsodium para cifrar tokens)   │
└─────────────────────────────────────────────────────────────┘
```

**Princípio de segurança:** tokens nunca trafegam até o frontend. Quando o frontend precisa de métricas, chama `fetch-social-metrics` via supabase-js; a Edge Function lê o token cifrado do banco, decifra na memória, chama a API externa e retorna apenas os dados de métrica para o cliente.

## 6. Pré-requisitos externos

Itens que precisam ser providenciados pelo usuário **antes** do desenvolvimento começar:

| # | Plataforma | Tarefa | Onde | Pode levar |
|---|---|---|---|---|
| 1 | Meta | Conta Business Manager verificada (Pure Pilates Brasil) | business.facebook.com | Imediato (se já existe) |
| 2 | Meta | IG `@purepilatesbr` e FB `/pure.pilates.br` anexados ao Business Manager | idem | Imediato |
| 3 | Meta | Criar Meta App | developers.facebook.com | 1 dia |
| 4 | Meta | Solicitar permissões `instagram_basic`, `instagram_manage_insights`, `pages_read_engagement`, `read_insights` | idem | Junto com criação |
| 5 | Meta | Submeter App Review | idem | **1–3 semanas** (Meta) |
| 6 | TikTok | Conta TikTok for Business | business.tiktok.com | Imediato |
| 7 | TikTok | Cadastrar app + solicitar `user.info.basic`, `user.info.stats`, `video.list` | developers.tiktok.com | 1–2 dias |
| 8 | Domínio | Configurar redirect URIs nos apps Meta e TikTok | painel respectivo | 1 dia |
| 9 | Hub | Receber `META_APP_ID`, `META_APP_SECRET`, `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` para colocar nos secrets do Supabase | — | Imediato após criação |

> Durante a App Review da Meta, o app fica em modo **Development** — funcional mas só para usuários listados como dev/tester. Permite testar B1 e B2 com a própria conta sem esperar a aprovação.

## 7. Schema do banco

### `social_connections` (criada em B1)

```sql
CREATE TYPE social_network AS ENUM ('instagram', 'facebook', 'tiktok');
CREATE TYPE connection_status AS ENUM ('active', 'expired', 'revoked');

CREATE TABLE social_connections (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network                  social_network NOT NULL,
  account_handle           text NOT NULL,
  account_id               text NOT NULL,
  access_token_encrypted   text NOT NULL,
  refresh_token_encrypted  text,
  token_expires_at         timestamptz NOT NULL,
  connected_by             uuid REFERENCES auth.users(id),
  connected_at             timestamptz NOT NULL DEFAULT now(),
  last_sync_at             timestamptz,
  status                   connection_status NOT NULL DEFAULT 'active',
  UNIQUE(network)
);

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage social connections" ON social_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

**Constraint UNIQUE(network)** garante que na Fase 1 só existe uma linha por rede (1 IG, 1 FB, 1 TikTok). Em Fase 2 essa constraint é removida e adicionada uma coluna `unit_id`.

### `social_metrics_snapshots` (criada em B3)

```sql
CREATE TABLE social_metrics_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   uuid NOT NULL REFERENCES social_connections(id) ON DELETE CASCADE,
  snapshot_date   date NOT NULL,
  metric_type     text NOT NULL,
  metric_value    numeric NOT NULL,
  raw_payload     jsonb,
  captured_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(connection_id, snapshot_date, metric_type)
);

CREATE INDEX idx_metrics_snapshots_connection_date
  ON social_metrics_snapshots(connection_id, snapshot_date DESC);

ALTER TABLE social_metrics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read snapshots" ON social_metrics_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

**Valores aceitos para `metric_type`** (string livre, validado em código):
- `followers`
- `reach_period` (alcance no período de 28d)
- `engagement_period`
- `engagement_rate`
- `posts_count`
- `saves_carousel` (IG)
- `bio_clicks` (IG)
- `page_likes` (FB)
- `local_unit_clicks` (FB)
- `event_signups` (FB)
- `page_rating` (FB)
- `avg_retention_rate` (TikTok)
- `avg_views_per_video` (TikTok)
- `search_appearances` (TikTok)

## 8. Estrutura de arquivos

```
src/
├── pages/
│   ├── AgenteMonitoramentoMetricas.tsx       (B1, evolui em B2/B3)
│   ├── AuthCallbackMeta.tsx                  (B1)
│   └── AuthCallbackTikTok.tsx                (B1)
├── components/
│   └── monitoring/
│       ├── ConnectionCard.tsx                (B1)
│       ├── MetricCard.tsx                    (B2)
│       ├── MetricsTrendChart.tsx             (B3)
│       └── TopPostsTable.tsx                 (B3)
├── data/
│   └── editorial-kpis.ts                     (B2 — metas do Guia Editorial)
└── App.tsx                                   (+3 rotas)

src/components/layout/Sidebar.tsx              (+nova seção "Agente Monitoramento")

supabase/
├── migrations/
│   ├── YYYYMMDD_social_connections.sql       (B1)
│   └── YYYYMMDD_social_metrics_snapshots.sql (B3)
└── functions/
    ├── oauth-exchange-meta/index.ts          (B1)
    ├── oauth-exchange-tiktok/index.ts        (B1)
    ├── fetch-social-metrics/index.ts         (B1, expande em B2)
    ├── refresh-tokens/index.ts               (B2)
    └── sync-social-metrics/index.ts          (B3)
```

## 9. Rotas

Adicionadas em `src/App.tsx`:

```tsx
<Route
  path="/agente-monitoramento/metricas"
  element={<ProtectedRoute requireAdmin><AgenteMonitoramentoMetricas /></ProtectedRoute>}
/>
<Route path="/auth/callback/meta" element={<AuthCallbackMeta />} />
<Route path="/auth/callback/tiktok" element={<AuthCallbackTikTok />} />
```

## 10. Sidebar

Nova seção adicionada após "Agente Social Media - Studios":

```tsx
const monitoramentoNavigation = [
  { name: 'Métricas', href: '/agente-monitoramento/metricas', icon: BarChart3 },
  { name: 'Saúde de marca', href: '#', icon: Heart, disabled: true },
];
```

Com cabeçalho `Agente Monitoramento` e mesma estrutura de bloco condicional (`{(isColaborador || isAdmin) && ...}`) usada nas outras seções.

## 11. Indicadores

### Header — Resumo nacional (somatório das 3 redes)

| # | Card | Cálculo | Fase |
|---|---|---|---|
| 1 | Seguidores totais | Σ followers das 3 redes + Δ vs período anterior | B1 |
| 2 | Alcance total | Σ reach_period das 3 redes | B2 |
| 3 | Engajamento total | Σ engagement_period das 3 redes | B2 |
| 4 | Posts publicados | Σ posts_count das 3 redes | B2 |

### Bloco Instagram (`@purepilatesbr`)

| # | Indicador | Meta editorial | Fase |
|---|---|---|---|
| 1 | Seguidores (atual + Δ) | +800/mês | B1 |
| 2 | Alcance médio por post | ≥ 5% | B2 |
| 3 | Taxa de engajamento | ≥ 1% | B2 |
| 4 | Salvamentos em carrosséis | ≥ 30% | B2 |
| 5 | Cliques no link da bio | 3× período anterior | B2 |
| 6 | Top 3 posts (alcance e engajamento) | — | B3 |

### Bloco Facebook (`/pure.pilates.br`)

| # | Indicador | Meta editorial | Fase |
|---|---|---|---|
| 1 | Curtidas da página + Δ | — | B1 |
| 2 | Alcance orgânico médio | ≥ 3% | B2 |
| 3 | Cliques em link de unidade local | 200+/mês | B2 |
| 4 | Inscrições em eventos | 50+/mês | B2 |
| 5 | Avaliação média da página | ≥ 4.8 | B2 |
| 6 | Lives com >30min de retenção | 15+/mês | B3 |

### Bloco TikTok (`@purepilatesbr`)

| # | Indicador | Meta editorial | Fase |
|---|---|---|---|
| 1 | Seguidores (atual + Δ) | +2k/mês | B1 |
| 2 | Taxa de retenção média | ≥ 60% | B2 |
| 3 | Views médio por vídeo | 10k+ | B2 |
| 4 | Engajamento (likes+comments+shares/views) | ≥ 4% | B2 |
| 5 | Aparições em busca interna | 10+/mês | B3 |
| 6 | Top 3 vídeos (views e shares) | — | B3 |

### Semáforo de comparação contra meta

Cada `MetricCard` aplica esta lógica:

```ts
function getStatus(value: number, target: number): 'green' | 'yellow' | 'red' {
  const ratio = value / target;
  if (ratio >= 1.0) return 'green';
  if (ratio >= 0.9) return 'yellow';  // ±10% de tolerância
  return 'red';
}
```

**Escala por período:** algumas metas do Guia Editorial são **mensais** (ex: +800 seguidores/mês, 200 cliques/mês, 50 inscrições/mês), e o usuário pode selecionar 7d, 28d ou 90d. A meta efetiva escala linearmente:

```ts
const targetForPeriod = monthlyTarget * (selectedDays / 30);
```

Metas que são **taxas** (5%, 1%, 4%, 60%) não escalam — comparam direto.

A estrutura de `src/data/editorial-kpis.ts` carrega o tipo de cada KPI:

```ts
type EditorialKPI =
  | { kind: 'rate'; target: number }              // ex: 0.05 (5%)
  | { kind: 'monthly_count'; target: number }     // ex: 800 (escala por período)
  | { kind: 'monthly_multiplier'; target: number }; // ex: 3 (3× período anterior)
```

Centralizado num único arquivo — fácil ajustar sem mexer em componentes.

## 12. Wireframes por fase

### B1 — Conexão

Página vazia com mensagem "Conecte suas contas para começar" + 3 cards de conexão lado a lado. Cada card mostra:
- Nome da rede + ícone
- Status: "Não conectado" ou "✓ Conectado"
- Se conectado: número atual de seguidores
- Botão "Conectar" (inicia OAuth) ou "Desconectar"

### B2 — Métricas ao vivo

Adiciona ao topo:
- Seletor de período (`7d` · `28d` · `90d`)
- Botão refresh manual
- Timestamp "Última sincronização: há X minutos"

E abaixo dos cards de conexão:
- 4 cards de resumo nacional
- 3 blocos por canal, cada um com 4–6 cards de métrica com semáforo

### B3 — Histórico + Top Posts

Adiciona ao final:
- Gráfico de linha (recharts) — crescimento de seguidores das 3 redes nos últimos 90 dias
- 3 tabelas "Top 3 posts" — uma por rede, com colunas (#, título, alcance, engajamento, formato), clique abre o post original

### Estados especiais

| Situação | Comportamento |
|---|---|
| Nenhuma rede conectada | Esconde resumo e blocos, mostra só os 3 cards de conexão |
| Token expirado de uma rede | Bloco da rede mostra "⚠ Reconectar conta" em vez dos números |
| Loading inicial | Skeleton dos cards |
| API com erro | Toast vermelho + valor mostrado fica `--` |
| Mobile | Cards viram coluna única; gráfico ganha scroll horizontal |

## 13. Plano de entrega

### B1 — Conexão (~1 dia de código)

**Pré-requisitos externos:** itens 1–9 da Seção 6 (parcialmente, modo Dev OK).

**Tarefas:**
1. Migration `social_connections`
2. Edge Function `oauth-exchange-meta` (troca code por token de longa duração; cifra; salva)
3. Edge Function `oauth-exchange-tiktok` (idem)
4. Edge Function `fetch-social-metrics` versão B1 (retorna apenas `followers` por rede)
5. Page `AgenteMonitoramentoMetricas` versão B1 (3 cards de conexão)
6. Component `ConnectionCard`
7. Pages `AuthCallbackMeta` e `AuthCallbackTikTok`
8. Sidebar: adicionar bloco "Agente Monitoramento"
9. Routes em `App.tsx`

**Checkpoint:** usuário consegue conectar IG, FB, TikTok e ver número de seguidores carregando ao vivo em cada card.

### B2 — Métricas ao vivo (~2 dias)

**Pré-requisitos externos:** B1 estável + metas editoriais validadas com a equipe.

**Tarefas:**
1. Expandir `fetch-social-metrics` para retornar todos os indicadores listados na Seção 11
2. Component `MetricCard` com lógica de semáforo
3. `src/data/editorial-kpis.ts` (constantes)
4. Header com seletor de período + refresh
5. Layout dos 3 blocos por canal
6. Edge Function `refresh-tokens` + cron diário 4h
7. Estados de loading e erro

**Checkpoint:** dashboard completo com números reais; validação com Meta Business Suite e TikTok Analytics.

### B3 — Histórico + Top Posts (~2 dias)

**Pré-requisitos:** B2 rodando há ≥ 7 dias para acumular snapshots.

**Tarefas:**
1. Migration `social_metrics_snapshots`
2. Edge Function `sync-social-metrics` + cron diário 5h
3. Component `MetricsTrendChart` (recharts)
4. Component `TopPostsTable`
5. Endpoint para buscar histórico do banco
6. UX final: timestamp aponta pro cron

**Checkpoint:** feature completa.

## 14. Segurança e privacidade

- **Tokens cifrados** com `pgsodium` (extensão nativa Supabase). Chave em variável de ambiente da Edge Function, nunca no banco.
- **RLS ativa** em ambas as tabelas. Apenas role `admin` lê/escreve.
- **Frontend nunca recebe tokens.** Recebe somente os dados já agregados das métricas.
- **OAuth callback** usa `state` parameter aleatório para prevenir CSRF, validado pela Edge Function antes da troca.
- **Logs** das Edge Functions não imprimem tokens nem `raw_payload` em produção.
- **Tokens revogados** (status='revoked') não são usados para fetch; UI mostra "Reconectar".

## 15. Decisões adiadas

Estas perguntas precisam ser respondidas antes de B2 começar, mas não bloqueiam B1:

1. **Quem pode ver a página além de admin?** Só admin na Fase 1; revisitar pra Fase 2.
2. **Refresh manual tem rate limit?** Sugerido 1 chamada/minuto por usuário (cooldown no botão).
3. **Período padrão do dashboard:** 28 dias.
4. **Fuso horário do "hoje" para corte de período:** America/Sao_Paulo.

## 16. Apêndice: Saúde de Marca (módulo futuro)

A Pure Pilates atualmente usa Buzz Monitor para social listening de marca, com 5 keywords (`pure pilates`, `pilates pure`, `purepilates`, `studio pure`, `rede pure pilates`).

**Direção estratégica firmada (2026-05-07):** o módulo Saúde de Marca a ser construído **vai substituir o Buzz Monitor** — sem qualquer integração ou import de dados da ferramenta atual. As keywords acima orientam o fluxo de captura próprio que o hub vai implementar.

Isso muda o escopo do módulo Saúde de Marca de "classificador NPS sobre dados pré-capturados" para "ferramenta completa de social listening + classificador NPS + relatório executivo + alertas".

**Complexidade alta esperada:** capturar menções por keyword nas redes não é trivial — APIs oficiais Meta/TikTok não permitem busca aberta na timeline pública. Provavelmente exigirá mix de APIs oficiais + serviço terceiro pago de busca + Claude API para classificação.

Documento de referência preservado:

- [2026-05-07-saude-marca-prompt.md](2026-05-07-saude-marca-prompt.md) — prompt completo do classificador NPS, estado atual, direção estratégica e decisões pendentes para o brainstorm futuro do módulo

A nova seção "Agente Monitoramento" do Sidebar já reserva o item "Saúde de marca · Em breve" desde a Fase 1. Brainstorm e spec próprios serão feitos quando a Métricas estiver estabilizada — e o ponto crítico será definir a estratégia de captura.
