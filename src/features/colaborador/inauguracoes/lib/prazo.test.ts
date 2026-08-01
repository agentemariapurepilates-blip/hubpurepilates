import { describe, it, expect } from 'vitest';
import { HORAS_DE_ANTECEDENCIA, prazoDeAlteracao, podeAlterar } from './prazo';

// A inauguração começa 00:00 em São Paulo (-03:00, sem horário de verão desde
// 2019). O prazo trava 48h antes disso. Ex.: inauguração em 20/08/2026 começa
// em 2026-08-20T03:00:00Z; o prazo fecha em 2026-08-18T03:00:00Z.
const INAUGURACAO = '2026-08-20';
const PRAZO = new Date('2026-08-18T03:00:00Z');

describe('prazoDeAlteracao', () => {
  it('trava 48h antes da meia-noite de São Paulo', () => {
    expect(prazoDeAlteracao(INAUGURACAO).toISOString()).toBe(PRAZO.toISOString());
  });

  it('são exatamente 48 horas', () => {
    expect(HORAS_DE_ANTECEDENCIA).toBe(48);
  });
});

describe('podeAlterar', () => {
  it('permite bem antes do prazo', () => {
    expect(podeAlterar(INAUGURACAO, new Date('2026-08-01T12:00:00Z'))).toBe(true);
  });

  it('permite um segundo antes da virada', () => {
    expect(podeAlterar(INAUGURACAO, new Date(PRAZO.getTime() - 1000))).toBe(true);
  });

  it('bloqueia exatamente na virada', () => {
    expect(podeAlterar(INAUGURACAO, PRAZO)).toBe(false);
  });

  it('bloqueia dentro da janela das 48h', () => {
    expect(podeAlterar(INAUGURACAO, new Date('2026-08-19T12:00:00Z'))).toBe(false);
  });

  it('bloqueia depois da data da inauguração', () => {
    expect(podeAlterar(INAUGURACAO, new Date('2026-09-01T12:00:00Z'))).toBe(false);
  });

  it('não depende do fuso da máquina — a âncora é -03:00, não o relógio local', () => {
    // Este arquivo roda com TZ=UTC (fixado em vitest.config.ts), um fuso
    // DIFERENTE de America/Sao_Paulo de propósito. Se o cálculo usasse
    // `new Date(ano, mes - 1, dia)` ou getFullYear()/getMonth() locais em vez
    // de ancorar explicitamente em `-03:00`, o resultado sairia 3h adiantado
    // (00:00Z em vez de 03:00Z) e esta asserção falharia — é essa diferença
    // que prova que a âncora é a data, não o relógio da máquina que roda o
    // teste.
    expect(prazoDeAlteracao('2026-01-15').toISOString()).toBe('2026-01-13T03:00:00.000Z');
  });
});
