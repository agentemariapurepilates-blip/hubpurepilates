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
// LIBERAÇÃO POR EPISÓDIO (23/09/2026): a aba é de todo mundo, mas cada vídeo só
// abre depois que um admin o solta (tabela segredos_pilar_liberacoes). Para quem
// não pode ver, a função devolve o episódio SEM o id do Drive e sem a capa —
// aparece como "Em breve" e não há endereço de vídeo para achar no navegador.
// Colaborador e admin veem tudo, para preparar a publicação.
//
// Só usuário logado no Hub consegue a lista (verify_jwt ligado + getUser).
//
// PUBLICADA em 16/09/2026 no projeto evprrtvbvjnjixogjsmn.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { lerPasta, montarEpisodios, ordenarTemporadas, tituloDaTemporada, type Episodio, type Temporada } from './pasta.ts'

const PASTA_ID = Deno.env.get('SEGREDOS_PILAR_PASTA_ID') || '1jg9kXH5QZkh-0yC1dy-Z3vAK0uNSMTOz'

type EpisodioResposta = {
  /** Identidade na tela. É o id do Drive quando a pessoa pode assistir. */
  chave: string
  numero: number | null
  titulo: string
  capa: string | null
  /** Nulo para quem ainda não pode assistir. */
  driveId: string | null
  liberado: boolean
}

async function buscarPasta(id: string) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(id)}`, {
    headers: { 'Accept-Language': 'pt-BR' },
  })
  if (!res.ok) throw new Error(`Drive respondeu ${res.status} para a pasta ${id}`)
  return lerPasta(await res.text())
}

/** Esconde o vídeo de quem não pode ver: sem id do Drive, sem capa, sem endereço. */
function paraResposta(
  episodios: Episodio[],
  temporada: string | null,
  liberados: Set<string>,
  vePreview: boolean,
): EpisodioResposta[] {
  return episodios.map((ep, i) => {
    const liberado = liberados.has(ep.driveId)
    const podeAssistir = liberado || vePreview
    return {
      chave: podeAssistir ? ep.driveId : `bloqueado:${temporada ?? 'raiz'}:${i}`,
      numero: ep.numero,
      titulo: ep.titulo,
      capa: podeAssistir ? ep.capa : null,
      driveId: podeAssistir ? ep.driveId : null,
      liberado,
    }
  })
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

  // Quem monta a série (colaborador/admin) enxerga os episódios ainda fechados,
  // para conferir antes de soltar.
  const [{ data: colaborador }, { data: admin }, { data: liberacoes }] = await Promise.all([
    supabaseClient.rpc('is_colaborador', { _user_id: user.id }),
    supabaseClient.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
    supabaseClient.from('segredos_pilar_liberacoes').select('drive_id'),
  ])
  const vePreview = colaborador === true || admin === true
  const liberados = new Set((liberacoes ?? []).map((l: { drive_id: string }) => l.drive_id))

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

    const resposta = ordenarTemporadas(temporadas).map((t) => ({
      titulo: t.titulo,
      episodios: paraResposta(t.episodios, t.titulo, liberados, vePreview),
    }))

    return new Response(JSON.stringify({ temporadas: resposta, vePreview }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        // Curto e privado: a resposta muda assim que um episódio é liberado.
        'Cache-Control': 'private, max-age=30',
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
