import { describe, expect, it } from 'vitest';
import { compararPorOrdem, novaOrdem } from './demandOrdem';

const t = (id: string, deadline: string | null, position: number | null = null) => ({
  id,
  deadline,
  position,
  created_at: '2026-11-01T10:00:00Z',
});

describe('compararPorOrdem', () => {
  it('a ordem manual vale mais que o prazo', () => {
    const lista = [t('vence-27', '2026-11-27', 2), t('vence-28', '2026-11-28', 1)].sort(compararPorOrdem);
    expect(lista.map((x) => x.id)).toEqual(['vence-28', 'vence-27']);
  });

  it('sem ordem manual, continua pelo prazo, depois das ordenadas', () => {
    const lista = [t('nova-cedo', '2026-11-20'), t('ordenada', '2026-12-30', 1), t('nova-tarde', '2026-11-25')].sort(compararPorOrdem);
    expect(lista.map((x) => x.id)).toEqual(['ordenada', 'nova-cedo', 'nova-tarde']);
  });
});

describe('novaOrdem', () => {
  it('troca de linha dentro do mesmo grupo (para baixo)', () => {
    expect(novaOrdem(['a', 'b', 'c'], 'a', 'b', true)).toEqual(['b', 'a', 'c']);
  });

  it('troca de linha dentro do mesmo grupo (para cima)', () => {
    expect(novaOrdem(['a', 'b', 'c'], 'c', 'a', false)).toEqual(['c', 'a', 'b']);
  });

  it('vem de outro grupo e entra antes da linha em que foi solta', () => {
    expect(novaOrdem(['x', 'y'], 'a', 'y', false)).toEqual(['x', 'a', 'y']);
  });

  it('solta no grupo, fora de uma linha: vai para o fim', () => {
    expect(novaOrdem(['x', 'y'], 'a', null, false)).toEqual(['x', 'y', 'a']);
  });

  it('solta em cima dela mesma: nada muda', () => {
    expect(novaOrdem(['a', 'b'], 'a', 'a', true)).toEqual(['a', 'b']);
  });
});
