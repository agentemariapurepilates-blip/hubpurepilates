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
      'No penúltimo dia de cada mês, às 3h. Unidades divididas em Bom (30+), Regular (20 a 29) e Ruim (0 a 19) pela média de aulas experimentais dos 3 últimos meses.',
    nomeNoTexto: 'o relatório de aulas experimentais',
  },
};
