import { describe, it, expect } from 'vitest';
import {
  calcularResumo,
  formatarReal,
  opcoesDeProduto,
  produtoPorNome,
  totalDoItem,
  UNIFORMES,
  type ItemPedido,
} from './pedidoPureStore';

const item = (quantidade: number, valorUnitario: number, id = String(quantidade + valorUnitario)): ItemPedido => ({
  id,
  produto: 'Camiseta',
  tamanho: 'M',
  quantidade,
  valorUnitario,
});

describe('contas do pedido', () => {
  it('bate com o exemplo do pedido da Pure Store', () => {
    // Camiseta Instrutor Feminina M x2, Polo Gestor Masculina G x1, Colete x1, 20% OFF.
    const resumo = calcularResumo([item(2, 60), item(1, 70), item(1, 134.9)], 20);
    expect(resumo.subtotal).toBe(324.9);
    expect(resumo.desconto).toBe(64.98);
    expect(resumo.total).toBe(259.92);
  });

  it('soma em centavos, sem sobra de casa decimal', () => {
    const resumo = calcularResumo([item(3, 89.9), item(2, 39.9)], 0);
    expect(resumo.subtotal).toBe(349.5);
    expect(resumo.total).toBe(349.5);
  });

  it('desconto fora da faixa não vira total negativo nem desconto negativo', () => {
    expect(calcularResumo([item(1, 100)], 150).total).toBe(0);
    expect(calcularResumo([item(1, 100)], -30).desconto).toBe(0);
    expect(calcularResumo([item(1, 100)], Number.NaN).total).toBe(100);
  });

  it('quantidade ou valor negativo não abate do total', () => {
    expect(totalDoItem({ quantidade: -2, valorUnitario: 60 })).toBe(0);
    expect(totalDoItem({ quantidade: 2, valorUnitario: -60 })).toBe(0);
  });

  it('pedido vazio tem total zero', () => {
    expect(calcularResumo([], 20)).toEqual({ subtotal: 0, percentual: 20, desconto: 0, frete: 0, total: 0 });
  });

  it('o frete entra depois do desconto, inteiro', () => {
    // 324,90 - 20% = 259,92, mais 35,50 de frete.
    const resumo = calcularResumo([item(2, 60), item(1, 70), item(1, 134.9)], 20, 35.5);
    expect(resumo.desconto).toBe(64.98);
    expect(resumo.frete).toBe(35.5);
    expect(resumo.total).toBe(295.42);
  });

  it('frete negativo ou inválido conta como zero', () => {
    expect(calcularResumo([item(1, 100)], 0, -20).total).toBe(100);
    expect(calcularResumo([item(1, 100)], 0, Number.NaN).frete).toBe(0);
  });

  it('mostra o valor em real do jeito brasileiro', () => {
    expect(formatarReal(259.92).replace(/\u00a0/g, ' ')).toBe('R$ 259,92');
  });

  it('a lista junta os uniformes e o catálogo do site, com preço em todos', () => {
    expect(opcoesDeProduto.length).toBeGreaterThan(UNIFORMES.length + 10);
    expect(opcoesDeProduto.every((p) => p.nome && p.preco > 0 && p.grupo)).toBe(true);
    // Chave repetida faria a busca escolher o produto errado.
    expect(new Set(opcoesDeProduto.map((p) => p.chave)).size).toBe(opcoesDeProduto.length);
  });

  it('os uniformes vêm primeiro e com o preço combinado', () => {
    expect(opcoesDeProduto.slice(0, 3)).toEqual(UNIFORMES);
    expect(produtoPorNome('Camiseta Manga Curta')?.preco).toBe(60);
    expect(produtoPorNome('Camiseta Manga Longa')?.preco).toBe(65);
    expect(produtoPorNome('Polo Adm')?.preco).toBe(70);
  });
});
