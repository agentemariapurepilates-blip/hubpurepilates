// Lista de produtos do gerador de pedidos (lado interno da Pure Store).
//
// Desde 09/10/2026 esta lista é SEPARADA do catálogo do franqueado. O catálogo
// (src/data/pureStoreCatalogo.ts) continua sendo gerado da loja e é o que a
// unidade mostra para o aluno; esta aqui é a lista de quem monta o pedido, vive
// na tabela public.pure_store_produtos e é mantida pelos colaboradores na aba
// Produtos — sem depender de deploy.
//
// O preço daqui só preenche o campo do pedido: na tela ele continua editável.
//
// Só dá para LISTAR e CADASTRAR: excluir não entra por decisão da usuária — o
// produto que sai de linha simplesmente para de ser escolhido, e apagar quebraria
// a leitura de pedidos antigos.

import { supabase } from '@/integrations/supabase/client';
import type { OpcaoProduto } from './pedidoPureStore';

export interface ProdutoInterno extends OpcaoProduto {
  id: string;
  ativo: boolean;
}

type Linha = {
  id: string;
  nome: string;
  preco: number | string;
  grupo: string;
  ativo: boolean;
};

/** `numeric` do Postgres chega como texto pela API; sem isto o total soma errado. */
const paraProduto = (l: Linha): ProdutoInterno => ({
  id: l.id,
  chave: l.id,
  nome: l.nome,
  preco: Number(l.preco),
  grupo: l.grupo,
  ativo: l.ativo,
});

/** Uniformes primeiro (é o que mais se pede), o resto em ordem alfabética. */
const ordenar = (a: ProdutoInterno, b: ProdutoInterno) => {
  const peso = (p: ProdutoInterno) => (p.grupo === 'Uniformes' ? 0 : 1);
  return peso(a) - peso(b) || a.nome.localeCompare(b.nome, 'pt-BR');
};

export async function listarProdutos(incluirInativos = false): Promise<ProdutoInterno[]> {
  let consulta = supabase.from('pure_store_produtos').select('id, nome, preco, grupo, ativo');
  if (!incluirInativos) consulta = consulta.eq('ativo', true);
  const { data, error } = await consulta;
  if (error) throw error;
  return (data ?? []).map((l) => paraProduto(l as Linha)).sort(ordenar);
}

export async function criarProduto(entrada: { nome: string; preco: number; grupo: string }) {
  const { data, error } = await supabase
    .from('pure_store_produtos')
    .insert({ nome: entrada.nome.trim(), preco: entrada.preco, grupo: entrada.grupo.trim() || 'Outros' })
    .select('id, nome, preco, grupo, ativo')
    .single();
  if (error) throw error;
  return paraProduto(data as Linha);
}

/** Grupos já usados, para o campo de grupo sugerir em vez de a pessoa digitar do zero. */
export const gruposDe = (produtos: ProdutoInterno[]) =>
  [...new Set(produtos.map((p) => p.grupo))].sort((a, b) =>
    a === 'Uniformes' ? -1 : b === 'Uniformes' ? 1 : a.localeCompare(b, 'pt-BR'),
  );
