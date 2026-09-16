// Lista os episódios da série "Os segredos de Pilar" direto da pasta do Drive.
//
// Espelho sem cópia (pedido do usuário em 16/09/2026): os vídeos continuam só
// no Drive e tocam pelo player do próprio Drive, então o tráfego de vídeo não
// passa pelo Supabase. Esta função só devolve a lista (alguns KB).
//
// A pasta precisa estar compartilhada como "qualquer pessoa com o link" — é
// isso que permite ler a listagem sem credencial Google e tocar o vídeo para
// quem não tem conta no Drive. Ver pasta.ts para a leitura do HTML.
//
// Subpastas viram temporadas (um nível só). Vídeos soltos na raiz formam a
// temporada sem título.
//
// Só usuário logado no Hub consegue a lista (verify_jwt ligado + getUser).
//
// PUBLICADA em 16/09/2026 no projeto evprrtvbvjnjixogjsmn.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { lerPasta, montarEpisodios, ordenarTemporadas, tituloDaTemporada, type Temporada } from './pasta.ts'

// Mesma chave de src/features/geral/segredos-pilar/usePublicacaoSegredosPilar.ts.
const CHAVE_PUBLICACAO = 'segredos-de-pilar'
const PASTA_ID =Deno.env.get('SEGREDOS_PILAR_PASTA_ID') || '1jg9kXH5QZkh-0yC1dy-Z3vAK0uNSMTOz'

async function buscarPasta(id: string) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(id)}`, {
    headers: { 'Accept-Language': 'pt-BR' },
  })
  if (!res.ok) throw new Error(`Drive respondeu ${res.status} para a pasta ${id}`)
  return lerPasta(await res.text())
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // verify_jwt aceita também a chave pública do app (anon), que está no código
  // do site. Por isso confere se há um usuário logado de verdade.
  const authHeader = req.headers.get('Authorization')
  const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader ?? '' } },
  })
  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Antes de um admin publicar para todos (linha em timeline_visibility, mesmo
  // botão da Timeline), só colaborador/admin recebe a lista — a tela esconde a
  // aba, mas é aqui que o franqueado é barrado de verdade.
  const { data: publicacao } = await supabaseClient
    .from('timeline_visibility')
    .select('is_published')
    .eq('month_key', CHAVE_PUBLICACAO)
    .maybeSingle()
  if (publicacao?.is_published !== true) {
    const [{ data: colaborador }, { data: admin }] = await Promise.all([
      supabaseClient.rpc('is_colaborador', { _user_id: user.id }),
      supabaseClient.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
    ])
    if (colaborador !== true && admin !== true) {
      return new Response(JSON.stringify({ error: 'Série ainda não publicada.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  try {
    const raiz = await buscarPasta(PASTA_ID)
    const subpastas = raiz.filter((i) => i.tipo === 'pasta')

    const temporadas: Temporada[] = [
      { titulo: null, episodios: montarEpisodios(raiz) },
      ...(await Promise.all(
        subpastas.map(async (p) => ({
          titulo: tituloDaTemporada(p.nome),
          episodios: montarEpisodios(await buscarPasta(p.id)),
        })),
      )),
    ]

    return new Response(JSON.stringify({ temporadas: ordenarTemporadas(temporadas) }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=120',
      },
    })
  } catch (err) {
    console.error('[segredos-pilar-episodios]', err)
    return new Response(JSON.stringify({ error: 'Não foi possível ler a pasta dos episódios.' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
