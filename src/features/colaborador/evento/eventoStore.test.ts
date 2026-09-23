import { describe, expect, it, vi } from 'vitest';

// O store importa o cliente do Supabase só para as consultas; o que se testa
// aqui são as funções puras (máscara, validação e contagem).
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

const { contarPorTurma, formatarWhatsapp, whatsappValido } = await import('./eventoStore');
type Confirmacao = Awaited<ReturnType<typeof import('./eventoStore').listarConfirmacoes>>[number];

const confirmacao = (turma: 'A' | 'B'): Confirmacao => ({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  nome: 'Fulana',
  whatsapp: '(11) 98888-7777',
  turma,
  criadoEm: new Date().toISOString(),
});

describe('formatarWhatsapp', () => {
  it('monta a máscara de celular enquanto digita', () => {
    expect(formatarWhatsapp('1')).toBe('1');
    expect(formatarWhatsapp('11')).toBe('11');
    expect(formatarWhatsapp('119')).toBe('(11) 9');
    expect(formatarWhatsapp('1198888')).toBe('(11) 9888-8');
    expect(formatarWhatsapp('11988887777')).toBe('(11) 98888-7777');
  });

  it('formata fixo de oito dígitos', () => {
    expect(formatarWhatsapp('1133334444')).toBe('(11) 3333-4444');
  });

  it('ignora o que não é número e não passa de onze dígitos', () => {
    expect(formatarWhatsapp('(11) 98888-7777')).toBe('(11) 98888-7777');
    expect(formatarWhatsapp('11988887777999')).toBe('(11) 98888-7777');
  });
});

describe('whatsappValido', () => {
  it('aceita celular e fixo', () => {
    expect(whatsappValido('(11) 98888-7777')).toBe(true);
    expect(whatsappValido('(11) 3333-4444')).toBe(true);
  });

  it('recusa número incompleto', () => {
    expect(whatsappValido('')).toBe(false);
    expect(whatsappValido('(11) 9888')).toBe(false);
    expect(whatsappValido('98888-7777')).toBe(false);
  });
});

describe('contarPorTurma', () => {
  it('conta cada turma e o total', () => {
    const lista = [confirmacao('A'), confirmacao('B'), confirmacao('A')];
    expect(contarPorTurma(lista)).toEqual({ A: 2, B: 1, total: 3 });
  });

  it('devolve zeros com a lista vazia', () => {
    expect(contarPorTurma([])).toEqual({ A: 0, B: 0, total: 0 });
  });
});
