import { describe, it, expect } from 'vitest';
import { podeVerMarketing } from './equipe';

describe('podeVerMarketing', () => {
  it('libera quem está na lista, sem ligar para maiúsculas e espaços', () => {
    expect(podeVerMarketing('renan.vaz@purepilates.com.br')).toBe(true);
    expect(podeVerMarketing(' Renan.Vaz@PurePilates.com.br ')).toBe(true);
  });

  it('barra quem não está na lista e quem não tem e-mail', () => {
    expect(podeVerMarketing('franqueado@exemplo.com')).toBe(false);
    expect(podeVerMarketing(null)).toBe(false);
    expect(podeVerMarketing(undefined)).toBe(false);
    expect(podeVerMarketing('')).toBe(false);
  });
});
