import { createClient } from 'npm:@supabase/supabase-js@2'

// Sincroniza o espelho do Instagram oficial: puxa posts publicados (/media) e
// stories ativos (/stories), baixa a mídia para o nosso Storage (a URL do CDN do
// Instagram expira) e grava em public.instagram_feed (sem duplicar).
// Chamado por pg_cron (via pg_net) — autentica por header x-cron-secret.

const GRAPH = `https://graph.facebook.com/${Deno.env.get('META_GRAPH_VERSION') || 'v21.0'}`
const IG_USER_ID = Deno.env.get('PURE_MONITOR_IG_USER_ID') || '17841401806609112'
const BUCKET = 'instagram-media'
const MAX_PER_RUN = 12  // limita downloads por execução; o cron vai recuperando o backlog

interface IgItem {
  id: string
  caption?: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
  children?: { data?: { media_type?: string; media_url?: string }[] }
}

Deno.serve(async (req) => {
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })

  const secret = Deno.env.get('INSTAGRAM_CRON_SECRET')
  if (!secret || req.headers.get('x-cron-secret') !== secret) return json({ error: 'Unauthorized' }, 401)

  const token = Deno.env.get('INSTAGRAM_PUBLISH_TOKEN')
  if (!token) return json({ error: 'INSTAGRAM_PUBLISH_TOKEN não configurado' }, 500)
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Baixa uma URL do Instagram e guarda no nosso Storage; devolve a URL pública (ou null).
  const archive = async (url: string | undefined, name: string): Promise<string | null> => {
    if (!url) return null
    try {
      const r = await fetch(url)
      if (!r.ok) return null
      const ct = r.headers.get('content-type') || 'application/octet-stream'
      const ext = ct.includes('video') || ct.includes('mp4') ? 'mp4' : ct.includes('png') ? 'png' : 'jpg'
      const bytes = new Uint8Array(await r.arrayBuffer())
      const path = `feed/${name}.${ext}`
      const { error } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: ct, upsert: true })
      if (error) return null
      return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    } catch {
      return null
    }
  }

  // ids já sincronizados (dedupe)
  const { data: existing } = await db.from('instagram_feed').select('ig_media_id')
  const known = new Set((existing ?? []).map((r: { ig_media_id: string }) => r.ig_media_id))

  const result = { posts_novos: 0, stories_novos: 0, ignorados: 0 }
  let budget = MAX_PER_RUN

  const upsertItem = async (it: IgItem, kind: 'post' | 'story') => {
    if (known.has(it.id)) return
    if (budget <= 0) { result.ignorados++; return }
    budget--

    let mediaUrl: string | null = null
    let thumb: string | null = null
    const children: { media_type?: string; media_url: string | null }[] = []

    if (it.media_type === 'CAROUSEL_ALBUM') {
      const kids = it.children?.data ?? []
      for (let i = 0; i < kids.length; i++) {
        const u = await archive(kids[i].media_url, `${it.id}_${i}`)
        children.push({ media_type: kids[i].media_type, media_url: u ?? kids[i].media_url ?? null })
      }
      mediaUrl = children[0]?.media_url ?? null
    } else {
      mediaUrl = await archive(it.media_url, it.id)
      if (it.thumbnail_url) thumb = await archive(it.thumbnail_url, `${it.id}_thumb`)
    }

    await db.from('instagram_feed').upsert({
      ig_media_id: it.id,
      kind,
      media_type: it.media_type ?? null,
      caption: it.caption ?? null,
      permalink: it.permalink ?? null,
      ig_timestamp: it.timestamp ?? null,
      media_url: mediaUrl,
      thumbnail_url: thumb,
      children,
      original_media_url: it.media_url ?? null,
      synced_at: new Date().toISOString(),
    }, { onConflict: 'ig_media_id' })

    if (kind === 'post') result.posts_novos++; else result.stories_novos++
  }

  try {
    // Posts publicados — pagina o /media para cobrir ~100 dias de histórico.
    const cutoff = new Date(Date.now() - 100 * 86400000)
    let url: string | null = `${GRAPH}/${IG_USER_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children%7Bmedia_type,media_url%7D&limit=25&access_token=${token}`
    let pages = 0
    const items: IgItem[] = []
    while (url && pages < 8) {
      const res: Response = await fetch(url)
      const j = await res.json()
      const data = (j?.data ?? []) as IgItem[]
      items.push(...data)
      const last = data[data.length - 1]
      if (!j?.paging?.next || (last?.timestamp && new Date(last.timestamp) < cutoff)) break
      url = j.paging.next as string
      pages++
    }
    for (const p of items) await upsertItem(p, 'post')

    return json({ ok: true, at: new Date().toISOString(), pages: pages + 1, listados: items.length, ...result })
  } catch (err) {
    console.error('instagram-feed-sync error:', err)
    return json({ error: 'Internal error', message: String(err), ...result }, 500)
  }
})
