// Leitura e escrita dos pedidos da Pure Store.
//
// O pedido guarda os próprios valores (subtotal, desconto e total) e o nome do
// produto como estava no dia: o preço no site muda, e o pedido antigo precisa
// continuar mostrando o que foi combinado com o cliente.
//
// Tudo que vem do banco passa por `paraPedido`/`paraItem`: coluna `numeric`
// pode chegar como texto pela API, e `status` chega como texto livre.

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { calcularResumo, type ItemPedido } from './pedidoPureStore';

type LinhaPedido = Database['public']['Tables']['pure_store_pedidos']['Row'];
type LinhaItem = Database['public']['Tables']['pure_store_pedido_itens']['Row'];

/** O quadro do Gerenciador, na ordem em que o pedido anda. */
export const STATUS_PEDIDO = ['realizado', 'separado', 'entregue'] as const;
export type StatusPedido = (typeof STATUS_PEDIDO)[number];

export const TITULO_STATUS: Record<StatusPedido, string> = {
  realizado: 'Pedido realizado',
  separado: 'Pedido separado',
  entregue: 'Pedido entregue',
};

export const COR_STATUS: Record<StatusPedido, string> = {
  realizado: '#579BFC',
  separado: '#FDAB3D',
  entregue: '#00C875',
};

export interface ItemSalvo {
  id: string;
  produto: string;
  tamanho: string;
  quantidade: number;
  valor_unitario: number;
  posicao: number;
}

export interface PedidoSalvo {
  id: string;
  numero: number;
  cliente_nome: string;
  cliente_unidade: string;
  cliente_telefone: string;
  desconto_percentual: number;
  subtotal: number;
  desconto_valor: number;
  total: number;
  status: StatusPedido;
  created_at: string;
  itens: ItemSalvo[];
}

export interface DadosDoCliente {
  nome: string;
  unidade: string;
  telefone: string;
}

/** Status desconhecido (banco mexido na mão) cai em "realizado" em vez de quebrar o quadro. */
const statusValido = (valor: string): StatusPedido =>
  (STATUS_PEDIDO as readonly string[]).includes(valor) ? (valor as StatusPedido) : 'realizado';

const paraItem = (linha: LinhaItem): ItemSalvo => ({
  id: linha.id,
  produto: linha.produto,
  tamanho: linha.tamanho,
  quantidade: Number(linha.quantidade),
  valor_unitario: Number(linha.valor_unitario),
  posicao: Number(linha.posicao),
});

const paraPedido = (linha: LinhaPedido, itens: ItemSalvo[]): PedidoSalvo => ({
  id: linha.id,
  numero: Number(linha.numero),
  cliente_nome: linha.cliente_nome,
  cliente_unidade: linha.cliente_unidade,
  cliente_telefone: linha.cliente_telefone,
  desconto_percentual: Number(linha.desconto_percentual),
  subtotal: Number(linha.subtotal),
  desconto_valor: Number(linha.desconto_valor),
  total: Number(linha.total),
  status: statusValido(linha.status),
  created_at: linha.created_at,
  itens,
});

/** Linhas em branco (sem produto) não viram item do pedido. */
export const itensValidos = (itens: ItemPedido[]) =>
  itens.filter((item) => item.produto.trim() && item.quantidade > 0);

