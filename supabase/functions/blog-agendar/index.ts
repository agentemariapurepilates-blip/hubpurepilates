// Blog da Pure: agenda no WordPress um artigo aprovado.
//
// Chamada pela tela logo depois da aprovação (um artigo ou todos). A capa vem
// pronta do navegador, em JPEG: é ele que monta foto + título no modelo
// aprovado (CapaBlog.tsx). Aqui o servidor envia a capa para a mídia do blog e
// cria o post com status "agendado" para o dia previsto, às 9h de Brasília
// (agenda.ts); se o dia já passou, hoje às 17h. O artigo passa a 'agendado' no
// Hub, com o id e o link do post.
//
// Com { acao: 'trocar_capa' }, envia a capa nova e troca só a imagem de destaque
// do post (agendado ou já publicado), apagando a antiga. Data e texto ficam.
//
// Com { acao: 'desagendar' }, devolve o post a rascunho no WordPress e o artigo
// a 'rascunho' no Hub: é o que acontece quando alguém volta um agendado para edição.
//
// Agendar de novo um artigo que já tem post no WordPress ATUALIZA o mesmo post,
// em vez de criar outro.

import { getCorsHeaders } from '../_shared/cors.ts'
import { clienteAdmin, usuarioDoTime } from '../blog-gerar-artigo/acesso.ts'
import { quandoPublicar } from '../blog-gerar-artigo/agenda.ts'
import {
  agendarPost,
  apagarMidia,
  desagendarPost,
  enviarCapa,
  idDaCategoria,
  idsDasTags,
  temAcessoAoWordPress,
  trocarCapaDoPost,
} from '../blog-gerar-artigo/wordpress.ts'

const HORA = Deno.env.get('WP_BLOG_HORA') || '09:00'
// Artigo de dia que já passou sai hoje neste horário (pedido de 05/11/2026).
const HORA_ATRASADOS = Deno.env.get('WP_BLOG_HORA_ATRASADOS') || '17:00'

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req)
  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return responder({ erro: 'método não aceito' }, 405)
  if (!temAcessoAoWordPress()) return responder({ erro: 'o acesso ao WordPress não está configurado' }, 503)

  const acesso = await usuarioDoTime(req)
  if ('erro' in acesso) return responder({ erro: acesso.erro }, acesso.status)

  let id = ''
  let acao = 'agendar'
  let capa: Uint8Array | null = null
  let tipoCapa = 'image/jpeg'
  try {
    const corpo = await req.json()
    id = String(corpo?.id ?? '')
    if (corpo?.acao === 'desagendar' || corpo?.acao === 'trocar_capa') acao = corpo.acao
    if (typeof corpo?.capa === 'string' && corpo.capa.length > 100) {
      const bin = atob(corpo.capa)
      capa = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) capa[i] = bin.charCodeAt(i)
      if (corpo?.tipoCapa === 'image/png') tipoCapa = 'image/png'
    }
  } catch {
    return responder({ erro: 'pedido malformado' }, 400)
  }

  const admin = clienteAdmin()
  const { data: artigo, error } = await admin.from('blog_artigos').select('*').eq('id', id).maybeSingle()
  if (error || !artigo) return responder({ erro: 'artigo não encontrado' }, 404)

  if (acao === 'desagendar') {
    try {
      if (artigo.wp_post_id) await desagendarPost(artigo.wp_post_id)
      await admin.from('blog_artigos').update({ status: 'rascunho', agendado_para: null, wp_erro: null }).eq('id', id)
      return responder({ ok: true })
    } catch (e) {
      return responder({ erro: e instanceof Error ? e.message : 'não consegui tirar da agenda' }, 502)
    }
  }

  if (acao === 'trocar_capa') {
    if (!artigo.wp_post_id) return responder({ erro: 'este artigo ainda não está no WordPress' }, 400)
    if (!capa) return responder({ erro: 'a capa não chegou' }, 400)
    try {
      const extensao = tipoCapa === 'image/png' ? 'png' : 'jpg'
      const nova = await enviarCapa(capa, tipoCapa, `capa-${artigo.slug || artigo.id}.${extensao}`, artigo.titulo)
      await trocarCapaDoPost(artigo.wp_post_id, nova)
      await admin.from('blog_artigos').update({ wp_media_id: nova, wp_erro: null }).eq('id', id)
      // A antiga só sai depois que a nova já está no post. Se falhar, sobra uma
      // imagem solta na biblioteca, sem prejuízo para o post.
      if (artigo.wp_media_id && artigo.wp_media_id !== nova) await apagarMidia(artigo.wp_media_id).catch(() => undefined)
      return responder({ ok: true, wp_media_id: nova })
    } catch (e) {
      return responder({ erro: e instanceof Error ? e.message : 'não consegui trocar a capa' }, 502)
    }
  }

  if (!['aprovado', 'agendado'].includes(artigo.status)) return responder({ erro: 'só artigo aprovado vai para a agenda' }, 400)
  if (!capa && !artigo.wp_media_id) return responder({ erro: 'a capa não chegou' }, 400)

  try {
    const momento = quandoPublicar(artigo.data_prevista, new Date(), HORA, HORA_ATRASADOS)
    const extensao = tipoCapa === 'image/png' ? 'png' : 'jpg'
    const [categoria, tags, midia] = await Promise.all([
      idDaCategoria(artigo.categoria),
      idsDasTags(artigo.tags ?? []),
      capa ? enviarCapa(capa, tipoCapa, `capa-${artigo.slug || artigo.id}.${extensao}`, artigo.titulo) : Promise.resolve(artigo.wp_media_id as number),
    ])

    const post = await agendarPost(
      {
        titulo: artigo.titulo,
        conteudo: artigo.conteudo_html,
        slug: artigo.slug,
        resumo: artigo.meta_descricao,
        palavraChave: artigo.palavra_chave ?? '',
        categoria,
        tags,
        capa: midia,
        dataGmt: momento.dataGmt,
      },
      artigo.wp_post_id,
    )

    await admin
      .from('blog_artigos')
      .update({
        status: 'agendado',
        wp_post_id: post.id,
        wp_url: post.link,
        wp_media_id: midia,
        agendado_para: momento.iso,
        wp_erro: null,
      })
      .eq('id', id)
    return responder({ ok: true, wp_post_id: post.id, status_wp: post.status, agendado_para: momento.iso, adiado: momento.adiado })
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : 'algo deu errado'
    console.error(`[blog-agendar] artigo ${id}:`, mensagem)
    await admin.from('blog_artigos').update({ wp_erro: mensagem }).eq('id', id)
    return responder({ erro: mensagem }, 502)
  }
})
