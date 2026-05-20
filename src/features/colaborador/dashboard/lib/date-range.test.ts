import { describe, it, expect } from 'vitest';
import { resolveRange } from './date-range';

const today = new Date('2026-05-20T12:00:00Z');

describe('resolveRange', () => {
  it('preset "ontem" = D-1, mode absolute_day', () => {
    const r = resolveRange({ preset: 'ontem', today });
    expect(r.from).toBe('2026-05-19');
    expect(r.to).toBe('2026-05-19');
    expect(r.mode).toBe('absolute_day');
  });

  it('preset "7d" cobre 7 dias terminando em D-1', () => {
    const r = resolveRange({ preset: '7d', today });
    expect(r.to).toBe('2026-05-19');
    expect(r.from).toBe('2026-05-13');
    expect(r.mode).toBe('rolling');
  });

  it('preset "180d" cobre 180 dias terminando em D-1', () => {
    const r = resolveRange({ preset: '180d', today });
    expect(r.to).toBe('2026-05-19');
    expect(r.from).toBe('2025-11-21');
  });

  it('custom: clampa "to" se for futuro', () => {
    const r = resolveRange({ from: '2026-05-10', to: '2026-06-30', today });
    expect(r.to).toBe('2026-05-19');
    expect(r.mode).toBe('custom');
  });

  it('custom: limita janela a 180 dias', () => {
    const r = resolveRange({ from: '2024-01-01', to: '2026-05-19', today });
    expect(r.from).toBe('2025-11-20');
  });
});
