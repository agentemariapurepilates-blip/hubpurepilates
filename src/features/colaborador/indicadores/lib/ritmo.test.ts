import { describe, expect, it } from 'vitest';
import {
  curvaDoHistorico,
  diaDaSemana,
  diasDoMes,
  fluxoDiario,
  montarRitmo,
  segundaDaSemana,
  type LeituraDiaria,
} from './ritmo';

describe('fluxoDiario', () => {
  it('devolve o próprio valor no primeiro dia do mês', () => {
    // Não há dia anterior DENTRO do mês, e a coluna zera todo dia 1.
    expect(fluxoDiario([{ data: '2026-07-01', acumulado: 1320 }]).get('2026-07-01')).toBe(1320);
  });

  it('tira a diferença para o dia anterior', () => {
    const serie: LeituraDiaria[] = [
      { data: '2026-07-01', acumulado: 1320 },
      { data: '2026-07-02', acumulado: 1644 },
      { data: '2026-07-03', acumulado: 1917 },
    ];
    const fluxo = fluxoDiario(serie);
    expect(fluxo.get('2026-07-02')).toBe(324);
    expect(fluxo.get('2026-07-03')).toBe(273);
  });

  it('a soma dos fluxos reproduz o acumulado do último dia', () => {
    // É a garantia que impede o erro de somar a coluna acumulada: julho/2026
    // fechou em 8.606, e somar as colunas dia a dia daria mais de 150 mil.
    const serie: LeituraDiaria[] = [
      { data: '2026-07-01', acumulado: 1320 },
      { data: '2026-07-02', acumulado: 1644 },
      { data: '2026-07-03', acumulado: 1917 },
      { data: '2026-07-04', acumulado: 2005 },
    ];
    const total = [...fluxoDiario(serie).values()].reduce((s, v) => s + v, 0);
    expect(total).toBe(2005);
  });

  it('preserva a queda quando a fonte corrige para baixo', () => {
    // 31/07/2026 fechou com −12. Zerar esconderia a correção e o total do mês
    // deixaria de bater com a coluna.
    const fluxo = fluxoDiario([
      { data: '2026-07-30', acumulado: 8618 },
      { data: '2026-07-31', acumulado: 8606 },
    ]);
    expect(fluxo.get('2026-07-31')).toBe(-12);
  });

  it('não depende da ordem em que a série chega', () => {
    const fluxo = fluxoDiario([
      { data: '2026-07-03', acumulado: 1917 },
      { data: '2026-07-01', acumulado: 1320 },
      { data: '2026-07-02', acumulado: 1644 },
    ]);
    expect(fluxo.get('2026-07-02')).toBe(324);
  });
});

describe('diasDoMes', () => {
  it('conta os dias certos de fevereiro', () => {
    expect(diasDoMes('2026-02')).toHaveLength(28);
    expect(diasDoMes('2026-07')).toHaveLength(31);
    expect(diasDoMes('2026-06')).toHaveLength(30);
  });

  it('devolve as datas em yyyy-MM-dd', () => {
    const dias = diasDoMes('2026-07');
    expect(dias[0]).toBe('2026-07-01');
    expect(dias[30]).toBe('2026-07-31');
  });
});

describe('segundaDaSemana', () => {
  it('devolve a própria data quando já é segunda', () => {
    // 2026-07-06 é uma segunda.
    expect(diaDaSemana('2026-07-06')).toBe(1);
    expect(segundaDaSemana('2026-07-06')).toBe('2026-07-06');
  });

  it('trata domingo como fim da semana, e não como começo', () => {
    // 2026-07-12 é domingo. Numa semana que começa na segunda, ele pertence à
    // semana que abriu em 06/07 — não abre uma nova.
    expect(diaDaSemana('2026-07-12')).toBe(0);
    expect(segundaDaSemana('2026-07-12')).toBe('2026-07-06');
  });

  it('atravessa a virada do mês', () => {
    // 2026-08-01 é sábado; a semana dele começou em 27/07.
    expect(segundaDaSemana('2026-08-01')).toBe('2026-07-27');
  });
});

