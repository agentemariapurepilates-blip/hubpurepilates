// Matérias da Edição 2 e a página onde cada uma começa.
// Textos do Canva "Pautas Entre-molas ed2" e do doc do artigo; o Canva é referência
// de texto e a diagramação segue a Edição 1. A capa e o sumário usam esta lista —
// mudou a ordem das páginas, muda aqui.

export const MATERIAS = {
  artigo: { pagina: 3, titulo: 'Evoluir faz parte do movimento', secao: 'Artigo' },
  unidades: { pagina: 12, titulo: 'Atingimos a marca de +500 unidades', secao: 'Unidades' },
  reputacao: { pagina: 13, titulo: 'Reputação', secao: 'Reputação' },
  blackFriday: { pagina: 17, titulo: 'A nova porta de entrada', secao: 'Marketing' },
  play: { pagina: 24, titulo: 'Excelência na palma da mão', secao: 'Pilates Play' },
  norte: { pagina: 28, titulo: 'Leve a Pure para novos horizontes.', secao: 'Expansão' },
  suporte: { pagina: 30, titulo: 'Tem gente nova chegando para somar ao nosso time!', secao: 'Equipe Suporte' },
  eletromidia: { pagina: 31, titulo: 'Sua eletromídia está ligada? 📺', secao: 'Eletromídia' },
  move: { pagina: 32, titulo: 'Coleção Move', secao: 'Pure Store' },
  faculdades: { pagina: 35, titulo: 'Pure Pilates nas faculdades', secao: 'Pure Academy' },
} as const;

export const ORDEM_DO_SUMARIO = [
  MATERIAS.artigo,
  MATERIAS.reputacao,
  MATERIAS.blackFriday,
  MATERIAS.play,
  MATERIAS.norte,
  MATERIAS.suporte,
  MATERIAS.eletromidia,
  MATERIAS.move,
  MATERIAS.faculdades,
];

export const SUBTITULO_ARTIGO = 'Mudar não é desfazer. Mudar é evoluir.';
export const AUTORA_ARTIGO = 'Por Caroline Lo Duca Serroni';
export const NOME_AUTORA = 'Caroline Lo Duca Serroni';
export const CARGO_ARTIGO = 'Sócia e Diretora de Implantação e Novos Negócios';

// Barra de capítulos acima da revista (navegação do Hub, não texto da revista).
export const CAPITULOS = [
  { rotulo: 'Capa', pagina: 0 },
  { rotulo: 'Sumário', pagina: 2 },
  ...ORDEM_DO_SUMARIO.map((m) => ({ rotulo: m.secao, pagina: m.pagina })),
];
