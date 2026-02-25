

# Transformacao da Timeline em Landing Pages Interativas

## Resumo

A pagina "Timeline do Mes" sera transformada de um feed de posts para uma experiencia de landing pages animadas por mes. Cada mes tera uma landing page unica, codificada diretamente, com graficos animados, elementos que surgem ao rolar a pagina e a identidade visual da Pure Pilates. Os meses antigos que ja tem conteudo no formato feed continuarao aparecendo normalmente.

---

## O que muda

1. **Remocao do botao "Nova Publicacao"** -- ninguem mais cria posts pela interface
2. **Remocao do filtro por setor** e da barra de busca
3. **Filtro apenas por mes** -- botoes com os meses disponiveis (marco, fevereiro, janeiro, etc.)
4. **Meses novos** (a partir de marco 2025) exibem uma landing page animada e interativa ao inves de cards de posts
5. **Meses antigos** continuam mostrando o conteudo no formato feed/cards atual

---

## Como vai funcionar

- Ao abrir a Timeline, o mes mais recente (marco) ja vem selecionado
- Os botoes de mes ficam em destaque no topo
- Se o mes selecionado tiver uma landing page codificada, ela aparece com animacoes
- Se nao tiver (meses antigos), mostra os posts no formato feed como ja funciona hoje

---

## Estrutura tecnica

### Arquitetura de Landing Pages

Sera criada uma pasta `src/components/timeline/` com:

- **`TimelineLandingPage.tsx`** -- componente wrapper que decide se mostra landing page ou feed antigo
- **`AnimatedSection.tsx`** -- componente reutilizavel que anima elementos ao aparecerem na tela (fade-in, slide-up) usando Intersection Observer
- **`AnimatedCounter.tsx`** -- componente para numeros/graficos que "sobem" animados
- **`MonthLanding_2025_03.tsx`** -- landing page de marco 2025 (template inicial/exemplo)

### Animacoes

- Uso de **Intersection Observer API** para detectar quando elementos entram na tela
- Graficos do **Recharts** (ja instalado) com animacoes nativas
- Transicoes CSS com classes Tailwind + keyframes customizados
- Efeito parallax leve em imagens de destaque
- Contadores numericos animados para metricas/KPIs

### Mudancas no `NovidadesDoMes.tsx`

- Remover: botao CreatePostDialog, filtro de setor, barra de busca
- Manter: filtro por mes (simplificado, incluindo o mes atual mesmo sem posts)
- Adicionar: logica para verificar se um mes tem landing page codificada
- Se sim: renderizar o componente da landing page
- Se nao: renderizar o feed antigo com NewsCards

### Template padrao da landing page

Cada landing page tera secoes como:
- **Hero** com titulo do mes e visual impactante
- **Destaques** com cards animados
- **Metricas/Graficos** com contadores e graficos Recharts animados
- **Conteudo em blocos** que aparecem conforme scroll
- Tudo na paleta Pure Pilates (vermelho #C41E3A, preto, branco)

### Novos estilos em `index.css`

- Classes de animacao para scroll-reveal (fade-up, fade-left, fade-right, scale-up)
- Estilos para secoes de landing page (hero, destaque, metricas)

---

## Arquivos que serao criados

| Arquivo | Descricao |
|---------|-----------|
| `src/components/timeline/AnimatedSection.tsx` | Wrapper que anima children ao entrar na viewport |
| `src/components/timeline/AnimatedCounter.tsx` | Contador numerico animado |
| `src/components/timeline/TimelineLandingPage.tsx` | Registro de quais meses tem landing page e renderizacao |
| `src/components/timeline/MonthLanding_2025_03.tsx` | Landing page de marco 2025 (template exemplo com conteudo placeholder para voce me passar o conteudo real depois) |

## Arquivos que serao modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/NovidadesDoMes.tsx` | Remover busca, setor, botao criar. Adicionar mes atual nos filtros. Integrar componente de landing page |
| `src/index.css` | Adicionar classes de animacao scroll-reveal |

---

## Proximos passos apos aprovacao

1. Implemento a estrutura com o template de marco como exemplo
2. Voce me passa o conteudo real de marco (textos, numeros, graficos, imagens)
3. Eu substituo o placeholder pelo conteudo real
4. Para cada novo mes, voce me passa o conteudo e eu crio a landing page correspondente

