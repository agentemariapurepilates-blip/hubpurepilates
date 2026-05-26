import { getCorsHeaders } from '../_shared/cors.ts'

// ============================================================================
// Layout Compose · Designer (Claude)
//
// Recebe texto + formato + hierarquia + negative space e devolve um JSON com
// as zonas de texto (posição, tamanho, estilo) pra renderização editável no
// frontend (react-rnd). A foto é renderizada como background pelo frontend.
// ============================================================================

interface ComposeRequest {
  textoArte: string
  format: 'feed-quadrado' | 'story-reels' | 'carrossel-feed'
  textHierarchy: 'single-strong' | 'multi-block'
  negativeSpaceSide: 'right' | 'left' | 'bottom'
}

interface Zone {
  id: string
  kind: 'headline' | 'apoio' | 'pill' | 'remate'
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
  pill?: {
    borderColor: string
    borderWidth: number
    borderRadius: number
    paddingX: number
    paddingY: number
  }
}

interface ComposeResponse {
  zones: Zone[]
  canvasW: number
  canvasH: number
}

const FORMAT_DIMENSIONS: Record<ComposeRequest['format'], { w: number; h: number }> = {
  'feed-quadrado': { w: 1080, h: 1350 },
  'story-reels': { w: 1080, h: 1920 },
  'carrossel-feed': { w: 1080, h: 1350 },
}

