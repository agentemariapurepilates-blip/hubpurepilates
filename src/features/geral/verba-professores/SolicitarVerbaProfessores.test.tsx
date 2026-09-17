import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const invoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1' }, loading: false }) }));
vi.mock('@/components/layout/MainLayout', () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import SolicitarVerbaProfessores from './SolicitarVerbaProfessores';

// "Não consigo enviar a solicitação" (16/09/2026): o botão ficava desabilitado
// sem dizer por quê. Estes testes preenchem a tela como uma pessoa faria.

const digitar = (rotulo: RegExp, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });

function preencher(troca: Partial<Record<'valor' | 'email', string>> = {}) {
  render(<MemoryRouter><SolicitarVerbaProfessores /></MemoryRouter>);
  digitar(/nome do franqueado/i, 'Ana Souza');
  digitar(/nome da unidade/i, 'Pure Pilates Moema');
  digitar(/data de inauguração/i, '2026-11-05');
  digitar(/valor da verba/i, troca.valor ?? '9.000,00');
  digitar(/e-mail da unidade/i, troca.email ?? 'moema@purepilates.com.br');
}

const botao = () => screen.getByRole('button', { name: /enviar solicitação/i }) as HTMLButtonElement;

describe('Solicitar Verba para Novos Professores', () => {
  it('não pede mais a quantidade de professores', () => {
    render(<MemoryRouter><SolicitarVerbaProfessores /></MemoryRouter>);
    expect(screen.queryByLabelText(/quantidade de professores/i)).toBeNull();
  });

  beforeEach(() => {
    invoke.mockReset().mockResolvedValue({ data: { success: true, id: 'x' }, error: null });
  });

  it('valor com centavos é lido em reais e o pedido sai', async () => {
    preencher();
    fireEvent.click(screen.getByRole('checkbox'));

    expect(botao().disabled).toBe(false);
    fireEvent.click(botao());

    await waitFor(() => expect(invoke).toHaveBeenCalled());
    expect(invoke.mock.calls[0][1].body).toMatchObject({ valor_verba: 9000 });
    expect(invoke.mock.calls[0][1].body).not.toHaveProperty('qtd_professores');
  });

  it('com um campo recusado, diz o motivo depois do aceite em vez de só travar o botão', () => {
    preencher({ email: 'moema@' });

    // Enquanto preenche, nada de aviso — igual à tela da Mídia Adicional.
    expect(screen.queryByText(/e-mail da unidade inválido/i)).toBeNull();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(botao().disabled).toBe(true);
    expect(screen.getByText(/e-mail da unidade inválido/i)).toBeTruthy();
  });
});
