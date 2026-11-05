import { describe, it, expect } from 'vitest';
import { diasDoMes, diasPlanejaveis, ehMarca, hojeEmSaoPaulo, marcaDoDia } from './marcas';

describe('marcaDoDia', () => {
  it('reveza Studios, Academy e Franchising a partir do dia 1', () => {
    expect(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'].map(marcaDoDia)).toEqual([
      'studios',
      'academy',
      'franchising',
      'studios',
    ]);
  });

  it('recomeça no dia 1 de cada mês', () => {
    expect(marcaDoDia('2026-11-30')).toBe('franchising');
    expect(marcaDoDia('2026-12-01')).toBe('studios');
  });
});

describe('diasDoMes', () => {
  it('conta os dias certos, inclusive fevereiro de ano bissexto', () => {
    expect(diasDoMes('2026-11')).toHaveLength(30);
    expect(diasDoMes('2026-12')).toHaveLength(31);
    expect(diasDoMes('2028-02')).toHaveLength(29);
    expect(diasDoMes('2026-11')[0]).toBe('2026-11-01');
    expect(diasDoMes('2026-11').at(-1)).toBe('2026-11-30');
  });

  it('um mês de 30 dias dá 10 artigos de cada marca', () => {
    const contagem = diasDoMes('2026-11').map(marcaDoDia).reduce<Record<string, number>>((c, m) => ({ ...c, [m]: (c[m] ?? 0) + 1 }), {});
    expect(contagem).toEqual({ studios: 10, academy: 10, franchising: 10 });
  });
});

describe('ehMarca', () => {
  it('aceita só as três marcas', () => {
    expect(ehMarca('academy')).toBe(true);
    expect(ehMarca('loja')).toBe(false);
    expect(ehMarca(undefined)).toBe(false);
  });
});

describe('calendário: só de hoje em diante', () => {
  it('no dia 5 de novembro, planeja do dia 5 ao 30', () => {
    const dias = diasPlanejaveis('2026-11', '2026-11-05');
    expect(dias[0]).toBe('2026-11-05');
    expect(dias).toHaveLength(26);
    expect(dias).not.toContain('2026-11-04');
  });

  it('mês passado não tem dia nenhum; mês futuro tem todos', () => {
    expect(diasPlanejaveis('2026-10', '2026-11-05')).toEqual([]);
    expect(diasPlanejaveis('2026-12', '2026-11-05')).toHaveLength(31);
  });

  it('usa o dia de São Paulo, mesmo com o servidor em UTC', () => {
    // 23h30 de 05/11 em São Paulo já é 06/11 em UTC.
    expect(hojeEmSaoPaulo(new Date('2026-11-06T02:30:00Z'))).toBe('2026-11-05');
    expect(hojeEmSaoPaulo(new Date('2026-11-06T03:30:00Z'))).toBe('2026-11-06');
  });
});