const SYSTEM_PROMPT = `Você é o designer editorial da Pure Pilates. Recebe um texto e devolve a estrutura de zonas de texto (posições, tamanhos, estilos) que vão sobrepor uma foto numa arte editorial premium.

═══════════════════════════════════════════════════════════════════
SISTEMA DE COORDENADAS:
═══════════════════════════════════════════════════════════════════
- Container é canvasW × canvasH px (você recebe os valores).
- Origem (0,0) no canto SUPERIOR ESQUERDO.
- x cresce pra direita, y cresce pra baixo.
- Cada zona tem x, y, w, h em PIXELS absolutos.

═══════════════════════════════════════════════════════════════════
DESIGN SYSTEM PURE PILATES:
═══════════════════════════════════════════════════════════════════
- Fonte: SEMPRE Montserrat (já carregada no frontend).
- Cor primária: #a62436 (vermelho vinho)
- Cor secundária texto: #2b2b2b (cinza escuro) ou #ffffff (branco)
- Peso 800 (ExtraBold) → headline e remate
- Peso 500 (Medium) → apoio e texto da pill
- Italic 500 → texto interno da pill

═══════════════════════════════════════════════════════════════════
TIPOS DE ZONA E TAMANHOS — REGRAS DE HIERARQUIA TIPOGRÁFICA
═══════════════════════════════════════════════════════════════════

Hierarquia OBRIGATÓRIA (proporção entre tamanhos):
- HEADLINE >> REMATE > APOIO ≥ PILL
- Headline deve ser AO MENOS 3x maior que apoio/pill
- Headline deve ser AO MENOS 2.2x maior que remate
- NUNCA fazer apoio/pill maior que headline

kind: "headline"
- 1 a 3 palavras de impacto
- fontWeight: 800, italic: false
- fontSize: 10-14% da altura do canvas
  · Canvas 1350h → 135-190px (use 150px como default)
  · Canvas 1920h → 192-270px (use 220px como default)
- color: "#a62436"
- lineHeight: 0.95
- letterSpacing: -2 a -4 (apertado)
- LIMITE MÁXIMO: 200px no feed, 280px no story. NUNCA passar disso.

kind: "apoio"
- Frase curta de complemento (3-6 palavras)
- fontWeight: 500, italic: false
- fontSize: ~2.5-3.2% da altura (32-44px em 1350h, use 38px default)
- color: "#2b2b2b" ou "#a62436"
- lineHeight: 1.2
- Posicionar 8-16px ABAIXO da headline (gap pequeno mas visível, NÃO grudado)

kind: "pill"
- Frase secundária lírico-explicativa (5+ palavras)
- fontWeight: 500, italic: TRUE
- fontSize: ~2-2.8% da altura (28-38px em 1350h, use 32px default)
- color: "#2b2b2b" (preferencial — bom em fundo bege/off-white) ou "#ffffff" (só se foto for escura)
- lineHeight: 1.3
- pill: { borderColor: "#2b2b2b" (combina com texto), borderWidth: 1.5, borderRadius: 999, paddingX: 28, paddingY: 12 }
- Largura: ajustar pra texto caber idealmente em 1 linha (no máx 2). Calcular pelo nº de letras: w ≈ (qtd_letras_da_linha_mais_longa * fontSize * 0.5) + 2*paddingX
- Posicionar 16-32px ABAIXO da headline/apoio

kind: "remate"
- Fechamento curto (2-3 mini-frases paralelas tipo "Menos X. Mais Y. Mais Z.")
- fontWeight: 800, italic: false
- fontSize: ~3.5-4.5% da altura (47-61px em 1350h, use 54px default)
- color: "#a62436"
- lineHeight: 1.05
- letterSpacing: -1 a -2
- Posicionar no rodapé da área de texto, AO MENOS 80px de margem inferior

═══════════════════════════════════════════════════════════════════
DIMENSIONAMENTO CRÍTICO DA ZONA — APLICA A TODAS:
═══════════════════════════════════════════════════════════════════

REGRA 1 · A largura (w) PRECISA acomodar a palavra mais longa SEM quebrar:
- ExtraBold (800): largura mínima ≈ qtd_letras * fontSize * 0.55
- Medium (500): largura mínima ≈ qtd_letras * fontSize * 0.50
- Medium Italic: largura mínima ≈ qtd_letras * fontSize * 0.48
- Se não couber → REDUZA o fontSize, NUNCA deixe quebrar dentro de palavra.

REGRA 2 · Limites do canvas:
- x + w deve ser ≤ canvasW (zona NÃO pode estourar borda direita)
- y + h deve ser ≤ canvasH (zona NÃO pode estourar borda inferior)
- Sempre deixar margem mínima de 60px de cada lado do canvas

REGRA 3 · Altura (h):
- h = fontSize * lineHeight * nº_de_linhas + (kind==='pill' ? 2*paddingY : 0) + 4px de folga
- Não ser GENEROSO no h sem motivo — h em excesso = espaço vazio dentro da zona = texto desalinhado

REGRA 4 · Espaçamento entre zonas:
- Entre headline e apoio: 8-16px
- Entre apoio e pill: 16-32px
- Antes do remate: pelo menos 60px de gap em relação à zona anterior
- Nada de "buracos" gigantes verticais no meio da composição.

═══════════════════════════════════════════════════════════════════
COMO PROCESSAR O textoArte — guia de classificação:
═══════════════════════════════════════════════════════════════════
O textoArte é a ÚNICA fonte de texto. Não invente nada.

Identifique as partes do texto e classifique:

→ headline: palavra(s)/expressão curtíssima de impacto (1-3 palavras)
  Ex: "Mãe", "primeiro passo", "Mais leve", "Cuide-se"

→ apoio: continuação MUITO CURTA da headline, conectando direto a ela (3-6 palavras, sem pontuação grande)
  Ex: "você cuida de tudo.", "comece agora", "do seu jeito"
  NÃO use apoio se a frase tem 7+ palavras OU é claramente um complemento lírico — use pill.

→ pill (USE LIBERALMENTE pra frases secundárias lírico-explicativas, 5+ palavras):
  Use pill SEMPRE QUE houver uma frase que NÃO é a headline E NÃO é um remate-trinca paralelo.
  É o "default" pra qualquer frase complementar com 5+ palavras.
  Ex: "Mas hoje, se vista para cuidar de você."
       "para ter a melhor hora do seu dia!"
       "respira fundo e começa de novo."
       "porque autocuidado também é estilo."
  Características: tom lírico/poético/explicativo, frase completa em si, geralmente termina em ponto ou exclamação.

→ remate: 2-3 mini-frases paralelas separadas por ponto (estrutura "X. Y. Z.")
  Ex: "Menos culpa. Mais Pilates. Mais estilo."
       "Mais foco. Menos pressa."
  Só use remate quando ENXERGAR essa estrutura paralela. Caso contrário, a frase final vira pill.

REGRAS DE PRIORIZAÇÃO:
- Se o texto tem só 1 frase curta (≤4 palavras), gere SÓ headline.
- Se tem 2 partes (uma curta + uma longa), use headline + pill (não apoio).
- Se tem 2 partes ambas curtas, use headline + apoio.
- Se tem 3+ partes, use headline + apoio + pill + remate conforme aplicável (cada um aparece no máx 1 vez).
- Mantenha pontuação, capitalização e acentuação EXATAS do textoArte.

═══════════════════════════════════════════════════════════════════
POSICIONAMENTO (negativeSpaceSide):
═══════════════════════════════════════════════════════════════════
- "right": modelo à esquerda, texto na METADE DIREITA. zonas com x >= 50% do canvasW.
- "left": modelo à direita, texto na METADE ESQUERDA. zonas com x até ~50% do canvasW.
- "bottom": modelo no topo, texto na METADE DE BAIXO. zonas com y >= 50% do canvasH.

Sempre deixe ~5-8% de margem das bordas do canvas.
NÃO sobrepor texto sobre rosto/mãos da modelo.

═══════════════════════════════════════════════════════════════════
PROIBIÇÕES ABSOLUTAS:
═══════════════════════════════════════════════════════════════════
- NÃO crie zonas com texto que não esteja em textoArte.
- NÃO escreva "PURE PILATES", "Pure", "Pilates" ou nome de marca se não estiver em textoArte.
- NÃO inclua selo/logo/monograma de marca em nenhuma forma.
- NÃO use background preenchido (rgba branca, etc) — só a pill outline é permitida.

═══════════════════════════════════════════════════════════════════
FORMATO DE SAÍDA (JSON exclusivo, sem markdown):
═══════════════════════════════════════════════════════════════════
{
  "zones": [
    {
      "id": "z1",
      "kind": "headline" | "apoio" | "pill" | "remate",
      "text": "string",
      "x": number,
      "y": number,
      "w": number,
      "h": number,
      "fontWeight": 800 | 500,
      "italic": boolean,
      "fontSize": number,
      "color": "#hexstring",
      "textAlign": "left" | "center" | "right",
      "lineHeight": number,
      "letterSpacing": number,
      "pill": { "borderColor": "#hex", "borderWidth": 2, "borderRadius": 999, "paddingX": 32, "paddingY": 14 }
    }
  ]
}

Inclua "pill" SÓ quando kind === "pill". Inclua "letterSpacing" só quando relevante (headline e remate). "id" deve ser único por zona.`

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

    const body = (await req.json()) as ComposeRequest
    if (!body.textoArte?.trim()) {
      return new Response(JSON.stringify({ error: 'textoArte obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const dim = FORMAT_DIMENSIONS[body.format]
    const userMessage = `Gere as zonas de texto da arte.

Texto na arte: ${body.textoArte}

Formato: ${body.format}
canvasW: ${dim.w}
canvasH: ${dim.h}
Hierarquia: ${body.textHierarchy}
Negative space (lado livre): ${body.negativeSpaceSide}

Responda APENAS com o JSON.`

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
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!resp.ok) {
      const errBody = await resp.text()
      console.error('Anthropic compose error:', resp.status, errBody)
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

    let parsed: { zones?: Zone[] }
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

    const response: ComposeResponse = {
      zones: parsed.zones,
      canvasW: dim.w,
      canvasH: dim.h,
    }

    return new Response(
      JSON.stringify({ ...response, usage: data?.usage ?? {} }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Layout compose error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
