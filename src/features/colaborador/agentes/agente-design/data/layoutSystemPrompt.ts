// ============================================================================
// Spec do agente de Criação de Layout · Pure Pilates.
//
// Estrutura em 2 partes:
//
// 1. LAYOUT_DEFAULT_CREATIVE_PROMPT — texto editável que o designer vê
//    pré-preenchido no formulário. Descreve cores, tipografia, ambiente,
//    mood e hierarquia de texto. Designer pode ajustar livremente.
//
// 2. LAYOUT_MANDATORY_RULES — regras fixas aplicadas automaticamente no
//    payload, não editáveis. São as proteções de marca (não cortar a modelo,
//    não sobrepor texto no corpo, legibilidade, etc).
//
// O `texto_arte` da Planilha Editorial vem em paralelo (campo separado) —
// é o conteúdo textual que será aplicado na arte, não faz parte do prompt
// de direção criativa.
// ============================================================================

export type LayoutFormat = 'feed-quadrado' | 'story-reels' | 'carrossel-feed';

export const LAYOUT_FORMATS: Array<{
  value: LayoutFormat;
  label: string;
  dimensions: string;
  hint: string;
}> = [
  { value: 'feed-quadrado', label: 'Feed quadrado', dimensions: '1080x1350', hint: 'Post estático no feed' },
  { value: 'story-reels', label: 'Story / Reels', dimensions: '1080x1920', hint: 'Vertical 9:16' },
  { value: 'carrossel-feed', label: 'Carrossel feed', dimensions: '1080x1350', hint: 'Múltiplos slides' },
];

export const LAYOUT_PALETTE = {
  primary: '#a62436', // vermelho vinho
  white: '#ffffff',
  neutrals: 'bege, nude, areia e cinza suave',
} as const;

export const LAYOUT_TYPOGRAPHY = {
  heading: 'Montserrat ExtraBold',
  body: 'Montserrat Medium',
  details: 'Montserrat Medium Italic',
} as const;

// ---------------------------------------------------------------------------
// PROMPT PADRÃO · EDITÁVEL
// O designer vê isso no textarea de "Direção criativa" e pode ajustar.
// ---------------------------------------------------------------------------

export const LAYOUT_DEFAULT_CREATIVE_PROMPT = `Fundo bege quente e neutro, iluminação suave de estúdio, tipografia forte em vermelho intenso e composição elegante com bastante respiro visual.

Mood: autocuidado, leveza, bem-estar e autoestima feminina, conectando Pilates, moda e lifestyle contemporâneo. Visual de campanha publicitária de marca premium fitness brasileira.

Paleta:
- Tons de bege, nude, areia e vermelho profundo
- Cores principais das fontes: ${LAYOUT_PALETTE.primary} (vermelho) e ${LAYOUT_PALETTE.white} (branco)

Tipografia:
- ${LAYOUT_TYPOGRAPHY.heading} para títulos
- ${LAYOUT_TYPOGRAPHY.body} para textos
- ${LAYOUT_TYPOGRAPHY.details} para detalhes

Hierarquia de texto:
- Texto curto (1 linha): peso forte em ${LAYOUT_TYPOGRAPHY.heading}, escala grande, cor vermelho intenso ${LAYOUT_PALETTE.primary}, com bastante respiro ao redor
- Texto longo (2+ linhas): organizar em blocos dentro de caixas translúcidas suaves, ${LAYOUT_TYPOGRAPHY.body}, alta legibilidade
- Detalhes e citações: ${LAYOUT_TYPOGRAPHY.details}

Estilo visual:
- Layout minimalista, editorial e moderno
- Elementos gráficos discretos: linhas finas arredondadas e caixas translúcidas suaves
- Sombras leves, degradês sutis, formas orgânicas discretas
- Sensação acolhedora, elegante e inspiradora
- Visual clean sem excesso de elementos`;

// ---------------------------------------------------------------------------
// REGRAS OBRIGATÓRIAS · NÃO EDITÁVEIS
// Aplicadas automaticamente como guardrails de marca.
// ---------------------------------------------------------------------------

export const LAYOUT_MANDATORY_RULES = `Regras obrigatórias:
- Não cortar a modelo de forma agressiva em nenhum formato
- Não colocar textos sobre o rosto, cabelo, roupa ou partes importantes do corpo da modelo
- A modelo deve ficar preferencialmente à esquerda ou centralizada conforme o formato, preservando áreas livres para texto
- Manter alta legibilidade em todas as proporções
- Preservar a fotografia natural quando há foto anexada
- Frases sempre em português
- Aparência de campanha profissional para Instagram, Meta Ads e Pinterest
- Evitar aparência genérica de template
- Em carrossel: manter unidade visual entre os slides, com identidade contínua e transições suaves`;
