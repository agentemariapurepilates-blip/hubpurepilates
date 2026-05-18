// Blocos pré-escritos que compõem o prompt final.
// Cada categoria tem opções, cada opção tem um "texto" que é o trecho
// de prompt em português que vai pro Gemini.

// Estilo fixo Pure — sempre sai como primeira linha do prompt
export const ESTILO_PURE_TEXTO =
  'Fotografia publicitária minimalista em estúdio, com composição gráfica e estética limpa.';

export type Enquadramento = 'closeup' | 'detalhe' | 'plano-americano' | 'corpo-inteiro';
export type AnguloCamera = 'baixo' | 'nivel' | 'cima' | 'lateral';
export type IluminacaoPreset = 'padrao-pure';
export type FundoPreset = 'ciclorama-padrao-pure' | 'custom';
export type MarcaExtra = 'cores-pure' | 'p-luminoso';

type Block<K extends string> = Record<K, { label: string; texto: string }>;

export const ENQUADRAMENTO_BLOCKS: Block<Enquadramento> = {
  closeup: {
    label: 'Closeup',
    texto: 'Enquadramento fechado, focando rosto e parte superior do corpo do (a) modelo.',
  },
  detalhe: {
    label: 'Detalhe de rosto',
    texto:
      'Enquadramento extremamente fechado, focado no rosto, extremamente realista, sendo possível ver imperfeições de rosto, detalhes de linhas de expressão e outros.',
  },
  'plano-americano': {
    label: 'Plano americano',
    texto: 'Plano americano, enquadrando da cintura para cima.',
  },
  'corpo-inteiro': {
    label: 'Corpo inteiro',
    texto: 'Corpo inteiro enquadrado, postura visível por completo.',
  },
};

export const ANGULO_BLOCKS: Block<AnguloCamera> = {
  baixo: {
    label: 'Baixo p/ cima',
    texto: 'Câmera posicionada baixa, ângulo de baixo para cima.',
  },
  nivel: {
    label: 'Nível do olhar',
    texto: 'Câmera no nível do olhar, ângulo neutro.',
  },
  cima: {
    label: 'Cima p/ baixo',
    texto: 'Câmera posicionada alta, ângulo de cima para baixo.',
  },
  lateral: {
    label: 'Lateral',
    texto: 'Câmera posicionada lateralmente à modelo, perspectiva de perfil.',
  },
};

export const ILUMINACAO_BLOCKS: Record<
  IluminacaoPreset,
  { label: string; emoji: string; texto: string }
> = {
  'padrao-pure': {
    label: 'Iluminação padrão Pure',
    emoji: '☀',
    texto:
      'Iluminação lateral quente, ambiente solar. A luz vem lateralmente, como sol entrando pela lateral da modelo. Tons quentes e dourados, evitando tons brancos frios. Atmosfera natural e acolhedora.',
  },
};

export const FUNDO_BLOCKS: Block<Exclude<FundoPreset, 'custom'>> = {
  'ciclorama-padrao-pure': {
    label: 'Ciclorama padrão Pure',
    texto:
      'Fundo ciclorama minimalista e neutro. Parede em off-white levemente amareladinha — tom quente e delicado, NÃO branco puro frio. Piso de madeira de tom claro e quente. Sem elementos extras no cenário, apenas o gradiente de luz suave. Caso tenha algum elemento anexado (como aparelhos, detalhes), ele deve ser adicionado como composição do cenário, como se estivesse no local.',
  },
};

// MarcaExtra é o único bloco que pode ter foto de referência opcional.
// Quando tem referencias[], as fotos vão pro Nano Banana como inline_data
// e o prompt automaticamente reforça "use exatamente como mostrado".
export const MARCA_EXTRA_BLOCKS: Record<
  MarcaExtra,
  { label: string; texto: string; referencias?: string[] }
> = {
  'cores-pure': {
    label: 'Cores Pure',
    texto: 'Paleta Pure Pilates: bordô, off-white amareladinho, preto, vermelho #b01e1e.',
  },
  'p-luminoso': {
    label: 'P Luminoso',
    texto:
      'Na composição do layout, temos o luminoso do "p" em um painel ripado, totalmente integrado ao cenário, trazendo iluminação leve para a foto.',
    referencias: ['/images/marca/p-luminoso/01-frontal.jpeg'],
  },
};
