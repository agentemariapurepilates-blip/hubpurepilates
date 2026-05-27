import { getCorsHeaders } from '../_shared/cors.ts'

// ============================================================================
// Layout Side · decide o LADO LIVRE da foto baseado SÓ no texto + formato.
//
// Decisão leve (Claude Haiku). Não toca em pose, enquadramento, cena. Só
// retorna pra qual lado da foto a modelo deve ficar, deixando o outro lado
// com fundo limpo pra acomodar o texto.
//
// - feed-quadrado / carrossel-feed (3:4) → 'left' ou 'right'
// - story-reels (9:16) → quase sempre 'bottom'; raramente 'left'/'right'
// ============================================================================

interface SideRequest {
  textoArte: string
  format: 'feed-quadrado' | 'story-reels' | 'carrossel-feed'
}

interface SideResponse {
  side: 'left' | 'right' | 'bottom'
  reasoning?: string
}

const SYSTEM_PROMPT = `Você decide UM lado da foto que deve ficar com fundo limpo (sem modelo/aparelho) pra acomodar texto numa arte editorial da Pure Pilates.

ENTRADA:
- textoArte: o texto que vai sobrepor a foto
- format: "feed-quadrado" (1080x1350) | "story-reels" (1080x1920) | "carrossel-feed" (1080x1350)

REGRAS:
- feed-quadrado / carrossel-feed → "right" como default (modelo à esquerda, texto à direita). Use "left" só se o texto for muito curto e visualmente fizer mais sentido.
- story-reels → "bottom" sempre (modelo no topo, texto na metade inferior).

FORMATO DE SAÍDA (JSON exclusivo, sem markdown):
{ "side": "left" | "right" | "bottom", "reasoning": "1 frase curta" }`

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

    const body = (await req.json()) as SideRequest
    if (!body.textoArte?.trim() || !body.format) {
      return new Response(JSON.stringify({ error: 'textoArte e format obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userMessage = `Formato: ${body.format}\nTexto:\n"""${body.textoArte}"""\n\nResponda APENAS com o JSON.`

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!resp.ok) {
      const errBody = await resp.text()
      console.error('Anthropic side error:', resp.status, errBody)
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

    let parsed: SideResponse
    try {
      parsed = JSON.parse(cleaned)
    } catch (err) {
      console.error('JSON parse falhou:', err, 'raw:', cleaned.slice(0, 200))
      // Fallback determinístico se Claude falhar
      parsed = {
        side: body.format === 'story-reels' ? 'bottom' : 'right',
        reasoning: 'fallback (parse falhou)',
      }
    }

    const validSides: Array<SideResponse['side']> = ['left', 'right', 'bottom']
    if (!validSides.includes(parsed.side)) {
      parsed.side = body.format === 'story-reels' ? 'bottom' : 'right'
    }

    return new Response(JSON.stringify({ ...parsed, usage: data?.usage ?? {} }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('layout-side error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
