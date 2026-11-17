// Edição especial · Nota fiscal sempre foi regra (novembro de 2026).
// Texto exatamente como na página da edição feita no Claude ("Entre Molas · Edição
// especial · Nota fiscal sempre foi regra"): sem reescrever, resumir nem inventar.
// Abre como as outras edições: revista aberta, página dupla. Toda seção começa numa
// página ímpar (à esquerda); seção com número ímpar de páginas ganha uma página de
// foto. A capa e o sumário usam esta lista: mudou a ordem das páginas em index.tsx, muda aqui.

export const MATERIAS = {
  editorial: { pagina: 3, n: '01', titulo: 'A conversa que a gente precisa ter', tipo: 'Editorial', secao: 'A Voz · Editorial' },
  calendario: { pagina: 5, n: '02', titulo: 'O calendário da reforma', tipo: 'Linha do tempo', secao: 'Linha do tempo' },
  mito: { pagina: 7, n: '03', titulo: 'Mito ou fato?', tipo: 'Tabela', secao: 'Mito ou fato?' },
  riscos: { pagina: 9, n: '04', titulo: 'Quanto custa ficar fora', tipo: 'Infográfico', secao: 'Os números do risco' },
  pratica: { pagina: 13, n: '05', titulo: 'Na prática: uma nota por aluno, por mês', tipo: 'Passo a passo', secao: 'Como funciona na prática' },
  numeros: { pagina: 15, n: '06', titulo: 'Os três números que precisam bater', tipo: 'Infográfico', secao: 'Os números do ciclo' },
  ganhos: { pagina: 19, n: '07', titulo: 'O que a sua unidade ganha', tipo: 'Tabela', secao: 'O que você ganha' },
  padrao: { pagina: 23, n: '08', titulo: 'O que a COF já pede e o seu checklist', tipo: 'Checklist', secao: 'O padrão da rede' },
} as const;

export const ORDEM_DO_SUMARIO = [
  MATERIAS.editorial,
  MATERIAS.calendario,
  MATERIAS.mito,
  MATERIAS.riscos,
  MATERIAS.pratica,
  MATERIAS.numeros,
  MATERIAS.ganhos,
  MATERIAS.padrao,
];

// Barra de capítulos acima da revista (navegação do Hub, não texto da revista).
export const CAPITULOS = [
  { rotulo: 'Capa', pagina: 0 },
  { rotulo: 'Sumário', pagina: 2 },
  { rotulo: 'Conversa', pagina: MATERIAS.editorial.pagina },
  { rotulo: 'Calendário', pagina: MATERIAS.calendario.pagina },
  { rotulo: 'Mito ou fato', pagina: MATERIAS.mito.pagina },
  { rotulo: 'Riscos', pagina: MATERIAS.riscos.pagina },
  { rotulo: 'Na prática', pagina: MATERIAS.pratica.pagina },
  { rotulo: '3 números', pagina: MATERIAS.numeros.pagina },
  { rotulo: 'Ganhos', pagina: MATERIAS.ganhos.pagina },
  { rotulo: 'Padrão da rede', pagina: MATERIAS.padrao.pagina },
];
