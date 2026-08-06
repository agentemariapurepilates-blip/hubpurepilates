// Clusters de matriculados: agrupa as unidades por faixa de alunos
// matriculados e conta quantas caem em cada faixa, mês a mês.
//
// A MÉTRICA É `matriculados_total` (coluna `cli_matriculados_total`), e NÃO
// `matriculas_total`. As duas existem e os nomes são quase iguais:
//
//   matriculados_total → quantos alunos a unidade TEM (estoque). Varia ~4% no
//                        mês; em julho/2026 ia de 1 a 149 entre as unidades.
//   matriculas_total   → quantas matrículas ACONTECERAM no dia (fluxo). No
//                        mesmo mês o máximo foi 17, e TODAS as 475 unidades
//                        cairiam no Cluster 5.
//
// Trocar uma pela outra produz um gráfico plausível e completamente errado.
//
// Por ser estoque, o valor do mês é o do ÚLTIMO dia com dado, e não a soma dos
// dias — somar contaria o mesmo aluno 31 vezes.

export interface FaixaDeCluster {
  /** 1 a 5, como o usuário nomeia. */
  numero: 1 | 2 | 3 | 4 | 5;
  rotulo: string;
  /** Limite inferior, inclusivo. */
  minimo: number;
  /** Limite superior, inclusivo. `null` = sem teto. */
  maximo: number | null;
  /** Cor da série no gráfico. */
  cor: string;
}

/**
 * As cinco faixas, do maior para o menor.
 *
 * A escala de cor vai do vermelho da marca (Cluster 1, as maiores) até o cinza
 * (Cluster 5), passando por tons intermediários — a ordem visual acompanha a
 * ordem dos números, então a legenda quase não precisa ser lida.
 */
export const FAIXAS: FaixaDeCluster[] = [
  { numero: 1, rotulo: 'Cluster 1', minimo: 80, maximo: null, cor: '#c5203c' },
  { numero: 2, rotulo: 'Cluster 2', minimo: 60, maximo: 79, cor: '#d9536a' },
  { numero: 3, rotulo: 'Cluster 3', minimo: 40, maximo: 59, cor: '#e88797' },
  { numero: 4, rotulo: 'Cluster 4', minimo: 20, maximo: 39, cor: '#b9bec4' },
  { numero: 5, rotulo: 'Cluster 5', minimo: 0, maximo: 19, cor: '#7d838a' },
];

/** Texto da faixa, para legenda e tabela: "80 ou mais", "60 a 79". */
export function descricaoDaFaixa(faixa: FaixaDeCluster): string {
  return faixa.maximo === null ? `${faixa.minimo} ou mais` : `${faixa.minimo} a ${faixa.maximo}`;
}

/**
 * Em que cluster cai um valor.
 *
 * Valor negativo não deveria existir, mas se aparecer cai no Cluster 5 em vez
 * de virar `undefined` e sumir da contagem sem ninguém notar.
 */
export function clusterDe(valor: number): 1 | 2 | 3 | 4 | 5 {
  if (valor >= 80) return 1;
  if (valor >= 60) return 2;
  if (valor >= 40) return 3;
  if (valor >= 20) return 4;
  return 5;
}

export interface ValorDeUnidade {
  unitId: number;
  valor: number;
}

