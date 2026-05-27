import { getCorsHeaders } from '../_shared/cors.ts'

// ============================================================================
// Layout Compose HTML · Designer (Claude Sonnet)
//
// Slides 2+ de carrossel: SEM foto. O slide é renderizado com background
// colorido + tipografia + adornos manuscritos. Claude decide:
//  - cor de fundo (da paleta Pure: bege, branco, vinho, off-white)
//  - zonas de texto (headline/apoio/remate + underline)
//
// A unidade visual com a capa (slide 1, que tem foto) é mantida pela paleta
// e tipografia. Os slides intermediários têm "respiro" — sem foto, espaço
// pra mensagem reflexiva.
// ============================================================================

interface ComposeHtmlRequest {
  textoArte: string
  format: 'feed-quadrado' | 'story-reels' | 'carrossel-feed'
  slideIndex: number
  totalSlides: number
}

interface Zone {
  id: string
  kind: 'headline' | 'apoio' | 'remate'
  text: string
  x: number
  y: number
  w: number
  h: number
  fontWeight: 800 | 500
  italic: boolean
  fontSize: number
  color: string
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing?: number
  underline?: {
    variant: 'wave' | 'arch' | 'double'
    color: string
    thickness: number
    widthRatio: number
    position: 'above' | 'below'
    gap: number
  }
}

interface ComposeHtmlResponse {
  zones: Zone[]
  canvasW: number
  canvasH: number
  backgroundColor: string
}

const FORMAT_DIMENSIONS: Record<ComposeHtmlRequest['format'], { w: number; h: number }> = {
  'feed-quadrado': { w: 1080, h: 1350 },
  'story-reels': { w: 1080, h: 1920 },
  'carrossel-feed': { w: 1080, h: 1350 },
}

