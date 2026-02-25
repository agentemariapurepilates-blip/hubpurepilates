

# Separar Timeline em Sub-Páginas com Menu Interno

## Resumo

Em vez de uma página longa com tudo comprimido, a timeline de cada mês terá um **menu interno de navegação** (tabs/botões) que separa o conteúdo em páginas independentes. Assim o franqueado navega livremente pelo que mais interessa, e cada seção tem espaço para gráficos maiores e conteúdo completo.

## Estrutura visual

```text
┌─────────────────────────────────────────────────┐
│  Timeline do Mês                                │
│  [março 2026] [fevereiro 2026]  ← meses         │
├─────────────────────────────────────────────────┤
│  Página Inicial │ Brandformance │ Fique por     │
│                 │               │ dentro!       │
│  Projeto        │ TikTok        │ Desafio do    │
│  Reclame Aqui   │               │ Franchising   │
│                 ← menu interno (tabs/botões)    │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Conteúdo da sub-página selecionada]           │
│  Gráficos maiores, mais espaço visual           │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Páginas do menu

| Tab | Conteúdo |
|-----|----------|
| **Página Inicial** | HeroSection + VemAiMarcoSection + encerramento (visão geral) |
| **Brandformance** | BrandformanceSection + ComparativoChart + ConversaoSection + ShareMidiaSection + BuzzMonitorSection (todos os dados e gráficos com mais espaço) |
| **Fique por dentro!** | Seção informativa: cupons, promoções, novidades gerais do mês (50% OFF, PURE10, Mídia +20%, Pure Match) |
| **Projeto Reclame Aqui** | PostEspecialReclameAqui (conteúdo completo, com mais espaço visual) |
| **TikTok** | PostEspecialTikTok (conteúdo completo) |
| **Desafio do Franchising** | DesafioFranchisingSection (expandido com mais espaço) |

## Mudanças técnicas

### 1. Refatorar `MonthLanding_2026_03.tsx`

Substituir a página única por um componente com estado de "tab ativa":
- Usar `useState` para controlar qual sub-página está visível
- Renderizar um menu horizontal de botões/tabs logo abaixo do seletor de meses
- O menu será scrollável no mobile (usando `ScrollArea` horizontal)
- Cada botão alterna o conteúdo exibido abaixo
- Sem mudar de rota -- tudo via state local, mantendo a URL `/novidades`

### 2. Criar componente `FiquePorDentroSection.tsx`

Nova seção que agrupa os cards informativos do "Vem Aí Março" que não têm página dedicada:
- 50% OFF (leads da base)
- Cupom PURE10
- Mídia +20%
- Pure Match

Esses 4 cards ficam nessa aba. Os outros 2 (TikTok e Reclame Aqui) já têm páginas próprias.

### 3. Ajustar seções existentes

- **VemAiMarcoSection**: Remover os cards de TikTok e Reclame Aqui (eles ganham páginas próprias)
- **Gráficos**: Com mais espaço por página, aumentar alturas dos `ResponsiveContainer` (de 280px para 400px+)
- **PostEspecialReclameAqui**: Renomear título de "Post Especial: Reclame Aqui" para "Projeto Reclame Aqui"
- **PostEspecialTikTok**: Renomear título de "Post Especial: TikTok" para "TikTok"

### 4. Nenhuma mudança em `NovidadesDoMes.tsx`

A lógica de meses, visibilidade e publicação permanece igual. O `TimelineLandingPage` continua renderizando `MonthLanding_2026_03`, que internamente agora gerencia suas próprias sub-páginas.

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/timeline/MonthLanding_2026_03.tsx` | Refatorar para sistema de tabs com 6 sub-páginas |
| `src/components/timeline/sections/VemAiMarcoSection.tsx` | Remover cards de TikTok e Reclame Aqui (ficam em páginas próprias) |
| `src/components/timeline/sections/PostEspecialReclameAqui.tsx` | Renomear título para "Projeto Reclame Aqui" |
| `src/components/timeline/sections/PostEspecialTikTok.tsx` | Renomear título para "TikTok" |
| `src/components/timeline/sections/ComparativoChart.tsx` | Aumentar altura do gráfico |
| `src/components/timeline/sections/ShareMidiaSection.tsx` | Aumentar altura do gráfico |
| `src/components/timeline/sections/BuzzMonitorSection.tsx` | Aumentar altura dos gráficos |

## Arquivo criado

| Arquivo | Descrição |
|---------|-----------|
| `src/components/timeline/sections/FiquePorDentroSection.tsx` | Cards informativos: 50% OFF, PURE10, Mídia +20%, Pure Match |

