// Blog da Pure: confere no WordPress quais artigos agendados já entraram no ar
// e marca como 'publicado' no Hub (pedido de 05/11/2026: "o cron roda todo dia,
// vê qual artigo entrou e dá ok em publicado").
//
// O pg_cron chama de hora em hora, e só quando há agendado com a hora vencida
// (migração 20261105240000). Para cada um, pergunta ao WordPress a situação:
//   'publish' -> 'publicado' no Hub, com a data e o link público;
//   'future'  -> ainda não saiu (o WP-Cron atrasou): fica para a próxima rodada;
//   outro     -> alguém mexeu no WordPress à mão; o motivo vai para wp_erro.
//
// Também aceita um colaborador logado, para o botão "Conferir agora".

import { getCorsHeaders } from '../_shared/cors.ts'
import { ehSegredoDoCron } from '../_shared/modo-relatorio.ts'
import { clienteAdmin, usuarioDoTime } from '../blog-gerar-artigo/acesso.ts'
import { situacaoDoPost, temAcessoAoWordPress } from '../blog-gerar-artigo/wordpress.ts'

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req)
  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return responder({ erro: 'método não aceito' }, 405)
  if (!temAcessoAoWordPress()) return responder({ erro: 'o acesso ao WordPress não está configurado' }, 503)

  const segredo = Deno.env.get('INSTAGRAM_CRON_SECRET') ?? ''
  if (!ehSegredoDoCron(req.headers.get('Authorization'), segredo)) {
    const acesso = await usuarioDoTime(req)
    if ('erro' in acesso) return responder({ erro: acesso.erro }, acesso.status)
  }

  const admin = clienteAdmin()
  const { data: vencidos, error } = await admin
    .from('blog_artigos')
    .select('id, wp_post_id')
    .eq('status', 'agendado')
    .not('wp_post_id', 'is', null)
    .lte('agendado_para', new Date().toISOString())
    .limit(60)
  if (error) return responder({ erro: 'não consegui ler os agendados' }, 500)

  let publicados = 0
  let aindaNao = 0
  const problemas: string[] = []
  for (const a of vencidos ?? []) {
    try {
      const post = await situacaoDoPost(a.wp_post_id)
      if (post.status === 'publish') {
        await admin
          .from('blog_artigos')
          .update({ status: 'publicado', publicado_em: post.date_gmt ? `${post.date_gmt}Z` : new Date().toISOString(), wp_url: post.link, wp_erro: null })
          .eq('id', a.id)
        publicados += 1
      } else if (post.status === 'future') {
        aindaNao += 1
      } else {
        const motivo = `o post está como "${post.status}" no WordPress`
        await admin.from('blog_artigos').update({ wp_erro: motivo }).eq('id', a.id)
        problemas.push(motivo)
      }
    } catch (e) {
      problemas.push(e instanceof Error ? e.message : 'falhou')
    }
  }
  return responder({ conferidos: vencidos?.length ?? 0, publicados, aindaNao, problemas })
})
