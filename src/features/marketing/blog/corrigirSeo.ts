import { supabase } from '@/integrations/supabase/client';
import { conferirArtigo, escreverComGemini, pautaDoArtigo, type ArtigoBlog } from './blogTipos';

/** O pedido de correção que vai para o Gemini, a partir das pendências de SEO. */
export const pedidoDeCorrecao = (pendencias: string[]) =>
  [
    'Corrija estes pontos obrigatórios de SEO, sem mudar o resto do artigo:',
    ...pendencias.map((p) => `- ${p}`),
    'Escreva a palavra-chave, o título e o texto em português correto, com acentos.',
  ].join('\n');

/**
 * Corrige com o Gemini as pendências de SEO de um artigo salvo (usado na lista
 * "Em edição"). Se ficar tudo certo, o artigo vai sozinho para "Para aprovar".
 * Devolve o que ainda faltar.
 */
export async function corrigirSeoComGemini(id: string, userId?: string): Promise<string[]> {
  const { data, error } = await supabase.from('blog_artigos').select('*').eq('id', id).maybeSingle();
  if (error || !data) throw new Error('não encontrei o artigo');
  const a = data as ArtigoBlog;
  const pendencias = conferirArtigo(a, a.palavra_chave ?? '');
  const emEdicao = a.status === 'rascunho' || a.status === 'ajustes';
  const paraAprovar = { status: 'em_aprovacao', enviado_em: new Date().toISOString(), enviado_por: userId ?? null };

  if (!pendencias.length) {
    if (emEdicao) await supabase.from('blog_artigos').update({ ...paraAprovar, avisos_seo: [] }).eq('id', id);
    return [];
  }

  const { artigo: novo, avisos } = await escreverComGemini(pautaDoArtigo(a), {
    artigo: {
      palavra_chave: a.palavra_chave ?? '',
      titulo: a.titulo,
      slug: a.slug,
      meta_descricao: a.meta_descricao,
      tags: a.tags,
      conteudo_html: a.conteudo_html,
    },
    pedido: pedidoDeCorrecao(pendencias),
  });
  const { error: erroGravar } = await supabase
    .from('blog_artigos')
    .update({ ...novo, avisos_seo: avisos, ...(avisos.length === 0 && emEdicao ? paraAprovar : {}) })
    .eq('id', id);
  if (erroGravar) throw new Error('o Gemini corrigiu, mas não consegui salvar');
  return avisos;
}
