import { describe, it, expect } from 'vitest';
import { montarPedidoPdf } from './pedidoPdf';
import { calcularResumo, type ItemPedido } from './pedidoPureStore';

const item = (n: number): ItemPedido => ({
  id: `i${n}`,
  produto: `Camiseta Feminina Dry Fit - Modelo bem comprido para forçar quebra de linha ${n}`,
  tamanho: 'M',
  quantidade: 2,
  valorUnitario: 89.9,
});

const pedido = (quantos: number, frete = 0) => {
  const itens = Array.from({ length: quantos }, (_, i) => item(i + 1));
  return {
    numero: 12,
    cliente: { nome: 'Maria Silva', unidade: 'Pure Pilates Moema', telefone: '(11) 90000-0000' },
    itens,
    resumo: calcularResumo(itens, 20, frete),
    criadoEm: new Date('2026-09-23T12:00:00Z'),
  };
};

describe('PDF do pedido', () => {
  it('monta uma página com o pedido curto', async () => {
    const doc = await montarPedidoPdf(pedido(3, 35.5));
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it('quebra em mais páginas quando o pedido é longo', async () => {
    const doc = await montarPedidoPdf(pedido(40));
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });

  it('sai mesmo sem a logo (jsdom não carrega imagem) e sem número de pedido', async () => {
    const semNumero = { ...pedido(1), numero: null };
    const doc = await montarPedidoPdf(semNumero);
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