/** Ajuda a montar meses de teste sem escrever 31 linhas. */
function serie(mes: string, valores: Record<number, number>): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const [dia, valor] of Object.entries(valores)) {
    mapa.set(`${mes}-${String(Number(dia)).padStart(2, '0')}`, valor);
  }
  return mapa;
}

function planas(mes: string, valor: number): Map<string, number> {
  return new Map(diasDoMes(mes).map((d) => [d, valor]));
}

describe('montarRitmo', () => {
  it('acumula MTD só até o último dia com leitura', () => {
    const ritmo = montarRitmo({
      mes: '2026-07',
      realizadoPorDia: serie('2026-07', { 1: 100, 2: 50, 3: 50 }),
      metaPorDia: planas('2026-07', 10),
    });

    expect(ritmo.ultimoDiaComDado).toBe('2026-07-03');
    expect(ritmo.mtd.realizado).toBe(200);
    expect(ritmo.mtd.meta).toBe(30);

    // Depois do dia 3 o acumulado não existe. Repetir o último valor
    // desenharia uma reta que parece estagnação, e não falta de dado.
    expect(ritmo.dias[2].realizadoAcumulado).toBe(200);
    expect(ritmo.dias[3].realizadoAcumulado).toBeNull();
  });

  it('a meta acumulada continua depois do último dia com dado', () => {
    const ritmo = montarRitmo({
      mes: '2026-07',
      realizadoPorDia: serie('2026-07', { 1: 100 }),
      metaPorDia: planas('2026-07', 10),
    });
    expect(ritmo.dias[30].metaAcumulada).toBe(310);
    expect(ritmo.metaDoMes).toBe(310);
  });

  it('conta a semana de segunda a domingo, e só até o dia com dado', () => {
    // 06/07 é segunda, 08/07 é quarta. A semana corrente vai de 06 a 08.
    const ritmo = montarRitmo({
      mes: '2026-07',
      realizadoPorDia: serie('2026-07', { 4: 1, 5: 1, 6: 10, 7: 20, 8: 30 }),
      metaPorDia: planas('2026-07', 10),
    });
    expect(ritmo.semanaDe).toBe('2026-07-06');
    expect(ritmo.semanaAte).toBe('2026-07-08');
    expect(ritmo.semana.realizado).toBe(60);
    expect(ritmo.semana.meta).toBe(30);
  });

  it('não deixa o sábado e o domingo anteriores entrarem na semana', () => {
    const ritmo = montarRitmo({
      mes: '2026-07',
      realizadoPorDia: serie('2026-07', { 4: 999, 5: 999, 6: 10 }),
      metaPorDia: planas('2026-07', 10),
    });
    expect(ritmo.semana.realizado).toBe(10);
  });

  it('projeta pela curva da meta, e não por dias decorridos', () => {
    // O caso que quebra a projeção linear: o dia 1 carrega 20% do mês. Com
    // 200 no dia 1 e meta de 1000 no mês (200 no dia 1), o fechamento
    // projetado é 1000 — e não 200 × 31 dias.
    const meta = new Map<string, number>([['2026-07-01', 200]]);
    for (const d of diasDoMes('2026-07').slice(1)) meta.set(d, 800 / 30);

    const ritmo = montarRitmo({
      mes: '2026-07',
      realizadoPorDia: serie('2026-07', { 1: 200 }),
      metaPorDia: meta,
    });

    expect(ritmo.previsao?.metodo).toBe('curva-da-meta');
    expect(ritmo.previsao?.valor).toBeCloseTo(1000, 6);
    expect(ritmo.previsao?.fracaoDecorrida).toBeCloseTo(0.2, 6);
  });

  it('projeta acima da meta quando o ritmo está acima dela', () => {
    const meta = new Map<string, number>([['2026-07-01', 200]]);
    for (const d of diasDoMes('2026-07').slice(1)) meta.set(d, 800 / 30);

    const ritmo = montarRitmo({
      mes: '2026-07',
      realizadoPorDia: serie('2026-07', { 1: 300 }),
      metaPorDia: meta,
    });
    expect(ritmo.previsao?.valor).toBeCloseTo(1500, 6);
    expect(ritmo.previsao?.atingimento).toBeCloseTo(1.5, 6);
  });

  it('cai para o método linear quando não há meta nem histórico, e diz isso', () => {
    const ritmo = montarRitmo({
      mes: '2026-07',
      realizadoPorDia: serie('2026-07', { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10 }),
      metaPorDia: new Map(),
    });
    expect(ritmo.previsao?.metodo).toBe('linear');
    expect(ritmo.previsao?.valor).toBeCloseTo(50 / (5 / 31), 6);
    // Sem meta, atingimento é incalculável — e não 0%.
    expect(ritmo.previsao?.atingimento).toBeNull();
    expect(ritmo.mtd.atingimento).toBeNull();
  });

  it('sem meta, prefere a forma do histórico à regra de três', () => {
    // O caso do Pure Pass: sem meta desde abril/2026. A curva diz que 40% do
    // mês já passou, então 200 realizados projetam 500 — e não 200 × 31 / 3.
    const curva = Array.from({ length: 31 }, (_, i) => (i < 3 ? 0.4 / 3 : 0.6 / 28));

    const ritmo = montarRitmo({
      mes: '2026-07',
      realizadoPorDia: serie('2026-07', { 1: 100, 2: 60, 3: 40 }),
      metaPorDia: new Map(),
      curvaDeReferencia: curva,
    });

    expect(ritmo.previsao?.metodo).toBe('curva-do-historico');
    expect(ritmo.previsao?.fracaoDecorrida).toBeCloseTo(0.4, 6);
    expect(ritmo.previsao?.valor).toBeCloseTo(500, 6);
  });

  it('ignora curva de referência com tamanho de outro mês', () => {
    // Uma curva de 30 dias aplicada a um mês de 31 deslocaria todos os dias.
    const ritmo = montarRitmo({
      mes: '2026-07',
      realizadoPorDia: serie('2026-07', { 1: 100 }),
      metaPorDia: new Map(),
      curvaDeReferencia: Array.from({ length: 30 }, () => 1 / 30),
    });
    expect(ritmo.previsao?.metodo).toBe('linear');
  });

  it('a meta continua ganhando do histórico quando existe', () => {
    const meta = new Map<string, number>([['2026-07-01', 200]]);
    for (const d of diasDoMes('2026-07').slice(1)) meta.set(d, 800 / 30);

    const ritmo = montarRitmo({
      mes: '2026-07',
      realizadoPorDia: serie('2026-07', { 1: 200 }),
      metaPorDia: meta,
      curvaDeReferencia: Array.from({ length: 31 }, () => 1 / 31),
    });
    expect(ritmo.previsao?.metodo).toBe('curva-da-meta');
  });
});