export async function salvarPedido(entrada: {
  cliente: DadosDoCliente;
  itens: ItemPedido[];
  descontoPercentual: number;
  criadoPor: string | undefined;
}): Promise<PedidoSalvo> {
  const itens = itensValidos(entrada.itens);
  const resumo = calcularResumo(itens, entrada.descontoPercentual);

  const { data: pedido, error } = await supabase
    .from('pure_store_pedidos')
    .insert({
      cliente_nome: entrada.cliente.nome.trim(),
      cliente_unidade: entrada.cliente.unidade.trim(),
      cliente_telefone: entrada.cliente.telefone.trim(),
      desconto_percentual: resumo.percentual,
      subtotal: resumo.subtotal,
      desconto_valor: resumo.desconto,
      total: resumo.total,
      // Nasce em "Pedido realizado"; daí em diante quem move é o Gerenciador.
      status: 'realizado',
      criado_por: entrada.criadoPor ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  const { data: salvos, error: erroItens } = await supabase
    .from('pure_store_pedido_itens')
    .insert(
      itens.map((item, posicao) => ({
        pedido_id: pedido.id,
        produto: item.produto,
        tamanho: item.tamanho.trim(),
        quantidade: item.quantidade,
        valor_unitario: item.valorUnitario,
        posicao,
      })),
    )
    .select();
  if (erroItens) throw erroItens;

  return paraPedido(pedido, (salvos ?? []).map(paraItem));
}

/** Todos os pedidos, do mais novo para o mais antigo, com os itens de cada um. */
export async function listarPedidos(): Promise<PedidoSalvo[]> {
  const { data: pedidos, error } = await supabase
    .from('pure_store_pedidos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!pedidos?.length) return [];

  const { data: itens, error: erroItens } = await supabase
    .from('pure_store_pedido_itens')
    .select('*')
    .in('pedido_id', pedidos.map((p) => p.id))
    .order('posicao');
  if (erroItens) throw erroItens;

  return pedidos.map((pedido) =>
    paraPedido(
      pedido,
      (itens ?? []).filter((item) => item.pedido_id === pedido.id).map(paraItem),
    ),
  );
}

/** Um pedido com os itens, para abrir no Gerador e editar. */
export async function buscarPedido(id: string): Promise<PedidoSalvo | null> {
  const { data, error } = await supabase.from('pure_store_pedidos').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: itens, error: erroItens } = await supabase
    .from('pure_store_pedido_itens')
    .select('*')
    .eq('pedido_id', id)
    .order('posicao');
  if (erroItens) throw erroItens;

  return paraPedido(data, (itens ?? []).map(paraItem));
}

/**
 * Regrava o pedido inteiro: dados do cliente, valores e a lista de itens. O
 * status não muda — quem move o pedido no quadro é o Gerenciador.
 */
export async function atualizarPedido(
  id: string,
  entrada: { cliente: DadosDoCliente; itens: ItemPedido[]; descontoPercentual: number },
): Promise<PedidoSalvo> {
  const itens = itensValidos(entrada.itens);
  const resumo = calcularResumo(itens, entrada.descontoPercentual);

  const { data: pedido, error } = await supabase
    .from('pure_store_pedidos')
    .update({
      cliente_nome: entrada.cliente.nome.trim(),
      cliente_unidade: entrada.cliente.unidade.trim(),
      cliente_telefone: entrada.cliente.telefone.trim(),
      desconto_percentual: resumo.percentual,
      subtotal: resumo.subtotal,
      desconto_valor: resumo.desconto,
      total: resumo.total,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  // Troca a lista inteira em vez de casar linha a linha: o pedido é pequeno e
  // assim não sobra item fantasma quando a pessoa remove uma linha.
  const { error: erroApagar } = await supabase.from('pure_store_pedido_itens').delete().eq('pedido_id', id);
  if (erroApagar) throw erroApagar;

  const { data: salvos, error: erroItens } = await supabase
    .from('pure_store_pedido_itens')
    .insert(
      itens.map((item, posicao) => ({
        pedido_id: id,
        produto: item.produto,
        tamanho: item.tamanho.trim(),
        quantidade: item.quantidade,
        valor_unitario: item.valorUnitario,
        posicao,
      })),
    )
    .select();
  if (erroItens) throw erroItens;

  return paraPedido(pedido, (salvos ?? []).map(paraItem));
}

export async function moverPedido(id: string, status: StatusPedido) {
  const { error } = await supabase.from('pure_store_pedidos').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function excluirPedido(id: string) {
  // Os itens saem junto (ON DELETE CASCADE).
  const { error } = await supabase.from('pure_store_pedidos').delete().eq('id', id);
  if (error) throw error;
}
