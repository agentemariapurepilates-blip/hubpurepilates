

# Landing Page Interativa — Timeline Março 2026

## Resumo

Vou criar a landing page de marco 2026 com todo o conteudo do PDF que voce enviou, corrigir o erro de build atual e refatorar a pagina NovidadesDoMes para o novo formato.

---

## O que sera feito

### 1. Criar a landing page de Marco 2026
Arquivo: `src/components/timeline/MonthLanding_2026_03.tsx`

Conteudo completo do PDF transformado em secoes animadas:

- **Hero** -- "Resultados do 1 Bimestre" com gradiente vermelho/preto Pure Pilates
- **Brandformance** -- Cards com metricas animadas (contadores que sobem):
  - Janeiro: 11.547 aulas (120%), 8.061 presencas (120%), 1.619 matriculas (87%)
  - Fevereiro: 7.548 aulas (92%), 5.624 presencas (96%), 1.439 matriculas (100%)
- **Grafico comparativo** Jan vs Fev (barras com Recharts animado)
- **Acumulado** Jan+Fev: 19.095 aulas, 13.685 presencas, 3.058 matriculas
- **Evolucao da Conversao** -- destaque +5,5 p.p. (20,1% para 25,6%)
- **Share de Midia Janeiro** -- grafico pizza (Conversao Google 31,9%, YouTube 34,6%, Consideracao 33,5%)
- **Campanha YouTube** -- cards com +3%, 7,1x pesquisa, +115% lift
- **Buzz Monitor** -- dois graficos pizza (Janeiro e Fevereiro) com positivas/neutras/negativas
- **Vem Ai Marcos** -- 6 cards: 50% OFF, Cupom PURE10, Midia +20%, TikTok, Reclame Aqui, Pure Match
- **Desafio Franchising** -- card escuro com CTA para @purepilates.franchising
- Tudo com animacoes scroll-reveal (fade-up, scale-up)

### 2. Corrigir TimelineLandingPage.tsx
- Trocar referencia de `MonthLanding_2025_03` para `MonthLanding_2026_03`
- Registrar o mes `2026-03`

### 3. Refatorar NovidadesDoMes.tsx
- Remover: botao "Nova Publicacao", filtro por setor, barra de busca
- Manter: filtro por mes (botoes no topo)
- Marco 2026 sempre aparece nos filtros (mesmo sem posts no banco)
- Se o mes tem landing page: mostra a landing page animada
- Se nao tem (meses antigos): mostra o feed de cards como antes
- Historico preservado -- meses com posts antigos continuam acessiveis

### 4. Componentes ja criados (sem alteracao)
- `AnimatedSection.tsx` -- ja existe e funciona
- `AnimatedCounter.tsx` -- ja existe e funciona

---

## Arquivos que serao criados
| Arquivo | Descricao |
|---------|-----------|
| `src/components/timeline/MonthLanding_2026_03.tsx` | Landing page completa de marco com todo o conteudo do PDF |

## Arquivos que serao modificados
| Arquivo | Mudanca |
|---------|---------|
| `src/components/timeline/TimelineLandingPage.tsx` | Corrigir referencia do modulo (2025 para 2026) |
| `src/pages/NovidadesDoMes.tsx` | Remover busca/setor/criar, integrar landing pages, manter historico |

