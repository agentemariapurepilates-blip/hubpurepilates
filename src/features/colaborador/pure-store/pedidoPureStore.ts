// Contas e lista de produtos do gerador de pedidos da Pure Store.
//
// Duas origens de produto:
// - Uniformes: não são vendidos na loja do site, então a lista e o preço ficam
//   aqui (UNIFORMES). Mudou o preço, muda esta lista.
// - Produtos da loja: vêm do catálogo do site (src/data/pureStoreCatalogo.ts,
//   gerado por scripts/gerar-catalogo-pure-store.mjs — não editar à mão).
//
// Em qualquer um dos dois o preço entra preenchido, mas continua editável na
// tela: campanha e tabela do franqueado mudam de preço sem o site mudar.
//
// O tamanho é digitado pela pessoa: nem o catálogo do site nem os uniformes
// guardam tamanho disponível no Hub.

import { catalogoProdutos } from '@/data/pureStoreCatalogo';

export interface OpcaoProduto {
  /** Chave única na lista de busca: a url do site, ou "uniforme:<nome>". */
  chave: string;
  nome: string;
  preco: number;
  /** "Uniformes" ou a categoria do site (Camisetas, Acessórios...). */
  grupo: string;
  esgotado?: boolean;
}

export interface ItemPedido {
  /** Chave da linha na tela; não tem nada a ver com o produto. */
  id: string;
  produto: string;
  /** Digitado pela pessoa: "M", "GG", "Único"... */
  tamanho: string;
  quantidade: number;
  valorUnitario: number;
}

export interface ResumoPedido {
  subtotal: number;
  /** O percentual já limitado a 0–100. */
  percentual: number;
  /** Quanto o desconto tirou, em reais. */
  desconto: number;
  /** Digitado à mão no pedido; entra depois do desconto. */
  frete: number;
  total: number;
}

export const UNIFORMES: OpcaoProduto[] = [
  { chave: 'uniforme:camiseta-manga-curta', nome: 'Camiseta Manga Curta', preco: 60, grupo: 'Uniformes' },
  { chave: 'uniforme:camiseta-manga-longa', nome: 'Camiseta Manga Longa', preco: 65, grupo: 'Uniformes' },
  { chave: 'uniforme:polo-adm', nome: 'Polo Adm', preco: 70, grupo: 'Uniformes' },
];

/** Uniformes primeiro, depois a loja em ordem alfabética: é assim que a busca mostra. */
export const opcoesDeProduto: OpcaoProduto[] = [
  ...UNIFORMES,
  ...[...catalogoProdutos]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((p) => ({ chave: p.url, nome: p.nome, preco: p.preco, grupo: p.categoria, esgotado: p.esgotado })),
];

export const produtoPorNome = (nome: string) => opcoesDeProduto.find((p) => p.nome === nome);

/** Centavos, sempre: sem isso 0,1 + 0,2 vira 0,30000000000000004 na soma dos itens. */
const emCentavos = (valor: number) => Math.round(valor * 100) / 100;

export const totalDoItem = (item: Pick<ItemPedido, 'quantidade' | 'valorUnitario'>) =>
  emCentavos(Math.max(0, item.quantidade) * Math.max(0, item.valorUnitario));

/** O desconto incide só sobre os produtos; o frete entra por último, inteiro. */
export function calcularResumo(
  itens: ItemPedido[],
  descontoPercentual: number,
  freteInformado = 0,
): ResumoPedido {
  const subtotal = emCentavos(itens.reduce((soma, item) => soma + totalDoItem(item), 0));
  // Percentual fora da faixa (digitação, colar de outro lugar) não pode virar desconto negativo nem total negativo.
  const percentual = Number.isFinite(descontoPercentual) ? Math.min(100, Math.max(0, descontoPercentual)) : 0;
  const desconto = emCentavos((subtotal * percentual) / 100);
  const frete = Number.isFinite(freteInformado) ? emCentavos(Math.max(0, freteInformado)) : 0;
  return { subtotal, percentual, desconto, frete, total: emCentavos(subtotal - desconto + frete) };
}

export const formatarReal = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
