import { describe, it, expect } from 'vitest';
import { descreverPeriodo, montarRelatorioPdf, resumirPedidos, type PedidoDoRelatorio } from './relatorioPdf';

const pedido = (numero: number, total: number, status: string, data_pedido = '2026-09-10'): PedidoDoRelatorio => ({
  numero,
  data_pedido,
  cliente_nome: `Cliente ${numero}`,
  cliente_unidade: 'Pure Pilates Moema',
  status,
  quantidadeDeItens: 3,
  total,
});

describe('resumo do relatório', () => {
  it('soma os pedidos, calcula o ticket médio e agrupa por situação', () => {
    const resumo = resumirPedidos([
      pedido(1, 100, 'Pedido realizado'),
      pedido(2, 50.5, 'Pedido entregue'),
      pedido(3, 49.5, 'Pedido realizado'),
    ]);

    expect(resumo.quantidade).toBe(3);
    expect(resumo.total).toBe(200);
    expect(resumo.ticketMedio).toBe(66.67);
    // Do maior valor para o menor.
    expect(resumo.porStatus).toEqual([
      { status: 'Pedido realizado', quantidade: 2, total: 149.5 },
      { status: 'Pedido entregue', quantidade: 1, total: 50.5 },
    ]);
  });

  it('período sem pedido nenhum não quebra a conta', () => {
    expect(resumirPedidos([])).toEqual({ quantidade: 0, total: 0, ticketMedio: 0, porStatus: [] });
  });
});

describe('descrição do período', () => {
  it('cobre os quatro jeitos de filtrar', () => {
    expect(descreverPeriodo({ de: '2026-09-01', ate: '2026-09-30' })).toBe('01/09/2026 a 30/09/2026');
    expect(descreverPeriodo({ de: '2026-09-01' })).toBe('a partir de 01/09/2026');
    expect(descreverPeriodo({ ate: '2026-09-30' })).toBe('até 30/09/2026');
    expect(descreverPeriodo({})).toBe('todos os pedidos');
  });
});

describe('PDF do relatório', () => {
  it('cabe numa página com poucos pedidos e quebra com muitos', async () => {
    const curto = await montarRelatorioPdf({
      pedidos: [pedido(1, 100, 'Pedido realizado'), pedido(2, 80, 'Cancelado')],
      periodo: { de: '2026-09-01', ate: '2026-09-30' },
    });
    expect(curto.getNumberOfPages()).toBe(1);

    const longo = await montarRelatorioPdf({
      pedidos: Array.from({ length: 60 }, (_, i) => pedido(i + 1, 120, 'Pedido separado')),
      periodo: {},
    });
    expect(longo.getNumberOfPages()).toBeGreaterThan(1);
  });

  it('sai mesmo sem nenhum pedido no período', async () => {
    const doc = await montarRelatorioPdf({ pedidos: [], periodo: { de: '2026-09-01' } });
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
