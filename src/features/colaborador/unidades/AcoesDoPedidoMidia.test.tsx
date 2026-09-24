import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { MidiaRequest } from '@/features/geral/midia-adicional/tipos';

// Até 24/09/2026 o admin só podia APROVAR. Estes testes cobrem as duas ações
// novas: recusar (com motivo) e editar — e o que mais importa na edição, que é
// o e-mail com os dados corrigidos sair para quem recebe os pedidos.

const update = vi.fn();
const invoke = vi.fn();
const sucesso = vi.fn();
const erro = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      update: (campos: unknown) => {
        update(campos);
        return { eq: () => ({ select: () => Promise.resolve({ data: [{ id: 'p1' }], error: null }) }) };
      },
    }),
    functions: { invoke: (...args: unknown[]) => invoke(...args) },
  },
}));
vi.mock('sonner', () => ({ toast: { success: (m: string) => sucesso(m), error: (m: string) => erro(m) } }));

import { AcoesDoPedidoMidia } from './AcoesDoPedidoMidia';

const pedido: MidiaRequest = {
  id: '9e2ca574-572a-4c71-af9c-157254bf43fe',
  nome_franqueado: 'Ana Souza',
  nome_unidade: 'Pure Pilates Moema',
  data_inauguracao: '2026-11-05',
  plano: '1500_3m',
  email_unidade: 'moema@purepilates.com.br',
  email_franqueado: null,
  status: 'pendente',
  motivo_recusa: null,
  created_at: '2026-09-24T12:00:00Z',
};

function montar(troca: Partial<MidiaRequest> = {}) {
  const aoMudar = vi.fn();
  render(<AcoesDoPedidoMidia pedido={{ ...pedido, ...troca }} aoMudar={aoMudar} />);
  return aoMudar;
}

const botao = (nome: RegExp) => screen.getByRole('button', { name: nome });

describe('AcoesDoPedidoMidia', () => {
  beforeEach(() => {
    update.mockReset();
    invoke.mockReset().mockResolvedValue({ data: { success: true, aviso_enviado: true }, error: null });
    sucesso.mockReset();
    erro.mockReset();
  });

  it('pedido pendente oferece aprovar, recusar e editar', () => {
    montar();
    expect(botao(/aprovar verba/i)).toBeTruthy();
    expect(botao(/recusar/i)).toBeTruthy();
    expect(botao(/editar/i)).toBeTruthy();
  });

  it('pedido já aprovado não oferece aprovar de novo, mas dá para recusar e editar', () => {
    montar({ status: 'aprovada' });
    expect(screen.queryByRole('button', { name: /aprovar verba/i })).toBeNull();
    expect(botao(/recusar/i)).toBeTruthy();
    expect(botao(/editar/i)).toBeTruthy();
  });

  it('recusar grava o status e o motivo digitado', async () => {
    const aoMudar = montar();
    fireEvent.click(botao(/recusar/i));
    fireEvent.change(screen.getByLabelText(/motivo/i), { target: { value: '  já tem campanha ativa  ' } });
    fireEvent.click(botao(/recusar pedido/i));

    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith({ status: 'recusada', motivo_recusa: 'já tem campanha ativa' });
    expect(aoMudar).toHaveBeenCalledWith(expect.objectContaining({ status: 'recusada' }));
  });

  it('recusar sem motivo grava nulo, e não texto vazio', async () => {
    montar();
    fireEvent.click(botao(/recusar/i));
    fireEvent.click(botao(/recusar pedido/i));
    await waitFor(() => expect(update).toHaveBeenCalledWith({ status: 'recusada', motivo_recusa: null }));
  });

  it('editar salva pela function e avisa que o e-mail saiu', async () => {
    const aoMudar = montar();
    fireEvent.click(botao(/editar/i));
    fireEvent.change(screen.getByLabelText(/nome da unidade/i), { target: { value: 'Pure Pilates Vila Olímpia' } });
    fireEvent.click(botao(/salvar e avisar/i));

    await waitFor(() => expect(invoke).toHaveBeenCalled());
    expect(invoke.mock.calls[0][0]).toBe('midia-adicional-atualizar');
    expect(invoke.mock.calls[0][1].body).toMatchObject({
      id: pedido.id,
      nome_unidade: 'Pure Pilates Vila Olímpia',
      plano: '1500_3m',
    });
    expect(aoMudar).toHaveBeenCalledWith(expect.objectContaining({ nome_unidade: 'Pure Pilates Vila Olímpia' }));
    expect(sucesso.mock.calls[0][0]).toMatch(/e-mail/i);
  });

  it('se o e-mail não sair, a tela diz isso em vez de comemorar', async () => {
    invoke.mockResolvedValue({ data: { success: true, aviso_enviado: false }, error: null });
    montar();
    fireEvent.click(botao(/editar/i));
    fireEvent.click(botao(/salvar e avisar/i));
    await waitFor(() => expect(sucesso).toHaveBeenCalled());
    expect(sucesso.mock.calls[0][0]).toMatch(/não saiu/i);
  });

  it('com um campo inválido, o botão de salvar trava e a tela diz o motivo', () => {
    montar();
    fireEvent.click(botao(/editar/i));
    fireEvent.change(screen.getByLabelText(/e-mail da unidade/i), { target: { value: 'moema' } });
    expect((botao(/salvar e avisar/i) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('alert').textContent).toMatch(/e-mail da unidade/i);
  });
});
