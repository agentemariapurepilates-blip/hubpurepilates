import { describe, it, expect } from 'vitest';
import {
  compararMeses,
  emPercentual,
  clusterDe,
  contarPorCluster,
  descricaoDaFaixa,
  FAIXAS,
  mesesEntre,
  rotuloDoMes,
  trajetoriaDaUnidade,
} from './clusters-matriculados';

// As fronteiras são o que erra em silêncio: trocar >= por > desloca uma unidade
// de cluster e o gráfico continua parecendo certo. Cada limite é testado nos
// três pontos que importam — logo abaixo, exatamente em cima e logo acima.

describe('clusterDe', () => {
  it('Cluster 1 é 80 ou mais', () => {
    expect(clusterDe(80)).toBe(1);
    expect(clusterDe(149)).toBe(1);
    expect(clusterDe(79)).not.toBe(1);
  });

  it('Cluster 2 vai de 60 a 79', () => {
    expect(clusterDe(60)).toBe(2);
    expect(clusterDe(79)).toBe(2);
    expect(clusterDe(59)).not.toBe(2);
    expect(clusterDe(80)).not.toBe(2);
  });

  it('Cluster 3 vai de 40 a 59', () => {
    expect(clusterDe(40)).toBe(3);
    expect(clusterDe(59)).toBe(3);
    expect(clusterDe(39)).not.toBe(3);
    expect(clusterDe(60)).not.toBe(3);
  });

  it('Cluster 4 vai de 20 a 39', () => {
    expect(clusterDe(20)).toBe(4);
    expect(clusterDe(39)).toBe(4);
    expect(clusterDe(19)).not.toBe(4);
    expect(clusterDe(40)).not.toBe(4);
  });

  it('Cluster 5 é 19 ou menos', () => {
    expect(clusterDe(19)).toBe(5);
    expect(clusterDe(1)).toBe(5);
    expect(clusterDe(0)).toBe(5);
    expect(clusterDe(20)).not.toBe(5);
  });

  it('valor negativo não escapa da classificação', () => {
    // Não deveria existir, mas se existir precisa cair em algum cluster em vez
    // de sumir da contagem.
    expect(clusterDe(-5)).toBe(5);
  });

  it('as faixas declaradas batem com a função', () => {
    // Protege contra alguém editar FAIXAS (a legenda) sem editar clusterDe (a
    // conta) — a tela passaria a mentir sobre os próprios números.
    for (const faixa of FAIXAS) {
      expect(clusterDe(faixa.minimo)).toBe(faixa.numero);
      if (faixa.maximo !== null) expect(clusterDe(faixa.maximo)).toBe(faixa.numero);
    }
  });
});

describe('descricaoDaFaixa', () => {
  it('descreve com e sem teto', () => {
    expect(descricaoDaFaixa(FAIXAS[0])).toBe('80 ou mais');
    expect(descricaoDaFaixa(FAIXAS[1])).toBe('60 a 79');
    expect(descricaoDaFaixa(FAIXAS[4])).toBe('0 a 19');
  });
});

describe('contarPorCluster', () => {
  it('conta cada unidade em exatamente um cluster', () => {
    const p = contarPorCluster('2026-07', [
      { unitId: 1, valor: 149 },
      { unitId: 2, valor: 80 },
      { unitId: 3, valor: 65 },
      { unitId: 4, valor: 45 },
      { unitId: 5, valor: 25 },
      { unitId: 6, valor: 3 },
    ]);

    expect(p.cluster1).toBe(2);
    expect(p.cluster2).toBe(1);
    expect(p.cluster3).toBe(1);
    expect(p.cluster4).toBe(1);
    expect(p.cluster5).toBe(1);
    // A soma dos clusters tem que fechar com o total: se não fechar, alguma
    // unidade foi contada duas vezes ou nenhuma.
    expect(p.cluster1 + p.cluster2 + p.cluster3 + p.cluster4 + p.cluster5).toBe(p.total);
    expect(p.total).toBe(6);
  });

  it('conta separadamente as unidades zeradas', () => {
    const p = contarPorCluster('2026-07', [
      { unitId: 1, valor: 0 },
      { unitId: 2, valor: 0 },
      { unitId: 3, valor: 10 },
    ]);
    // Pela regra as três estão no Cluster 5...
    expect(p.cluster5).toBe(3);
    // ...mas duas são zero, e a tela precisa poder avisar sobre isso.
    expect(p.zerados).toBe(2);
  });

  it('lista vazia não quebra', () => {
    const p = contarPorCluster('2026-07', []);
    expect(p.total).toBe(0);
    expect(p.cluster1).toBe(0);
    expect(p.rotulo).toBe('jul/26');
  });
});

describe('rotuloDoMes', () => {
  it('abrevia mês e ano', () => {
    expect(rotuloDoMes('2026-01')).toBe('jan/26');
    expect(rotuloDoMes('2026-08')).toBe('ago/26');
    expect(rotuloDoMes('2026-12')).toBe('dez/26');
  });
});