describe('curvaDoHistorico', () => {
  /** Um mês com valor `dia1` no dia 1, `porDia` no miolo e 0 no último dia. */
  const mesSimples = (mes: string, dia1: number, porDia: number) => {
    const datas = diasDoMes(mes);
    const mapa = new Map<string, number>();
    datas.forEach((data, i) => {
      mapa.set(data, i === 0 ? dia1 : i === datas.length - 1 ? 0 : porDia);
    });
    return { mes, realizadoPorDia: mapa };
  };

  it('soma 1 e tem um peso por dia do mês alvo', () => {
    const curva = curvaDoHistorico([mesSimples('2026-05', 200, 10)], '2026-06');
    expect(curva).not.toBeNull();
    expect(curva!).toHaveLength(30);
    expect(curva!.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 10);
  });

  it('preserva o peso do dia 1, que é o traço mais forte da base', () => {
    // 200 no dia 1 e 10 nos outros 29 dias úteis: o dia 1 é 200/490.
    const curva = curvaDoHistorico([mesSimples('2026-05', 200, 10)], '2026-07');
    expect(curva![0]).toBeCloseTo(200 / 490, 6);
  });

  it('remonta a forma no calendário do mês alvo, sem copiar dia a dia', () => {
    // Só segundas rendem. Julho/2026 tem segundas em 6, 13, 20 e 27 — e o
    // resto do miolo tem que ficar em zero, mesmo que no mês de origem as
    // segundas caíssem em outras posições.
    const datas = diasDoMes('2026-05');
    const mapa = new Map<string, number>();
    datas.forEach((data, i) => {
      const ehMiolo = i > 0 && i < datas.length - 1;
      mapa.set(data, ehMiolo && diaDaSemana(data) === 1 ? 100 : 0);
    });

    const curva = curvaDoHistorico([{ mes: '2026-05', realizadoPorDia: mapa }], '2026-07')!;
    const segundasDeJulho = [6, 13, 20, 27];
    for (let dia = 2; dia < 31; dia++) {
      const peso = curva[dia - 1];
      if (segundasDeJulho.includes(dia)) expect(peso, `dia ${dia}`).toBeGreaterThan(0.2);
      else expect(peso, `dia ${dia}`).toBeCloseTo(0, 6);
    }
  });

  it('descarta mês sem movimento em vez de deixá-lo zerar a média', () => {
    const vazio = { mes: '2026-04', realizadoPorDia: new Map<string, number>() };
    const curva = curvaDoHistorico([vazio, mesSimples('2026-05', 200, 10)], '2026-07');
    expect(curva).not.toBeNull();
    expect(curva![0]).toBeCloseTo(200 / 490, 6);
  });

  it('devolve nulo quando não há histórico aproveitável', () => {
    expect(curvaDoHistorico([], '2026-07')).toBeNull();
    expect(
      curvaDoHistorico([{ mes: '2026-05', realizadoPorDia: new Map() }], '2026-07'),
    ).toBeNull();
  });

  it('não projeta nada quando o mês ainda não tem leitura', () => {
    const ritmo = montarRitmo({
      mes: '2026-09',
      realizadoPorDia: new Map(),
      metaPorDia: planas('2026-09', 10),
    });
    expect(ritmo.ultimoDiaComDado).toBeNull();
    expect(ritmo.previsao).toBeNull();
    expect(ritmo.mtd.realizado).toBe(0);
  });

  it('divergência é zero quando as duas curvas têm a mesma forma', () => {
    // Realizado 20% acima da meta TODO dia: seguiu a curva, num degrau acima.
    // A métrica é de forma, então isso não pode contar como divergência.
    const ritmo = montarRitmo({
      mes: '2026-07',
      realizadoPorDia: serie('2026-07', { 1: 120, 2: 60, 3: 24 }),
      metaPorDia: serie('2026-07', { 1: 100, 2: 50, 3: 20 }),
    });
    expect(ritmo.divergenciaDaCurva).toBeCloseTo(0, 6);
  });

  it('divergência pega o movimento que veio no dia errado', () => {
    // A meta esperava tudo no dia 1; veio tudo no dia 2.
    const ritmo = montarRitmo({
      mes: '2026-07',
      realizadoPorDia: serie('2026-07', { 1: 0, 2: 100 }),
      metaPorDia: serie('2026-07', { 1: 100, 2: 0 }),
    });
    expect(ritmo.divergenciaDaCurva).toBeCloseTo(1, 6);
  });

  it('não calcula divergência sem realizado ou sem meta', () => {
    expect(
      montarRitmo({
        mes: '2026-07',
        realizadoPorDia: serie('2026-07', { 1: 100 }),
        metaPorDia: new Map(),
      }).divergenciaDaCurva,
    ).toBeNull();
  });

  it('aguenta o mês inteiro com queda de correção no fim', () => {
    const ritmo = montarRitmo({
      mes: '2026-07',
      realizadoPorDia: serie('2026-07', { 1: 100, 2: 50, 3: -12 }),
      metaPorDia: planas('2026-07', 10),
    });
    expect(ritmo.mtd.realizado).toBe(138);
  });
});
