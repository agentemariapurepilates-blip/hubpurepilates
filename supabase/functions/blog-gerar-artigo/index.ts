// Blog da Pure: escreve um artigo avulso a partir de uma pauta, ou reescreve
// um artigo existente seguindo um pedido de ajuste ("Ajustar com o Gemini").
// Usado pela seção Marketing do Hub (src/features/marketing/blog).
//
// A function só ESCREVE: não grava o artigo. Quem salva na tabela blog_artigos
// é a tela, com as regras de acesso do banco valendo para quem está logado.
// A escrita em si (regras, contexto da marca, aprendizados, conferência de SEO)
// mora em escrita.ts, compartilhada com a produção mensal.

import { getCorsHeaders } from '../_shared/cors.ts'
import { clienteAdmin, usuarioDoTime } from './acesso.ts'
import { escreverArtigo, modeloDoBlog, temChaveDoGemini, type Artigo, type Pauta } from './escrita.ts'
import { ehMarca } from './marcas.ts'

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req)
  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return responder({ erro: 'método não aceito' }, 405)
  if (!temChaveDoGemini()) {
    console.error('[blog] chave do Gemini ausente')
    return responder({ erro: 'o Blog da Pure está sem configuração de modelo' }, 503)
  }

  const acesso = await usuarioDoTime(req)
  if ('erro' in acesso) return responder({ erro: acesso.erro }, acesso.status)

  let pauta: Pauta
  let marca: 'studios' | 'academy' | 'franchising' = 'studios'
  let artigoAtual: Artigo | null = null
  let pedido = ''
  try {
    const corpo = await req.json()
    pauta = {
      tema: String(corpo?.pauta?.tema ?? '').trim().slice(0, 300),
      palavraChave: String(corpo?.pauta?.palavraChave ?? '').trim().slice(0, 120),
      categoria: String(corpo?.pauta?.categoria ?? '').trim().slice(0, 60),
      tamanho: String(corpo?.pauta?.tamanho ?? 'medio'),
      observacoes: String(corpo?.pauta?.observacoes ?? '').trim().slice(0, 2000),
    }
    if (ehMarca(corpo?.pauta?.marca)) marca = corpo.pauta.marca
    if (corpo?.artigo) {
      artigoAtual = {
        palavra_chave: String(corpo.artigo.palavra_chave ?? pauta.palavraChave ?? ''),
        titulo: String(corpo.artigo.titulo ?? ''),
        slug: String(corpo.artigo.slug ?? ''),
        meta_descricao: String(corpo.artigo.meta_descricao ?? ''),
        tags: Array.isArray(corpo.artigo.tags) ? corpo.artigo.tags.map(String).slice(0, 10) : [],
        conteudo_html: String(corpo.artigo.conteudo_html ?? '').slice(0, 60000),
      }
      pedido = String(corpo?.pedido ?? '').trim().slice(0, 2000)
    }
  } catch {
    return responder({ erro: 'pedido malformado' }, 400)
  }
  if (pauta.tema.length < 3) return responder({ erro: 'escreva o tema do artigo' }, 400)
  if (artigoAtual && !pedido) return responder({ erro: 'diga o que precisa mudar no artigo' }, 400)

  try {
    const { artigo, avisos } = await escreverArtigo(clienteAdmin(), { pauta, marca, artigoAtual, pedido })
    return responder({ artigo, avisos, modelo: modeloDoBlog() })
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'algo deu errado'
    return responder({ erro: mensagem }, 502)
  }
})