describe('mesesEntre', () => {
  it('inclui as duas pontas', () => {
    expect(mesesEntre('2026-06', '2026-08')).toEqual(['2026-06', '2026-07', '2026-08']);
  });

  it('atravessa a virada de ano', () => {
    expect(mesesEntre('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
  });

  it('mesmo mês devolve um só', () => {
    expect(mesesEntre('2026-08', '2026-08')).toEqual(['2026-08']);
  });

  it('intervalo invertido devolve vazio em vez de travar', () => {
    expect(mesesEntre('2026-08', '2026-06')).toEqual([]);
  });
});

describe('emPercentual', () => {
  it('converte as contagens em participação do total', () => {
    const p = contarPorCluster('2026-07', [
      { unitId: 1, valor: 100 },
      { unitId: 2, valor: 100 },
      { unitId: 3, valor: 50 },
      { unitId: 4, valor: 5 },
    ]);
    const pct = emPercentual(p);
    expect(pct.cluster1).toBe(50);
    expect(pct.cluster3).toBe(25);
    expect(pct.cluster5).toBe(25);
    // O total NÃO vira percentual: continua sendo o número de unidades, senão
    // o rodapé do gráfico passaria a dizer "100 unidades" em todo mês.
    expect(pct.total).toBe(4);
  });

  it('mês sem unidade nenhuma não vira divisão por zero', () => {
    const vazio = contarPorCluster('2026-07', []);
    expect(emPercentual(vazio).cluster1).toBe(0);
  });

  it('as participações somam 100', () => {
    const p = contarPorCluster('2026-07', [
      { unitId: 1, valor: 90 }, { unitId: 2, valor: 70 }, { unitId: 3, valor: 50 },
      { unitId: 4, valor: 30 }, { unitId: 5, valor: 10 },
    ]);
    const pct = emPercentual(p);
    const soma = pct.cluster1 + pct.cluster2 + pct.cluster3 + pct.cluster4 + pct.cluster5;
    expect(soma).toBeCloseTo(100, 0);
  });
});

describe('compararMeses', () => {
  const marco = contarPorCluster('2026-03', [
    { unitId: 1, valor: 90 }, { unitId: 2, valor: 85 },
    { unitId: 3, valor: 30 }, { unitId: 4, valor: 10 },
  ]);
  const agosto = contarPorCluster('2026-08', [
    { unitId: 1, valor: 95 }, { unitId: 2, valor: 88 }, { unitId: 5, valor: 82 },
    { unitId: 3, valor: 35 }, { unitId: 4, valor: 12 }, { unitId: 6, valor: 8 },
    { unitId: 7, valor: 5 }, { unitId: 8, valor: 3 },
  ]);

  it('mostra a diferença absoluta de cada cluster', () => {
    const linhas = compararMeses(marco, agosto);
    const c1 = linhas.find((l) => l.numero === 1)!;
    expect(c1.a).toBe(2);
    expect(c1.b).toBe(3);
    expect(c1.diferenca).toBe(1);
  });

  it('um cluster pode GANHAR unidades e PERDER participação', () => {
    // É o caso que a barra absoluta esconde e o motivo de existir o percentual:
    // o Cluster 1 foi de 2 para 3 unidades, mas de 50% para 37,5% da rede.
    const c1 = compararMeses(marco, agosto).find((l) => l.numero === 1)!;
    expect(c1.diferenca).toBeGreaterThan(0);
    expect(c1.pctB).toBeLessThan(c1.pctA);
  });

  it('devolve uma linha por cluster, sempre', () => {
    const linhas = compararMeses(marco, agosto);
    expect(linhas).toHaveLength(5);
    expect(linhas.map((l) => l.numero)).toEqual([1, 2, 3, 4, 5]);
  });

  it('cluster ausente nos dois meses aparece zerado, e não some', () => {
    const c2 = compararMeses(marco, agosto).find((l) => l.numero === 2)!;
    expect(c2.a).toBe(0);
    expect(c2.b).toBe(0);
    expect(c2.diferenca).toBe(0);
  });

  it('comparar um mês com ele mesmo dá diferença zero em tudo', () => {
    for (const l of compararMeses(agosto, agosto)) {
      expect(l.diferenca).toBe(0);
      expect(l.pctA).toBe(l.pctB);
    }
  });
});

describe('trajetoriaDaUnidade', () => {
  it('marca o cluster de cada mês', () => {
    const t = trajetoriaDaUnidade(
      ['2026-06', '2026-07', '2026-08'],
      new Map([['2026-06', 58], ['2026-07', 61], ['2026-08', 82]]),
    );
    expect(t.map((p) => p.cluster)).toEqual([3, 2, 1]);
    expect(t.map((p) => p.valor)).toEqual([58, 61, 82]);
  });

  it('mês sem dado vira lacuna, e não zero', () => {
    // Zero desenharia uma queda que não aconteceu.
    const t = trajetoriaDaUnidade(['2026-06', '2026-07'], new Map([['2026-06', 70]]));
    expect(t[1].valor).toBeNull();
    expect(t[1].cluster).toBeNull();
  });

  it('zero de verdade continua sendo zero', () => {
    const t = trajetoriaDaUnidade(['2026-06'], new Map([['2026-06', 0]]));
    expect(t[0].valor).toBe(0);
    expect(t[0].cluster).toBe(5);
  });
});
