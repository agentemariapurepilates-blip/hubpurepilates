import { describe, it, expect } from 'vitest';
import {
  camposParaGravar,
  corpoDoWebhook,
  validarEdicao,
} from '../../../../supabase/functions/midia-adicional-atualizar/pedido';

const valido = {
  id: '9e2ca574-572a-4c71-af9c-157254bf43fe',
  nome_franqueado: '  Ana Souza ',
  nome_unidade: 'Pure Pilates Moema',
  data_inauguracao: '2026-11-05',
  plano: '2000_3m',
  email_unidade: 'moema@purepilates.com.br',
  email_franqueado: '',
};

describe('validarEdicao', () => {
  it('aceita uma edição correta e normaliza os textos', () => {
    expect(validarEdicao(valido)).toEqual({
      ok: true,
      pedido: { ...valido, nome_franqueado: 'Ana Souza', email_franqueado: null },
    });
  });

  it.each([
    ['sem id', { id: '' }],
    ['id que não é uuid', { id: 'abc' }],
    ['sem franqueado', { nome_franqueado: ' ' }],
    ['sem unidade', { nome_unidade: '' }],
    ['sem data', { data_inauguracao: '' }],
    ['data que não existe', { data_inauguracao: '2026-02-30' }],
    ['plano fora dos três', { plano: '9999' }],
    ['e-mail da unidade inválido', { email_unidade: 'moema' }],
    ['e-mail do franqueado inválido', { email_franqueado: 'ana@' }],
  ])('recusa %s', (_nome, troca) => {
    expect(validarEdicao({ ...valido, ...troca }).ok).toBe(false);
  });

  it('não deixa editar o status nem o dono do pedido por fora', () => {
    const r = validarEdicao({ ...valido, status: 'aprovada', user_id: 'outro' });
    expect(r.ok && Object.keys(r.pedido)).not.toContain('status');
    expect(r.ok && Object.keys(r.pedido)).not.toContain('user_id');
  });
});

describe('camposParaGravar', () => {
  it('não manda o id como coluna', () => {
    const r = validarEdicao(valido);
    if (!r.ok) throw new Error(r.erro);
    expect(camposParaGravar(r.pedido)).not.toHaveProperty('id');
    expect(camposParaGravar(r.pedido).nome_unidade).toBe('Pure Pilates Moema');
  });
});

describe('corpoDoWebhook', () => {
  // O e-mail sai pelo mesmo workflow do pedido novo. Se um campo sumir daqui,
  // o e-mail editado chega com buraco.
  it('manda os campos do e-mail, marcados como edição', () => {
    const r = validarEdicao({ ...valido, email_franqueado: 'ana@exemplo.com' });
    if (!r.ok) throw new Error(r.erro);

    expect(corpoDoWebhook(r.pedido, 'renan.vaz@purepilates.com.br')).toEqual({
      id: '9e2ca574-572a-4c71-af9c-157254bf43fe',
      editado: true,
      editado_por: 'renan.vaz@purepilates.com.br',
      nome_franqueado: 'Ana Souza',
      nome_unidade: 'Pure Pilates Moema',
      data_inauguracao: '2026-11-05',
      data_inauguracao_fmt: '05/11/2026',
      plano: '2000_3m',
      plano_label: 'R$ 2.000,00 — campanha de aula experimental por 3 meses',
      email_unidade: 'moema@purepilates.com.br',
      email_franqueado: 'ana@exemplo.com',
      submitted_by: 'renan.vaz@purepilates.com.br',
    });
  });
});