const SYSTEM_PROMPT = `Você é o designer editorial da Pure Pilates desenhando um SLIDE DE CARROSSEL SEM FOTO. Esse slide é puro HTML/CSS: background colorido + tipografia + adornos manuscritos. Sua tarefa é escolher a cor de fundo E desenhar as zonas de texto.

═══════════════════════════════════════════════════════════════════
PALETA OBRIGATÓRIA (escolha 1 pra background):
═══════════════════════════════════════════════════════════════════
- "#f5ebd9" — bege quente (default; mood acolhedor)
- "#ffffff" — branco puro (mood clean/minimalista)
- "#fdf6ec" — off-white cremoso (mood elegante)
- "#a62436" — vermelho vinho (mood intenso, USE COM PARCIMÔNIA — só 1 slide vinho por carrossel)
- "#2b2b2b" — preto/cinza escuro (mood premium, raramente — só pra contraste forte)

REGRA: alterne os backgrounds entre slides pra dar ritmo visual ao carrossel.
Se você é o slide N, considere: a capa (slide 1) é colorida (foto), os slides
2+ devem variar entre bege/branco/off-white/vinho pra criar pulse visual.

═══════════════════════════════════════════════════════════════════
SISTEMA DE COORDENADAS:
═══════════════════════════════════════════════════════════════════
- Container é canvasW × canvasH px (você recebe os valores).
- Origem (0,0) no canto SUPERIOR ESQUERDO.
- x cresce pra direita, y cresce pra baixo.
- Cada zona tem x, y, w, h em PIXELS absolutos.

═══════════════════════════════════════════════════════════════════
TIPOGRAFIA:
═══════════════════════════════════════════════════════════════════
- Fonte: SEMPRE Montserrat (já carregada no frontend).
- Peso 800 (ExtraBold) → headline e remate
- Peso 500 (Medium) → apoio

CORES DE TEXTO POR BACKGROUND:
- Em "#f5ebd9" / "#ffffff" / "#fdf6ec" → headline em "#a62436", apoio em "#2b2b2b"
- Em "#a62436" (fundo vinho) → headline em "#ffffff", apoio em "#fdf6ec"
- Em "#2b2b2b" (fundo escuro) → headline em "#a62436", apoio em "#ffffff"

═══════════════════════════════════════════════════════════════════
TIPOS DE ZONA — REGRAS DE HIERARQUIA
═══════════════════════════════════════════════════════════════════

Hierarquia: HEADLINE >> REMATE > APOIO. Headline AO MENOS 3x maior que apoio.

kind: "headline" (1-3 palavras de impacto):
- fontWeight: 800, italic: false
- fontSize: 8-14% da altura do canvas (canvas 1350h → 110-190px, default 150px;
  canvas 1920h → 155-270px, default 200px)
- lineHeight: 0.95
- letterSpacing: -2 a -4
- LIMITE: 200px no feed, 280px no story
- Quebra em 2 linhas via "\\n" se necessário

kind: "apoio" (frase 3-8 palavras):
- fontWeight: 500, italic: false (default)
- fontSize: 3-4.5% da altura (40-60px em 1350h, default 48px)
- lineHeight: 1.2
- Posicionar 16-32px ABAIXO da headline

kind: "remate" (2-3 mini-frases paralelas tipo "X. Y. Z."):
- fontWeight: 800, italic: false
- fontSize: 3.5-4.5% da altura (47-61px em 1350h, default 54px)
- lineHeight: 1.05
- Posicionar no rodapé da composição

═══════════════════════════════════════════════════════════════════
POSICIONAMENTO (sem foto, espaço total disponível):
═══════════════════════════════════════════════════════════════════
- Sem modelo na imagem, o texto pode usar QUASE TODO o canvas.
- Centralize o bloco textual VERTICALMENTE (entre 25%-75% da altura).
- Horizontal: alinhe à esquerda (textAlign: "left", x começando em ~80px) OU
  centralize (textAlign: "center", zona centralizada no canvas) — escolha
  conforme a quantidade de texto.
- Texto MUITO curto (1-2 palavras) → centralize sempre.
- Texto longo → alinhe à esquerda pra leitura confortável.
- Sempre deixe ~6-8% de margem de cada borda.

═══════════════════════════════════════════════════════════════════
SUBLINHADO MANUSCRITO (underline):
═══════════════════════════════════════════════════════════════════
- Adicione "underline" em EXATAMENTE 1 zona — preferencialmente o apoio.
- Se a arte tem só 1 zona (headline isolada), o underline vai nela.
- variant: "wave" (default), "arch" (clássico), "double" (raro, ênfase forte)
- color: MESMA cor do texto da zona
- thickness: 4-6
- widthRatio: 0.85 default (sublinha quase toda a frase)
- position: "below"
- gap: 6 default (frontend adiciona clearance pra descenders automaticamente)

═══════════════════════════════════════════════════════════════════
COMO CLASSIFICAR textoArte:
═══════════════════════════════════════════════════════════════════
- Headline: palavra(s) de impacto curtíssima (1-3 palavras)
- Apoio: complemento ou frase lírica (3-8 palavras)
- Remate: 2-3 mini-frases paralelas separadas por ponto

REGRAS:
- Se só 1 frase curta (≤4 palavras) → SÓ headline (com underline)
- Se 2 partes → headline + apoio (underline no apoio)
- Se 3+ partes → headline + apoio + remate
- Mantenha pontuação, capitalização e acentuação EXATAS do textoArte
- NÃO invente texto. NÃO escreva "PURE PILATES" / nome de marca se não estiver no textoArte

═══════════════════════════════════════════════════════════════════
DIMENSIONAMENTO CRÍTICO:
═══════════════════════════════════════════════════════════════════
- Largura w da zona deve acomodar a palavra mais longa: w ≥ qtd_letras * fontSize * 0.6
- Se não couber, REDUZA fontSize ou quebre em 2 linhas (\\n no text)
- x + w ≤ canvasW; y + h ≤ canvasH; margem mínima 60px de cada borda

═══════════════════════════════════════════════════════════════════
FORMATO DE SAÍDA (JSON exclusivo, sem markdown):
═══════════════════════════════════════════════════════════════════
{
  "backgroundColor": "#hex",
  "zones": [
    {
      "id": "z1",
      "kind": "headline" | "apoio" | "remate",
      "text": "string",
      "x": number,
      "y": number,
      "w": number,
      "h": number,
      "fontWeight": 800 | 500,
      "italic": boolean,
      "fontSize": number,
      "color": "#hex",
      "textAlign": "left" | "center" | "right",
      "lineHeight": number,
      "letterSpacing": number,
      "underline": { "variant": "wave" | "arch" | "double", "color": "#hex", "thickness": 5, "widthRatio": 0.85, "position": "below", "gap": 6 }
    }
  ]
}

Inclua "underline" em EXATAMENTE 1 zona. "id" único por zona.`

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json()) as ComposeHtmlRequest
    if (!body.textoArte?.trim()) {
      return new Response(JSON.stringify({ error: 'textoArte obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const dim = FORMAT_DIMENSIONS[body.format]
    const userMessageText = `Gere o slide HTML.

Texto: ${body.textoArte}

Formato: ${body.format}
canvasW: ${dim.w}
canvasH: ${dim.h}
Slide ${body.slideIndex} de ${body.totalSlides} no carrossel (a capa é a slide 1).

Escolha um background da paleta (varie em relação aos outros slides pra criar ritmo) e gere as zonas. Responda APENAS com o JSON.`

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessageText }],
      }),
    })

    if (!resp.ok) {
      const errBody = await resp.text()
      console.error('Anthropic compose-html error:', resp.status, errBody)
      return new Response(JSON.stringify({ error: 'Anthropic falhou', details: errBody }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await resp.json()
    // deno-lint-ignore no-explicit-any
    const textBlocks: any[] = (data?.content ?? []).filter((b: { type?: string }) => b?.type === 'text')
    const rawText: string = textBlocks.length > 0 ? (textBlocks[textBlocks.length - 1].text ?? '') : ''
    const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed: { zones?: Zone[]; backgroundColor?: string }
    try {
      parsed = JSON.parse(cleaned)
    } catch (err) {
      console.error('JSON parse falhou:', err, 'raw:', cleaned.slice(0, 500))
      return new Response(JSON.stringify({ error: 'Resposta não JSON', raw: cleaned.slice(0, 500) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!Array.isArray(parsed.zones) || parsed.zones.length === 0) {
      return new Response(JSON.stringify({ error: 'Zonas vazias na resposta', raw: cleaned.slice(0, 500) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response: ComposeHtmlResponse = {
      zones: parsed.zones,
      canvasW: dim.w,
      canvasH: dim.h,
      backgroundColor: parsed.backgroundColor ?? '#f5ebd9',
    }

    return new Response(JSON.stringify({ ...response, usage: data?.usage ?? {} }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('layout-compose-html error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
