// Contas e lista de produtos do gerador de pedidos da Pure Store.
//
// A LISTA DE PRODUTOS NÃO MORA MAIS AQUI (mudança de 09/10/2026): ela vive na
// tabela public.pure_store_produtos e é mantida pelos colaboradores na aba
// Produtos (ver produtosStore.ts). Antes vinha do catálogo da loja, o mesmo
// arquivo que o franqueado mostra para o aluno — eram a mesma lista, então
// mexer numa mexia na outra. Agora são coisas separadas: o catálogo do site
// continua sendo o B2C, e esta é a lista do pedido interno.
//
// Aqui ficam só os tipos e as contas do pedido.
//
// Em qualquer um dos dois o preço entra preenchido, mas continua editável na
// tela: campanha e tabela do franqueado mudam de preço sem o site mudar.
//
// O tamanho é digitado pela pessoa: nem o catálogo do site nem os uniformes
// guardam tamanho disponível no Hub.

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
