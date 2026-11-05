import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const invoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'ana@exemplo.com' }, loading: false }),
}));
vi.mock('@/components/layout/MainLayout', () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import SolicitarMidiaLocal from './SolicitarMidiaLocal';

const digitar = (rotulo: RegExp, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
const enviar = () => fireEvent.click(screen.getByRole('button', { name: /enviar pedido/i }));

function preencher(opcoes: { objetivo?: RegExp; cnpj?: string } = {}) {
  render(<MemoryRouter><SolicitarMidiaLocal /></MemoryRouter>);
  digitar(/nome do franqueado/i, 'Ana Souza');
  digitar(/telefone com ddd/i, '(11) 99999-1234');
  digitar(/nome da unidade/i, 'TESTE - pode apagar');
  digitar(/endereço da unidade/i, 'Av. Ibirapuera, 2000 - Moema, São Paulo/SP');
  digitar(/^cep/i, '04029200');
  fireEvent.click(screen.getByLabelText(opcoes.objetivo ?? /reforço de marketing local/i));
  digitar(/veiculação desejada: início/i, '2026-12-01');
  digitar(/veiculação desejada: fim/i, '2026-12-15');
  fireEvent.click(screen.getByLabelText(/tv mais digital/i));
  fireEvent.click(screen.getByLabelText(/cartela com texto e foto/i));
  digitar(/informações do criativo/i, 'Endereço e telefone da unidade');
  digitar(/^cnpj/i, opcoes.cnpj ?? '11.222.333/0001-81');
  digitar(/razão social/i, 'Moema Pilates Ltda');
  digitar(/endereço de cobrança/i, 'Rua das Flores, 10 - Centro, São Paulo/SP');
}

describe('Pedido de mídia local · TV Globo', () => {
  beforeEach(() => {
    invoke.mockReset().mockResolvedValue({ data: { success: true, id: 'x' }, error: null });
  });

  it('traz o e-mail do login já preenchido', () => {
    render(<MemoryRouter><SolicitarMidiaLocal /></MemoryRouter>);
    expect((screen.getByLabelText(/e-mail do franqueado/i) as HTMLInputElement).value).toBe('ana@exemplo.com');
  });

  it('pedido completo sai para a function com tudo normalizado', async () => {
    preencher();
    enviar();

    await waitFor(() => expect(invoke).toHaveBeenCalled());
    expect(invoke.mock.calls[0][0]).toBe('send-midia-local');
    expect(invoke.mock.calls[0][1].body).toMatchObject({
      nome_unidade: 'TESTE - pode apagar',
      email_franqueado: 'ana@exemplo.com',
      telefone: '11999991234',
      cep: '04029-200',
      objetivo: 'reforco',
      data_inauguracao: null,
      periodo_inicio: '2026-12-01',
      periodo_fim: '2026-12-15',
      produtos: ['tv_digital'],
      criativo_tipo: 'cartela',
    });
  });

  it('a data da inauguração só é pedida quando o objetivo é inauguração', () => {
    render(<MemoryRouter><SolicitarMidiaLocal /></MemoryRouter>);
    expect(screen.queryByLabelText(/data prevista da inauguração/i)).toBeNull();
    fireEvent.click(screen.getByLabelText(/inauguração prevista/i));
    expect(screen.getByLabelText(/data prevista da inauguração/i)).toBeTruthy();
  });

  it('CNPJ errado: não envia e diz o motivo', () => {
    preencher({ cnpj: '11.222.333/0001-80' });
    enviar();
    expect(invoke).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/cnpj inválido/i);
  });

  it('sem nada marcado em "o que contratar": não envia e diz o motivo', () => {
    preencher();
    fireEvent.click(screen.getByLabelText(/tv mais digital/i)); // desmarca
    enviar();
    expect(invoke).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/pelo menos uma opção/i);
  });

  it('o aviso de erro só aparece depois da tentativa de enviar', () => {
    render(<MemoryRouter><SolicitarMidiaLocal /></MemoryRouter>);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('"Usar o endereço da unidade" copia o endereço e o CEP para o faturamento', () => {
    render(<MemoryRouter><SolicitarMidiaLocal /></MemoryRouter>);
    digitar(/endereço da unidade/i, 'Av. Ibirapuera, 2000');
    digitar(/^cep/i, '04029-200');
    fireEvent.click(screen.getByRole('button', { name: /usar o endereço da unidade/i }));
    expect((screen.getByLabelText(/endereço de cobrança/i) as HTMLInputElement).value).toBe('Av. Ibirapuera, 2000, CEP 04029-200');
  });
});
