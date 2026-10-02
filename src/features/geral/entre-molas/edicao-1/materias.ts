// Matérias da Edição 1 e a página onde cada uma começa.
// Títulos exatamente como no Canva "Entre molas Edição 1".
// A capa e o sumário usam esta lista — mudou a ordem das páginas, muda aqui.

export const MATERIAS = {
  abertura: { pagina: 3, titulo: 'Você sabe o que acontece entre molas?', secao: 'Abertura' },
  carta: {
    pagina: 5,
    titulo: '17 anos, 500 unidades e uma pergunta que não mudou',
    /** Editoria: aparece na capa, no sumário e na abertura da matéria. */
    secao: 'Carta do CEO',
  },
  pilar: { pagina: 13, titulo: 'Toda marca tem segredos. A Pilar vai revelar os nossos...', secao: 'Os Segredos de Pilar' },
  pureStore: { pagina: 37, titulo: 'Pure Store: o próximo passo do seu estúdio', secao: 'Pure Store' },
  segundaMaior: { pagina: 30, titulo: '“Somos a segunda maior do mundo”', secao: 'Expansão' },
  reconhecimento: { pagina: 36, titulo: 'Mais um reconhecimento para a Pure Pilates.', secao: 'Reconhecimento' },
  arquitetura: { pagina: 21, titulo: 'Por trás de cada mola, um espaço e um instrutor que fazem a diferença', secao: 'Arquitetura' },
  formacao: { pagina: 28, titulo: 'O instrutor que sua unidade procura pode estar se formando aí do lado', secao: 'Pure Academy' },
  contrato: { pagina: 26, titulo: 'Contrato novo, relação mais clara', secao: 'RH' },
  layout: { pagina: 24, titulo: 'Readequação de Layout dos Studios', secao: 'Leitura obrigatória' },
  suporte: {
    pagina: 15,
    titulo: 'Conheça a estrutura do Departamento de Suporte ao Franqueado',
    secao: 'Suporte ao Franqueado',
  },
  jornada: { pagina: 17, titulo: 'A Jornada do Franqueado', secao: 'Suporte ao Franqueado' },
} as const;

export const ORDEM_DO_SUMARIO = [
  MATERIAS.abertura,
  MATERIAS.carta,
  MATERIAS.pilar,
  MATERIAS.suporte,
  MATERIAS.jornada,
  MATERIAS.arquitetura,
  MATERIAS.layout,
  MATERIAS.contrato,
  MATERIAS.formacao,
  MATERIAS.segundaMaior,
  MATERIAS.reconhecimento,
  MATERIAS.pureStore,
];

// Subtítulo e assinatura da matéria de capa (enviados pela equipe, 30/09/2026).
export const SUBTITULO_CARTA =
  'O que construímos até aqui, o que ano presente nos mostrou e o que vem pela frente.';
export const ASSINATURA_CARTA = 'Por Douglas Paiva - CEO e sócio Pure Pilates.';

// Barra de capítulos acima da revista (navegação do Hub, não texto da revista).
export const CAPITULOS = [
  { rotulo: 'Capa', pagina: 0 },
  { rotulo: 'Sumário', pagina: 2 },
  // duas matérias na mesma editoria (Suporte ao Franqueado) viram um só capítulo, na primeira página
  ...ORDEM_DO_SUMARIO.filter((m, i, lista) => lista.findIndex((o) => o.secao === m.secao) === i).map((m) => ({
    rotulo: m.secao,
    pagina: m.pagina,
  })),
];
