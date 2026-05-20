import { describe, it, expect } from 'vitest';
import { aggregate, computeDerived } from './aggregate';

describe('computeDerived', () => {
  it('calcula CPM, CPC e cost_per_result', () => {
    expect(computeDerived({ impressions: 1000, clicks: 10, spend: 50, results: 5 })).toEqual({
      cpm: 50,
      cpc: 5,
      cost_per_result: 10,
    });
  });

  it('retorna null quando denominador é zero', () => {
    expect(computeDerived({ impressions: 0, clicks: 0, spend: 10, results: 0 })).toEqual({
      cpm: null,
      cpc: null,
      cost_per_result: null,
    });
  });
});

describe('aggregate', () => {
  it('retorna zero/null pra array vazio', () => {
    const r = aggregate([]);
    expect(r.impressions).toBe(0);
    expect(r.cpm).toBeNull();
    expect(r.from).toBe('');
  });

  it('soma campos aditivos e usa MÁXIMO pra reach', () => {
    const r = aggregate([
      { date: '2026-05-01', impressions: 100, clicks: 5, spend: 10, results: 1, reach: 80 },
      { date: '2026-05-02', impressions: 200, clicks: 10, spend: 20, results: 2, reach: 150 },
    ]);
    expect(r.impressions).toBe(300);
    expect(r.clicks).toBe(15);
    expect(r.spend).toBe(30);
    expect(r.results).toBe(3);
    expect(r.reach).toBe(150);
    expect(r.from).toBe('2026-05-01');
    expect(r.to).toBe('2026-05-02');
  });
});
