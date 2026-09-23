import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// A tela só precisa do miolo: o layout puxa sessão, sidebar e notificações.
vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

// Endereço da tela e banco de mentira: "?pedido=<id>" liga o modo de edição.
const { rota, store } = vi.hoisted(() => {
  const navegou: string[] = [];
  return {
    // `navegar` precisa ser a MESMA função entre renders, como o useNavigate de
    // verdade: função nova a cada render faria o efeito recarregar sem parar.
    rota: { busca: new URLSearchParams(), navegou, navegar: (destino: string) => navegou.push(destino) },
    store: { buscarPedido: vi.fn(), atualizarPedido: vi.fn(), salvarPedido: vi.fn() },
  };
});
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useSearchParams: () => [rota.busca, vi.fn()],
  useNavigate: () => rota.navegar,
}));
vi.mock('./pedidosStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./pedidosStore')>()),
  buscarPedido: store.buscarPedido,
  atualizarPedido: store.atualizarPedido,
  salvarPedido: store.salvarPedido,
}));

import PedidosPureStore from './PedidosPureStore';

beforeEach(() => {
  rota.busca = new URLSearchParams();
  rota.navegou.length = 0;
  vi.clearAllMocks();
});

beforeAll(() => {
  // jsdom não tem o que o Radix usa para posicionar o popover da busca.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

const escolherProduto = async (user: ReturnType<typeof userEvent.setup>, busca: string, nome: RegExp) => {
  await user.click(screen.getAllByRole('combobox')[0]);
  await user.type(screen.getByPlaceholderText('Buscar uniforme ou produto...'), busca);
  await user.click(await screen.findByRole('option', { name: nome }));
};

/** Texto da linha do resumo ("Subtotal", "Desconto (20%)", "Total"), com o espaço do R$ normalizado. */
const linhaDoResumo = (rotulo: string | RegExp) =>
  screen.getByText(rotulo, { selector: 'dt' }).parentElement!.textContent!.replace(/ /g, ' ');

describe('gerador de pedidos da Pure Store', () => {
  it('escolher o uniforme traz o preço, e o total acompanha quantidade e desconto', async () => {
    const user = userEvent.setup();
    render(<PedidosPureStore />);

    await escolherProduto(user, 'manga curta', /Camiseta Manga Curta/);
    expect(screen.getByLabelText('Valor unitário')).toHaveValue(60);

    const quantidade = screen.getByLabelText('Quantidade');
    await user.clear(quantidade);
    await user.type(quantidade, '2');
    // 2 x 60 aparece no total do item e no subtotal.
    expect(screen.getAllByText('R$ 120,00').length).toBeGreaterThanOrEqual(2);
    expect(linhaDoResumo('Subtotal')).toContain('R$ 120,00');

    const desconto = screen.getByLabelText('Desconto (%)');
    await user.clear(desconto);
    await user.type(desconto, '20');
    expect(linhaDoResumo(/^Desconto/)).toContain('R$ 24,00');
    expect(linhaDoResumo('Total')).toContain('R$ 96,00');
  });

  it('a busca acha produto da loja ignorando acento', async () => {
    const user = userEvent.setup();
    render(<PedidosPureStore />);

    await escolherProduto(user, 'coracao', /Coração Pilateiro/);
    expect(screen.getByLabelText('Valor unitário')).toHaveValue(89.9);
  });

  it('adiciona e remove linhas, e nunca fica sem nenhuma', async () => {
    const user = userEvent.setup();
    render(<PedidosPureStore />);

    await user.click(screen.getByRole('button', { name: 'Adicionar item' }));
    expect(screen.getAllByRole('combobox')).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: /Remover/ })[1]);
    expect(screen.getAllByRole('combobox')).toHaveLength(1);

    // A última linha não some: vira uma linha em branco.
    await user.click(screen.getAllByRole('button', { name: /Remover/ })[0]);
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });
});

describe('editar um pedido salvo', () => {
  const PEDIDO = {
    id: 'p1',
    numero: 7,
    cliente_nome: 'Maria Silva',
    cliente_unidade: 'Pure Pilates Moema',
    cliente_telefone: '(11) 90000-0000',
    data_pedido: '2026-09-15',
    desconto_percentual: 10,
    subtotal: 140,
    desconto_valor: 14,
    frete: 0,
    total: 126,
    status: 'realizado' as const,
    created_at: '2026-09-22T12:00:00Z',
    itens: [{ id: 'i1', produto: 'Polo Adm', tamanho: 'G', quantidade: 2, valor_unitario: 70, posicao: 0 }],
  };

  it('abre com tudo preenchido e salva por cima, sem criar outro pedido', async () => {
    rota.busca = new URLSearchParams('pedido=p1');
    store.buscarPedido.mockResolvedValue(PEDIDO);
    store.atualizarPedido.mockResolvedValue({ ...PEDIDO, quantidade: 3 });
    const user = userEvent.setup();

    render(<PedidosPureStore />);

    expect(await screen.findByDisplayValue('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText(/Editando o/)).toBeInTheDocument();
    expect(screen.getByLabelText('Quantidade')).toHaveValue(2);
    expect(screen.getByLabelText('Desconto (%)')).toHaveValue(10);
    // A data do pedido volta como foi salva, não como hoje.
    expect(screen.getByLabelText('Data do pedido')).toHaveValue('2026-09-15');
    expect(linhaDoResumo('Total')).toContain('R$ 126,00');

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await vi.waitFor(() => expect(store.atualizarPedido).toHaveBeenCalledTimes(1));
    expect(store.atualizarPedido.mock.calls[0][0]).toBe('p1');
    expect(store.atualizarPedido.mock.calls[0][1]).toMatchObject({
      descontoPercentual: 10,
      frete: 0,
      dataPedido: '2026-09-15',
    });
    expect(store.salvarPedido).not.toHaveBeenCalled();
    expect(rota.navegou).toContain('/colaborador/pure-store/gerenciador');
  });
});
