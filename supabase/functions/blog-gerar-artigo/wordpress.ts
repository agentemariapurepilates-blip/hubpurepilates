// Conversa com o WordPress do blog (blog.purepilates.com.br) pela API oficial.
// Faz o que o nó do n8n fazia, sem o n8n no meio.
//
// O que foi conferido no blog em 05/11/2026, com o usuário n8n (papel Autor):
// - Cloudflare barra cliente sem identificação: toda chamada leva User-Agent.
// - DELETE é barrado (405); para excluir, POST com X-HTTP-Method-Override e corpo.
// - O Yoast aceita meta descrição e palavra-chave pelo campo `meta`, sem ajuste.
// - Autor não cria categoria nem tag: o Hub usa só as que já existem.
//
// Segredos no Supabase: WP_BLOG_URL, WP_BLOG_USUARIO e WP_BLOG_SENHA_APP (senha
// de aplicativo do WordPress, gerada no perfil do usuário).

const BASE = (Deno.env.get('WP_BLOG_URL') || 'https://blog.purepilates.com.br').replace(/\/$/, '') + '/wp-json/wp/v2'
const USUARIO = Deno.env.get('WP_BLOG_USUARIO') ?? ''
const SENHA = Deno.env.get('WP_BLOG_SENHA_APP') ?? ''
const IDENTIFICACAO = 'HubPurePilates/1.0 (+https://hub.purepilates.com.br)'

export const temAcessoAoWordPress = () => !!USUARIO && !!SENHA

async function wp<T>(caminho: string, opcoes: { metodo?: string; json?: unknown; corpo?: Uint8Array; cabecalhos?: Record<string, string> } = {}): Promise<T> {
  const cabecalhos: Record<string, string> = {
    Authorization: 'Basic ' + btoa(`${USUARIO}:${SENHA}`),
    'User-Agent': IDENTIFICACAO,
    ...(opcoes.cabecalhos ?? {}),
  }
  if (opcoes.json !== undefined) cabecalhos['Content-Type'] = 'application/json'
  const r = await fetch(BASE + caminho, {
    method: opcoes.metodo ?? 'GET',
    headers: cabecalhos,
    body: opcoes.corpo ?? (opcoes.json !== undefined ? JSON.stringify(opcoes.json) : undefined),
  })
  const texto = await r.text()
  let dados: unknown = null
  try {
    dados = texto ? JSON.parse(texto) : null
  } catch {
    // Resposta que não é da API (página do Cloudflare, por exemplo).
  }
  if (!r.ok) {
    const motivo = (dados as { message?: string } | null)?.message ?? texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 120)
    console.error(`[wordpress] ${opcoes.metodo ?? 'GET'} ${caminho} respondeu ${r.status}: ${motivo}`)
    if (r.status === 401) throw new Error('o WordPress recusou o usuário ou a senha de aplicativo')
    throw new Error(`o WordPress respondeu ${r.status}${motivo ? `: ${motivo}` : ''}`)
  }
  return dados as T
}

const igual = (a: string, b: string) =>
  a.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim() ===
  b.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const decodificar = (s: string) => s.replace(/&amp;/g, '&').replace(/&#8211;/g, '-').replace(/&[#a-z0-9]+;/gi, '')

/** O id de uma categoria existente pelo nome, ou null. */
export async function idDaCategoria(nome: string | null): Promise<number | null> {
  if (!nome) return null
  const achadas = await wp<{ id: number; name: string }[]>(`/categories?per_page=20&search=${encodeURIComponent(nome)}`)
  return achadas.find((c) => igual(decodificar(c.name), nome))?.id ?? null
}

/** Os ids das tags que já existem no blog. As que não existem ficam de fora. */
export async function idsDasTags(nomes: string[]): Promise<number[]> {
  const ids = await Promise.all(
    nomes.slice(0, 6).map(async (nome) => {
      try {
        const achadas = await wp<{ id: number; name: string }[]>(`/tags?per_page=20&search=${encodeURIComponent(nome)}`)
        return achadas.find((t) => igual(decodificar(t.name), nome))?.id ?? null
      } catch {
        return null
      }
    }),
  )
  return [...new Set(ids.filter((i): i is number => i !== null))]
}

/** Envia a capa para a biblioteca de mídia e devolve o id dela. */
export async function enviarCapa(bytes: Uint8Array, tipo: string, nomeDoArquivo: string, textoAlternativo: string): Promise<number> {
  const midia = await wp<{ id: number }>('/media', {
    metodo: 'POST',
    corpo: bytes,
    cabecalhos: { 'Content-Type': tipo, 'Content-Disposition': `attachment; filename="${nomeDoArquivo}"` },
  })
  // Texto alternativo e título da imagem: acessibilidade e SEO de imagem.
  await wp(`/media/${midia.id}`, { metodo: 'POST', json: { alt_text: textoAlternativo, title: textoAlternativo } }).catch(() => undefined)
  return midia.id
}

export interface PostDoBlog {
  titulo: string
  conteudo: string
  slug: string
  resumo: string
  palavraChave: string
  categoria: number | null
  tags: number[]
  capa: number | null
  dataGmt: string
}

/** Cria (ou atualiza, se já existir) o post agendado. Devolve o id, o status e o endereço. */
export async function agendarPost(p: PostDoBlog, postExistente?: number | null) {
  const corpo = {
    title: p.titulo,
    content: p.conteudo,
    slug: p.slug,
    excerpt: p.resumo,
    status: 'future',
    date_gmt: p.dataGmt,
    categories: p.categoria ? [p.categoria] : [],
    tags: p.tags,
    ...(p.capa ? { featured_media: p.capa } : {}),
    meta: { _yoast_wpseo_metadesc: p.resumo, _yoast_wpseo_focuskw: p.palavraChave },
  }
  return wp<{ id: number; status: string; link: string }>(postExistente ? `/posts/${postExistente}` : '/posts', { metodo: 'POST', json: corpo })
}

/** Tira o post da agenda (volta a rascunho no WordPress), sem apagar. */
export async function desagendarPost(id: number) {
  return wp<{ id: number; status: string }>(`/posts/${id}`, { metodo: 'POST', json: { status: 'draft' } })
}

/** Como o post está no WordPress agora: 'future' (agendado), 'publish' (no ar), 'draft'... */
export async function situacaoDoPost(id: number) {
  return wp<{ id: number; status: string; link: string; date_gmt: string }>(`/posts/${id}?context=edit&_fields=id,status,link,date_gmt`)
}
