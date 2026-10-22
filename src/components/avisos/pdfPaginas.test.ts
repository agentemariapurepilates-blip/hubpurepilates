import { describe, expect, it, vi } from 'vitest';
import { comPrazo } from './pdfPaginas';

// O que está em jogo: em 22/10 o pdf.js travou no ar sem acusar erro, e o
// upload de PDF dos avisos ficou esperando para sempre. O prazo é o que
// transforma "esperar para sempre" em um erro que dá para tratar.
describe('comPrazo', () => {
  it('entrega o valor quando a promessa resolve a tempo', async () => {
    await expect(comPrazo(Promise.resolve('ok'), 1000, 'teste')).resolves.toBe('ok');
  });

  it('repassa o erro da própria promessa', async () => {
    await expect(comPrazo(Promise.reject(new Error('quebrou')), 1000, 'teste')).rejects.toThrow('quebrou');
  });

  it('vira erro quando a promessa nunca responde — o caso do worker que não carrega', async () => {
    vi.useFakeTimers();
    const nunca = new Promise<string>(() => {});
    const resultado = comPrazo(nunca, 20_000, 'gerar a capa');
    vi.advanceTimersByTime(20_000);
    await expect(resultado).rejects.toThrow('gerar a capa passou de 20s');
    vi.useRealTimers();
  });
});
