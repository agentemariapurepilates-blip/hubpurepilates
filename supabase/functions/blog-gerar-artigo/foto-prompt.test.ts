import { describe, it, expect } from 'vitest';
import { promptDaFoto } from './foto-prompt';

describe('promptDaFoto', () => {
  it('cada marca leva a sua paleta', () => {
    expect(promptDaFoto('studios', 'A man on a Reformer.', 'x')).toContain('light gray');
    expect(promptDaFoto('academy', 'An instructor teaching.', 'x')).toContain('white and deep red (#C12030)');
    expect(promptDaFoto('franchising', 'A business owner.', 'x')).toContain('black, charcoal (#231F20) and deep red (#C12030)');
  });

  it('sempre proíbe texto, logo e cores frias na foto', () => {
    for (const marca of ['studios', 'academy', 'franchising'] as const) {
      const p = promptDaFoto(marca, 'cena', 'titulo');
      expect(p).toContain('no text');
      expect(p).toContain('logos');
      expect(p).toContain('No green or blue tones');
    }
  });

  it('usa a cena escrita pelo Gemini e, sem ela, parte do título', () => {
    expect(promptDaFoto('studios', 'A woman stretching on a Cadillac.', 'Título')).toContain('A woman stretching on a Cadillac.');
    expect(promptDaFoto('studios', null, 'Pilates para gestantes')).toContain('"Pilates para gestantes"');
    expect(promptDaFoto('studios', '   ', 'Pilates para idosos')).toContain('"Pilates para idosos"');
  });
});
