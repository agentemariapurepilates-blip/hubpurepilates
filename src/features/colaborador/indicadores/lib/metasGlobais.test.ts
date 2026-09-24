import { describe, it, expect } from 'vitest';
import { alteracoesDaGrade, limparDigitacao, mesesParaEdicao, totalDaColuna } from './metasGlobais';

describe('mesesParaEdicao', () => {
  it('junta os meses com meta ao corrente e aos 12 seguintes, em ordem', () => {
    const meses = mesesParaEdicao(['2026-01', '2026-09'], new Date(2026, 8, 16));
    expect(meses[0]).toBe('2026-01');
    expect(meses).toContain('2026-09');
    expect(meses.at(-1)).toBe('2027-09');
    expect(meses.filter((m) => m === '2026-09')).toHaveLength(1);
    expect(meses).toHaveLength(14);
  });

  it('funciona antes de a consulta voltar', () => {
    expect(mesesParaEdicao(undefined, new Date(2026, 11, 1))).toHaveLength(13);
  });
});

describe('limparDigitacao', () => {
  it.each([
    ['1.702', '1702'],
    ['-5', '5'],
    ['007', '7'],
    ['0', '0'],
    ['abc', ''],
  ])('%s → %s', (entrada, saida) => {
    expect(limparDigitacao(entrada)).toBe(saida);
  });
});

describe('alteracoesDaGrade', () => {
  const metricas = ['experimentais', 'matriculas_total'];

  it('sem digitação nenhuma, não há o que salvar', () => {
    expect(alteracoesDaGrade('2026-10', 31, metricas, { '1-experimentais': 100 }, {})).toEqual([]);
  });

  it('manda só as células que mudaram de valor', () => {
    const original = { '1-experimentais': 100, '2-experimentais': 50 };
    const rascunho = { '1-experimentais': '120', '2-experimentais': '50', '3-matriculas_total': '9' };
    expect(alteracoesDaGrade('2026-10', 31, metricas, original, rascunho)).toEqual([
      { date: '2026-10-01', metric_key: 'experimentais', daily_target: 120 },
      { date: '2026-10-03', metric_key: 'matriculas_total', daily_target: 9 },
    ]);
  });

  it('apagar uma meta existente grava 0; apagar célula que nunca teve meta não grava nada', () => {
    const r = alteracoesDaGrade('2026-10', 31, metricas, { '1-experimentais': 100 }, { '1-experimentais': '', '2-experimentais': '' });
    expect(r).toEqual([{ date: '2026-10-01', metric_key: 'experimentais', daily_target: 0 }]);
  });

  it('não passa do último dia do mês', () => {
    const r = alteracoesDaGrade('2027-02', 28, metricas, {}, { '28-experimentais': '1', '29-experimentais': '1' });
    expect(r.map((m) => m.date)).toEqual(['2027-02-28']);
  });
});

describe('totalDaColuna', () => {
  it('soma o digitado por cima do original', () => {
    const original = { '1-experimentais': 100, '2-experimentais': 50 };
    expect(totalDaColuna(30, 'experimentais', original, { '2-experimentais': '10', '3-experimentais': '' })).toBe(110);
  });
});
