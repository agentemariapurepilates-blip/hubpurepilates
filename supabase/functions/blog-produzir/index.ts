// Blog da Pure: a fila da produção mensal (texto e foto da capa).
//
// O pg_cron chama esta function a cada minuto, e só enquanto houver trabalho
// (migrações 20261105190000 e 20261105210000). Cada chamada faz UMA coisa:
//
// 1. TEXTO, se houver artigo 'na_fila': escreve com o Gemini (contexto da marca
//    e aprendizados do time) e devolve como
//      'em_aprovacao' quando cumpriu todas as regras de SEO;
//      'rascunho'     quando sobrou pendência, que o time resolve no editor;
//      'na_fila'      quando falhou e ainda há tentativa (no máximo três);
//      'falhou'       na terceira falha, com o motivo em erro_geracao.
//    Com o texto pronto, a foto da capa fica 'pendente'; se a escrita foi rápida,
//    a foto sai na mesma chamada.
// 2. FOTO, se não houver texto na fila: gera a próxima foto pendente.
//
// Também aceita um colaborador logado: a tela chama logo depois de aprovar o
// lote (ou de pedir outra foto), para não esperar o próximo minuto do cron.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { ehSegredoDoCron } from '../_shared/modo-relatorio.ts'
import { clienteAdmin, usuarioDoTime } from '../blog-gerar-artigo/acesso.ts'
import { escreverArtigo, temChaveDoGemini } from '../blog-gerar-artigo/escrita.ts'
import { gerarFotoDaCapa } from '../blog-gerar-artigo/foto.ts'
import { ehMarca } from '../blog-gerar-artigo/marcas.ts'

const MAXIMO_DE_TENTATIVAS = 3
// Acima disto a foto fica para a próxima chamada: a function tem limite de tempo.
const TEMPO_PARA_FOTO_NA_MESMA_CHAMADA = 60_000

type Linha = Record<string, any>

/** Gera a foto e grava o resultado. Nunca lança: falha vira capa_status. */
async function fazerFoto(admin: SupabaseClient, item: Linha): Promise<boolean> {
  try {
    const url = await gerarFotoDaCapa(admin, {
      id: item.id,
      marca: ehMarca(item.marca) ? item.marca : 'studios',
      cena_foto: item.cena_foto ?? null,
      titulo: item.titulo ?? '',
      tema: item.tema ?? '',
    })
    await admin.from('blog_artigos').update({ foto_url: url, capa_status: 'pronta', capa_erro: null }).eq('id', item.id)
    return true
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'algo deu errado'
    console.error(`[blog-produzir] foto do artigo ${item.id} falhou:`, mensagem)
    await admin
      .from('blog_artigos')
      .update({ capa_status: (item.capa_tentativas ?? 0) >= MAXIMO_DE_TENTATIVAS ? 'falhou' : 'pendente', capa_erro: mensagem })
      .eq('id', item.id)
    return false
  }
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req)
  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return responder({ erro: 'método não aceito' }, 405)
  if (!temChaveDoGemini()) return responder({ erro: 'o Blog da Pure está sem configuração de modelo' }, 503)

  const segredo = Deno.env.get('INSTAGRAM_CRON_SECRET') ?? ''
  if (!ehSegredoDoCron(req.headers.get('Authorization'), segredo)) {
    const acesso = await usuarioDoTime(req)
    if ('erro' in acesso) return responder({ erro: acesso.erro }, acesso.status)
  }

  const admin = clienteAdmin()
  const inicio = Date.now()

  // 1. Texto
  const { data: fila, error } = await admin.rpc('blog_pegar_proximo')
  if (error) {
    console.error('[blog-produzir] não consegui ler a fila:', error)
    return responder({ erro: 'não consegui ler a fila' }, 500)
  }
  const item = Array.isArray(fila) ? fila[0] : null

  if (item) {
    try {
      const { artigo, avisos } = await escreverArtigo(admin, {
        marca: ehMarca(item.marca) ? item.marca : 'studios',
        pauta: {
          tema: item.tema,
          palavraChave: item.palavra_chave ?? '',
          categoria: item.categoria ?? '',
          tamanho: item.tamanho ?? 'medio',
          observacoes: item.observacoes ?? '',
        },
      })
      const pronto = avisos.length === 0
      const { error: erroGravar } = await admin
        .from('blog_artigos')
        .update({
          ...artigo,
          avisos_seo: avisos,
          erro_geracao: null,
          status: pronto ? 'em_aprovacao' : 'rascunho',
          enviado_em: pronto ? new Date().toISOString() : null,
          enviado_por: pronto ? item.criado_por : null,
          capa_status: 'pendente',
          capa_tentativas: 0,
          capa_erro: null,
        })
        .eq('id', item.id)
      if (erroGravar) throw new Error('o artigo foi escrito, mas não consegui salvar')

      // Sobrou tempo: a foto sai agora mesmo, e o artigo chega completo.
      let foto = false
      if (Date.now() - inicio < TEMPO_PARA_FOTO_NA_MESMA_CHAMADA) {
        await admin.from('blog_artigos').update({ capa_status: 'gerando', capa_tentativas: 1 }).eq('id', item.id)
        foto = await fazerFoto(admin, { ...item, ...artigo, capa_tentativas: 1 })
      }
      return responder({ processado: 'texto', id: item.id, status: pronto ? 'em_aprovacao' : 'rascunho', foto })
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'algo deu errado'
      console.error(`[blog-produzir] falhou no artigo ${item.id}:`, mensagem)
      await admin
        .from('blog_artigos')
        .update({ status: item.tentativas >= MAXIMO_DE_TENTATIVAS ? 'falhou' : 'na_fila', erro_geracao: mensagem })
        .eq('id', item.id)
      return responder({ processado: false, id: item.id, erro: mensagem }, 502)
    }
  }

  // 2. Foto
  const { data: capas, error: erroCapas } = await admin.rpc('blog_pegar_proxima_capa')
  if (erroCapas) {
    console.error('[blog-produzir] não consegui ler a fila das capas:', erroCapas)
    return responder({ erro: 'não consegui ler a fila das capas' }, 500)
  }
  const capa = Array.isArray(capas) ? capas[0] : null
  if (!capa) return responder({ processado: false })
  const ok = await fazerFoto(admin, capa)
  return responder({ processado: 'foto', id: capa.id, ok }, ok ? 200 : 502)
})
