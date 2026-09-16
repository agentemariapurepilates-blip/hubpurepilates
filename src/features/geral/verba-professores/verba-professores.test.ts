import { describe, it, expect } from 'vitest';
import {
  corpoDoWebhook,
  destinatariosDoEmail,
  formatarData,
  formatarReais,
  lerReais,
  validarPedido,
} from '../../../../supabase/functions/send-verba-professores/pedido';

const valido = {
  nome_franqueado: '  Ana Souza ',
  nome_unidade: 'Pure Pilates Moema',
  data_inauguracao: '2026-11-05',
  valor_verba: 3500,
  qtd_professores: 2,
  email_unidade: 'moema@purepilates.com.br',
  email_franqueado: '',
};

describe('validarPedido', () => {
  it('aceita um pedido correto e normaliza os textos', () => {
    expect(validarPedido(valido)).toEqual({
      ok: true,
      pedido: { ...valido, nome_franqueado: 'Ana Souza', email_franqueado: null },
    });
  });

  it.each([
    ['sem franqueado', { nome_franqueado: ' ' }],
    ['sem unidade', { nome_unidade: '' }],
    ['sem data de inauguração', { data_inauguracao: '' }],
    ['data malformada', { data_inauguracao: '05/11/2026' }],
    ['data que não existe', { data_inauguracao: '2026-02-30' }],
    ['verba zero', { valor_verba: 0 }],
    ['verba negativa', { valor_verba: -100 }],
    ['verba com centavos', { valor_verba: 1500.5 }],
    ['verba em texto', { valor_verba: '3500' }],
    ['verba acima do teto', { valor_verba: 1_000_001 }],
    ['zero professores', { qtd_professores: 0 }],
    ['professores demais', { qtd_professores: 51 }],
    ['professores fracionados', { qtd_professores: 1.5 }],
    ['e-mail da unidade inválido', { email_unidade: 'moema' }],
    ['e-mail do franqueado inválido', { email_franqueado: 'ana@' }],
  ])('recusa %s', (_nome, troca) => {
    expect(validarPedido({ ...valido, ...troca }).ok).toBe(false);
  });

  it('não aceita escolher o status nem o dono do pedido', () => {
    const r = validarPedido({ ...valido, status: 'aprovada', user_id: 'outro' });
    expect(r.ok && Object.keys(r.pedido)).not.toContain('status');
    expect(r.ok && Object.keys(r.pedido)).not.toContain('user_id');
  });
});

describe('formatação', () => {
  it.each([
    [1, 'R$ 1,00'],
    [3500, 'R$ 3.500,00'],
    [1_000_000, 'R$ 1.000.000,00'],
  ])('%d → %s', (valor, texto) => {
    expect(formatarReais(valor)).toBe(texto);
  });

  it.each([
    ['3.500', 3500],
    ['R$ 2000', 2000],
    ['', null],
    ['abc', null],
  ])('lerReais(%s) → %s', (digitado, valor) => {
    expect(lerReais(digitado)).toBe(valor);
  });

  it('data em dd/mm/aaaa sem depender do fuso', () => {
    expect(formatarData('2026-11-05')).toBe('05/11/2026');
  });
});

describe('corpoDoWebhook', () => {
  // O workflow do n8n é uma cópia do da Mídia Adicional. Estes campos são os
  // que aquele workflow lê; se algum sumir, o e-mail duplicado sai com buraco.
  it('manda os mesmos campos que a send-midia-adicional, com a verba no lugar do plano', () => {
    const r = validarPedido({ ...valido, email_franqueado: 'ana@exemplo.com' });
    if (!r.ok) throw new Error(r.erro);

    expect(corpoDoWebhook('abc', r.pedido, 'ana@exemplo.com', ['rh@purepilates.com.br'])).toEqual({
      id: 'abc',
      tipo: 'verba_professores',
      nome_franqueado: 'Ana Souza',
      nome_unidade: 'Pure Pilates Moema',
      data_inauguracao: '2026-11-05',
      data_inauguracao_fmt: '05/11/2026',
      plano: 'verba_professores',
      plano_label: 'R$ 3.500,00 — campanha de recrutamento de 2 professores',
      valor_verba: 3500,
      valor_verba_fmt: 'R$ 3.500,00',
      qtd_professores: 2,
      email_unidade: 'moema@purepilates.com.br',
      email_franqueado: 'ana@exemplo.com',
      submitted_by: 'ana@exemplo.com',
      destinatarios: ['rh@purepilates.com.br'],
    });
  });

  it('singular para um professor', () => {
    const r = validarPedido({ ...valido, qtd_professores: 1 });
    if (!r.ok) throw new Error(r.erro);
    expect(corpoDoWebhook('x', r.pedido, null, []).plano_label).toBe('R$ 3.500,00 — campanha de recrutamento de 1 professor');
  });
});

describe('destinatariosDoEmail', () => {
  it('limpa espaços, descarta inválidos e repetidos (sem diferenciar maiúsculas)', () => {
    expect(destinatariosDoEmail([
      { email: ' rh@purepilates.com.br ' },
      { email: 'RH@purepilates.com.br' },
      { email: 'invalido' },
      { email: null },
      { email: 'renan.vaz@purepilates.com.br' },
    ])).toEqual(['rh@purepilates.com.br', 'renan.vaz@purepilates.com.br']);
  });

  it('lista vazia continua vazia', () => {
    expect(destinatariosDoEmail([])).toEqual([]);
  });
});