export interface PontoDoMes {
  /** 'YYYY-MM' */
  mes: string;
  /** Rótulo pronto para o eixo X: 'ago/26'. */
  rotulo: string;
  /** Quantas unidades em cada cluster. As chaves são 'cluster1'...'cluster5'. */
  cluster1: number;
  cluster2: number;
  cluster3: number;
  cluster4: number;
  cluster5: number;
  /** Total de unidades consideradas no mês. */
  total: number;
  /**
   * Quantas das unidades contadas estavam com zero.
   *
   * Pela regra elas pertencem ao Cluster 5, mas zero costuma significar
   * "unidade sem dado" e não "unidade sem alunos". Exposto para a tela poder
   * avisar em vez de embutir a ambiguidade no gráfico em silêncio.
   */
  zerados: number;
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** '2026-08' → 'ago/26'. */
export function rotuloDoMes(mes: string): string {
  const [ano, m] = mes.split('-');
  return `${MESES_CURTOS[Number(m) - 1]}/${ano.slice(2)}`;
}

/** Conta as unidades por cluster num mês. */
export function contarPorCluster(mes: string, valores: ValorDeUnidade[]): PontoDoMes {
  const ponto: PontoDoMes = {
    mes,
    rotulo: rotuloDoMes(mes),
    cluster1: 0, cluster2: 0, cluster3: 0, cluster4: 0, cluster5: 0,
    total: valores.length,
    zerados: 0,
  };

  for (const { valor } of valores) {
    const n = clusterDe(valor);
    ponto[`cluster${n}` as 'cluster1'] += 1;
    if (valor === 0) ponto.zerados += 1;
  }

  return ponto;
}

/** Lista de meses 'YYYY-MM' de `de` até `ate`, inclusive. */
export function mesesEntre(de: string, ate: string): string[] {
  const meses: string[] = [];
  let [ano, mes] = de.split('-').map(Number);
  const [anoFim, mesFim] = ate.split('-').map(Number);

  // Guarda contra intervalo invertido: sem isto o laço não terminaria.
  if (ano * 12 + mes > anoFim * 12 + mesFim) return [];

  while (ano * 12 + mes <= anoFim * 12 + mesFim) {
    meses.push(`${ano}-${String(mes).padStart(2, '0')}`);
    mes += 1;
    if (mes > 12) { mes = 1; ano += 1; }
  }

  return meses;
}

/**
 * Trajetória de UMA unidade: em que cluster ela esteve em cada mês.
 *
 * Quando o filtro tem uma unidade só, contar "quantas unidades por cluster"
 * daria sempre 1 e não diria nada. O que interessa ali é para onde ela está
 * indo.
 */
export interface PontoDaUnidade {
  mes: string;
  rotulo: string;
  valor: number | null;
  cluster: 1 | 2 | 3 | 4 | 5 | null;
}

/**
 * O mesmo ponto, com as contagens viradas em percentual do total do mês.
 *
 * Serve para comparar meses em que o número de unidades mudou: entre março e
 * agosto a rede cresceu de 444 para 475 unidades, então um cluster pode ter
 * mais unidades e ainda assim ter perdido participação. A barra empilhada
 * absoluta esconde isso.
 */
export function emPercentual(ponto: PontoDoMes): PontoDoMes {
  if (ponto.total === 0) return ponto;

  const pct = (n: number) => Math.round((n / ponto.total) * 1000) / 10;

  return {
    ...ponto,
    cluster1: pct(ponto.cluster1),
    cluster2: pct(ponto.cluster2),
    cluster3: pct(ponto.cluster3),
    cluster4: pct(ponto.cluster4),
    cluster5: pct(ponto.cluster5),
  };
}

export interface LinhaDeComparacao {
  numero: 1 | 2 | 3 | 4 | 5;
  rotulo: string;
  cor: string;
  /** Unidades no mês A. */
  a: number;
  /** Unidades no mês B. */
  b: number;
  /** b - a. Positivo = o cluster ganhou unidades. */
  diferenca: number;
  /** Participação no total de cada mês, em pontos percentuais. */
  pctA: number;
  pctB: number;
}

/**
 * Compara dois meses cluster a cluster.
 *
 * Devolve a diferença absoluta E a de participação, porque as duas contam
 * histórias diferentes quando o total muda — um cluster pode ganhar unidades e
 * perder participação no mesmo período.
 */
export function compararMeses(a: PontoDoMes, b: PontoDoMes): LinhaDeComparacao[] {
  const pctDe = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);

  return FAIXAS.map((faixa) => {
    const chave = `cluster${faixa.numero}` as 'cluster1';
    const va = a[chave];
    const vb = b[chave];

    return {
      numero: faixa.numero,
      rotulo: faixa.rotulo,
      cor: faixa.cor,
      a: va,
      b: vb,
      diferenca: vb - va,
      pctA: pctDe(va, a.total),
      pctB: pctDe(vb, b.total),
    };
  });
}

export function trajetoriaDaUnidade(
  meses: string[],
  valorPorMes: Map<string, number | undefined>,
): PontoDaUnidade[] {
  return meses.map((mes) => {
    const valor = valorPorMes.get(mes);
    return {
      mes,
      rotulo: rotuloDoMes(mes),
      // `null` desenha lacuna no gráfico; zero desenharia uma queda que não
      // aconteceu.
      valor: valor === undefined ? null : valor,
      cluster: valor === undefined ? null : clusterDe(valor),
    };
  });
}
