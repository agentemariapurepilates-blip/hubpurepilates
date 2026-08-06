import { describe, it, expect } from 'vitest';
import {
  clusterDe,
  FAIXAS,
} from '@/features/colaborador/indicadores/lib/clusters-matriculados';
import {
  clusterDeValor,
  contar,
  esc,
  FAIXAS_EMAIL,
  mesAnterior,
  mesPorExtenso,
  montarEmailDeClusters,
} from '../../../../supabase/functions/cluster-relatorio-mensal/email';

// A regra de cluster existe em DOIS lugares: na tela (src/) e na Edge Function
// (supabase/functions/), que não conseguem importar uma da outra. Este arquivo é
// o que impede a divergência — sem ele, alguém mudaria a faixa na tela e o
// e-mail continuaria mandando os números antigos, com aparência de certo.

describe('a regra do e-mail concorda com a da tela', () => {
  it('as faixas são as mesmas, número a número', () => {
    expect(FAIXAS_EMAIL).toHaveLength(FAIXAS.length);

    for (let i = 0; i < FAIXAS.length; i++) {
      expect(FAIXAS_EMAIL[i].numero).toBe(FAIXAS[i].numero);
      expect(FAIXAS_EMAIL[i].minimo).toBe(FAIXAS[i].minimo);
      expect(FAIXAS_EMAIL[i].maximo).toBe(FAIXAS[i].maximo);
      expect(FAIXAS_EMAIL[i].rotulo).toBe(FAIXAS[i].rotulo);
      // A cor também: um cluster com cor diferente no e-mail e na tela faria a
      // mesma faixa parecer duas coisas.
      expect(FAIXAS_EMAIL[i].cor).toBe(FAIXAS[i].cor);
    }
  });

  it('classificam igual em toda a faixa de valores plausíveis', () => {
    // Varredura, e não amostra: qualquer deslocamento de fronteira aparece.
    for (let v = 0; v <= 200; v++) {
      expect(clusterDeValor(v), `valor ${v}`).toBe(clusterDe(v));
    }
  });

  it('concordam também nos limites exatos', () => {
    for (const limite of [0, 19, 20, 39, 40, 59, 60, 79, 80]) {
      expect(clusterDeValor(limite)).toBe(clusterDe(limite));
    }
  });
});

describe('contar', () => {
  it('distribui as unidades pelas faixas', () => {
    const c = contar([149, 80, 79, 60, 59, 40, 39, 20, 19, 0]);
    expect(c.cluster1).toBe(2);
    expect(c.cluster2).toBe(2);
    expect(c.cluster3).toBe(2);
    expect(c.cluster4).toBe(2);
    expect(c.cluster5).toBe(2);
    expect(c.total).toBe(10);
  });

  it('a soma das faixas fecha com o total', () => {
    const c = contar([100, 50, 5, 5, 5]);
    expect(c.cluster1 + c.cluster2 + c.cluster3 + c.cluster4 + c.cluster5).toBe(c.total);
  });

  it('lista vazia não quebra', () => {
    expect(contar([]).total).toBe(0);
  });
});

describe('mesAnterior', () => {
  it('anda um mês para trás', () => {
    expect(mesAnterior('2026-08')).toBe('2026-07');
  });

  it('atravessa a virada de ano', () => {
    expect(mesAnterior('2026-01')).toBe('2025-12');
  });
});

describe('mesPorExtenso', () => {
  it('escreve em português', () => {
    expect(mesPorExtenso('2026-07')).toBe('julho de 2026');
    expect(mesPorExtenso('2026-03')).toBe('março de 2026');
    expect(mesPorExtenso('2026-12')).toBe('dezembro de 2026');
  });
});

describe('esc', () => {
  it('neutraliza marcação', () => {
    expect(esc('<b>x</b>')).toBe('&lt;b&gt;x&lt;/b&gt;');
  });
});

describe('montarEmailDeClusters', () => {
  const atual = contar([100, 90, 70, 65, 50, 45, 30, 25, 10, 5]);
  const anterior = contar([100, 70, 50, 30, 10]);

  it('o assunto diz o mês que fechou', () => {
    const { assunto } = montarEmailDeClusters('2026-07', atual, anterior);
    expect(assunto).toBe('Clusters de matriculados — julho de 2026');
  });

  it('mostra a contagem de cada cluster', () => {
    const { corpo } = montarEmailDeClusters('2026-07', atual, anterior);
    for (const f of FAIXAS_EMAIL) expect(corpo).toContain(f.rotulo);
    expect(corpo).toContain('10</span>'); // total de unidades
  });

  it('compara com o mês anterior pelo nome certo', () => {
    const { corpo } = montarEmailDeClusters('2026-07', atual, anterior);
    expect(corpo).toContain('junho de 2026');
  });

  it('usa a identidade do Hub', () => {
    const { corpo } = montarEmailDeClusters('2026-07', atual, anterior);
    expect(corpo).toContain('#c5203c');
    expect(corpo).toContain('Montserrat');
    expect(corpo).toContain('Inter');
    // Sem imagem remota: Gmail e Outlook bloqueiam por padrão.
    expect(corpo).not.toMatch(/<img[^>]+src="https?:/);
  });

  it('não pinta a variação de verde ou vermelho', () => {
    // Ganhar unidades no Cluster 5 não é bom e perder no Cluster 1 não é
    // neutro — cor de juízo aqui mentiria.
    const { corpo } = montarEmailDeClusters('2026-07', atual, anterior);
    expect(corpo).not.toMatch(/color:\s*#(0f0|00ff00|22c55e|16a34a)/i);
  });

  it('mês sem mudança nenhuma não mostra seta', () => {
    const { corpo } = montarEmailDeClusters('2026-07', atual, atual);
    expect(corpo).toContain('sem mudança');
  });
});
