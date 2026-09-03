/**
 * Os dois relatórios de cluster que saem por e-mail, e a Edge Function que
 * monta cada um.
 *
 * O nome da função é string solta — nada no TypeScript o liga à pasta que a
 * implementa. relatorios.test.ts confere contra o disco.
 */

export type Relatorio = 'matriculados' | 'experimentais';

export interface DefinicaoDeRelatorio {
  /** Pasta em supabase/functions. */
  funcao: string;
  /** Nome curto, na aba. */
  rotulo: string;
  /** Quando sai e o que mostra. */
  descricao: string;
  /** Como aparece no meio de uma frase. */
  nomeNoTexto: string;
}

export const RELATORIOS: Record<Relatorio, DefinicaoDeRelatorio> = {
  matriculados: {
    funcao: 'cluster-relatorio-mensal',
    rotulo: 'Matriculados',
    descricao:
      'Todo dia 1, às 3h. Quantas unidades ficaram em cada cluster no mês que fechou, comparado com o mês anterior.',
    nomeNoTexto: 'o relatório de clusters de matriculados',
  },
  experimentais: {
    funcao: 'experimentais-relatorio-mensal',
    rotulo: 'Aulas experimentais',
    descricao:
      'No penúltimo dia de cada mês, às 3h. Unidades divididas em Bom (30+), Regular (20 a 29) e Ruim (0 a 19) pela média de aulas experimentais dos 3 últimos meses fechados — o mês corrente fica de fora, para não comparar um mês pela metade com meses inteiros.',
    nomeNoTexto: 'o relatório de aulas experimentais',
  },
};

/**
 * A ordem das abas, e qual delas abre.
 *
 * Aulas experimentais vem primeiro, e não é preferência estética. A seção abria
 * em Matriculados, que divide a rede em Cluster 1 a 5; quem entrava na tela
 * procurando a divisão Bom / Regular / Ruim encontrava a numerada e concluía
 * que o relatório estava errado. Aconteceu três vezes seguidas com o mesmo
 * usuário antes de ficar claro que o problema era a aba, e não o relatório —
 * ele nunca chegou a ver o que procurava, escondido um clique ao lado.
 *
 * A lição, para quem acrescentar um terceiro relatório aqui: o que abre é o que
 * existe, na prática. O resto é opcional.
 */
export const ORDEM_DAS_ABAS: Relatorio[] = ['experimentais', 'matriculados'];

export const RELATORIO_INICIAL: Relatorio = ORDEM_DAS_ABAS[0];
