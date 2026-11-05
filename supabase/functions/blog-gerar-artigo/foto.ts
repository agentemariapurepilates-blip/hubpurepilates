// Gera a foto da capa com o Gemini e guarda no bucket público blog-capas.
// O título por cima é do Hub (CapaBlog.tsx), não daqui.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { promptDaFoto } from './foto-prompt.ts'
import type { Marca } from './marcas.ts'

const CHAVE = Deno.env.get('BLOG_GEMINI_KEY') || Deno.env.get('GEMINI_API_KEY')
// O Pro fez as três fotos aprovadas. O Flash entra se o Pro falhar.
const MODELOS = [Deno.env.get('BLOG_MODELO_FOTO') || 'gemini-3-pro-image-preview', 'gemini-3.1-flash-image-preview']

async function pedirImagem(modelo: string, prompt: string): Promise<{ bytes: Uint8Array; tipo: string }> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${CHAVE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // A moldura da capa é quase quadrada (600 x 640).
      generationConfig: { imageConfig: { aspectRatio: '1:1' } },
    }),
  })
  if (!r.ok) {
    const detalhe = (await r.text()).slice(0, 300)
    console.error(`[blog-foto] ${modelo} respondeu ${r.status}: ${detalhe}`)
    throw new Error(`o Gemini não gerou a foto (${r.status})`)
  }
  const dados = await r.json()
  const partes = dados?.candidates?.[0]?.content?.parts ?? []
  const imagem = partes.find((p: Record<string, unknown>) => p.inlineData || p.inline_data)
  const inline = imagem?.inlineData ?? imagem?.inline_data
  if (!inline?.data) {
    throw new Error(`o Gemini não devolveu imagem (${dados?.candidates?.[0]?.finishReason ?? 'sem motivo'})`)
  }
  const bin = atob(inline.data)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return { bytes, tipo: inline.mimeType ?? inline.mime_type ?? 'image/png' }
}

/** Gera, guarda e devolve o endereço público da foto. */
export async function gerarFotoDaCapa(
  admin: SupabaseClient,
  artigo: { id: string; marca: Marca; cena_foto: string | null; titulo: string; tema: string },
): Promise<string> {
  const prompt = promptDaFoto(artigo.marca, artigo.cena_foto, artigo.titulo || artigo.tema)
  let ultimoErro: unknown = null
  for (const modelo of MODELOS) {
    try {
      const { bytes, tipo } = await pedirImagem(modelo, prompt)
      const extensao = tipo.includes('jpeg') ? 'jpg' : 'png'
      // Nome novo a cada foto: "gerar outra" não fica preso no cache do navegador.
      const caminho = `${artigo.id}/${Date.now()}.${extensao}`
      const { error } = await admin.storage.from('blog-capas').upload(caminho, bytes, { contentType: tipo, upsert: true })
      if (error) throw new Error(`não consegui guardar a foto: ${error.message}`)
      return admin.storage.from('blog-capas').getPublicUrl(caminho).data.publicUrl
    } catch (e) {
      ultimoErro = e
    }
  }
  throw ultimoErro instanceof Error ? ultimoErro : new Error('não consegui gerar a foto')
}
