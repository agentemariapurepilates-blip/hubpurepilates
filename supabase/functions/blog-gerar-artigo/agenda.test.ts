import { describe, it, expect } from 'vitest';
import { quandoPublicar } from './agenda';

// 5 de novembro de 2026, 15h em Brasília (18h UTC).
const AGORA = new Date('2026-11-05T18:00:00Z');

describe('quandoPublicar', () => {
  it('agenda no dia previsto, às 9h de Brasília (12h UTC)', () => {
    const m = quandoPublicar('2026-11-20', AGORA);
    expect(m.dataGmt).toBe('2026-11-20T12:00:00');
    expect(m.dia).toBe('2026-11-20');
    expect(m.adiado).toBe(false);
  });

  it('dia previsto que já passou vai ao ar hoje às 17h de Brasília (20h UTC)', () => {
    const m = quandoPublicar('2026-11-02', AGORA);
    expect(m.dataGmt).toBe('2026-11-05T20:00:00');
    expect(m.dia).toBe('2026-11-05');
    expect(m.adiado).toBe(true);
  });

  it('hoje, depois das 9h, também vai para as 17h de hoje', () => {
    expect(quandoPublicar('2026-11-05', AGORA).dataGmt).toBe('2026-11-05T20:00:00');
  });

  it('atrasado depois das 17h (ou a menos de 10 minutos) vai para amanhã às 9h', () => {
    expect(quandoPublicar('2026-11-02', new Date('2026-11-05T19:55:00Z')).dataGmt).toBe('2026-11-06T12:00:00');
    expect(quandoPublicar('2026-11-02', new Date('2026-11-05T21:00:00Z')).dataGmt).toBe('2026-11-06T12:00:00');
  });

  it('hoje, antes das 9h, ainda sai hoje', () => {
    const cedo = new Date('2026-11-05T10:00:00Z'); // 7h em Brasília
    expect(quandoPublicar('2026-11-05', cedo).dataGmt).toBe('2026-11-05T12:00:00');
  });

  it('às 23h de Brasília, "amanhã" é o dia seguinte de Brasília, não de UTC', () => {
    const noite = new Date('2026-11-06T02:00:00Z'); // 23h do dia 5 em Brasília
    expect(quandoPublicar('2026-11-01', noite).dataGmt).toBe('2026-11-06T12:00:00');
  });

  it('sem dia previsto (artigo avulso), vai para amanhã', () => {
    expect(quandoPublicar(null, AGORA).dia).toBe('2026-11-06');
    expect(quandoPublicar(null, AGORA).adiado).toBe(false);
  });

  it('respeita outro horário', () => {
    expect(quandoPublicar('2026-11-20', AGORA, '18:30').dataGmt).toBe('2026-11-20T21:30:00');
  });

  it('vira o mês e o ano', () => {
    expect(quandoPublicar('2026-10-31', new Date('2026-12-31T22:00:00Z')).dia).toBe('2027-01-01');
  });
});
