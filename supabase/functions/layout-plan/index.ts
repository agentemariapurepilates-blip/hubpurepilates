import { getCorsHeaders } from '../_shared/cors.ts'

// ============================================================================
// Layout Plan · Planner (Claude)
//
// Recebe TODOS os slides do carrossel + a baseline da scene (direção definida
// pelo designer pra capa) e devolve um plano por slide:
//
//  - Slide 1 (capa): respeita ao máximo a direção do designer. Só decide
//    negativeSpaceSide, textHierarchy e layoutHint.
//
//  - Slides 2+: o designer só definiu o ponto de partida. O Planner pode
//    sugerir overrides (pose, enquadramento, usar/não usar aparelho) pra que
//    cada slide tenha uma composição própria, mantendo a unidade visual
//    (mesmo avatar, uniforme, iluminação).
//
// Pra feed/story (1 slide só), comporta-se como single-slide tradicional.
// ============================================================================

interface SlideInput {
  index: number
  text: string
}

interface BaselineScene {
  avatarNome?: string
  poseDesigner?: string
  enquadramentoDesigner?: string | null
  aparelhos?: string[]
  uniformes?: string[]
  notas?: string
}

interface PlanRequest {
  format: 'feed-quadrado' | 'story-reels' | 'carrossel-feed'
  slides: SlideInput[]
  baselineScene?: BaselineScene
}

interface SlidePlan {
  index: number
  negativeSpaceSide: 'right' | 'left' | 'bottom'
  textHierarchy: 'single-strong' | 'multi-block'
  layoutHint: string
  poseOverride?: string
  enquadramentoOverride?: 'closeup' | 'detalhe' | 'plano-americano' | 'corpo-inteiro'
  useAparelho?: boolean
  reasoning?: string
}

const SYSTEM_PROMPT = `Você é o diretor criativo de carrosséis da Pure Pilates. Você NÃO escreve o prompt da foto — outro sistema faz isso. Seu trabalho:

1. Analisar o(s) texto(s) que vai(vão) na(s) arte(s)
2. Decidir composição (negative space, hierarquia de texto, dica de layout)
3. Em carrossel multi-slide, decidir variações de pose/enquadramento/aparelho por slide

═══════════════════════════════════════════════════════════════════
REGRAS GERAIS (todos os slides):
═══════════════════════════════════════════════════════════════════

NEGATIVE SPACE (lado livre):
- feed-quadrado / carrossel-feed → "right" (modelo à esquerda, texto à direita)
- story-reels → "bottom" (modelo no topo, texto embaixo)

HIERARQUIA DE TEXTO:
- 1 frase curta (até ~6 palavras) → "single-strong"
- 2+ frases ou texto longo → "multi-block"

LAYOUT HINT (1-2 frases, em PT-BR):
- Onde a modelo fica e quanto do quadro deixa livre pro texto
- Sugestão de enquadramento que funciona pro texto
- Atmosfera/tons no lado livre (pra contrastar com vermelho-vinho #a62436)
- Comece com "LAYOUT: " e seja conciso

═══════════════════════════════════════════════════════════════════
LÓGICA PRA CARROSSEL MULTI-SLIDE (slides.length > 1):
═══════════════════════════════════════════════════════════════════

SLIDE 1 (CAPA):
- Respeite TOTALMENTE a direção do designer (baselineScene).
- NÃO retorne poseOverride, enquadramentoOverride, nem useAparelho.
- Só preencha os 3 campos base (negativeSpaceSide, textHierarchy, layoutHint).

SLIDES 2+ (CONTEÚDO):
- O designer só definiu UM ponto de partida (a capa). Os demais slides você varia pra cada conteúdo respirar.
- Mantenha SEMPRE: mesmo avatar, mesmo uniforme, mesma iluminação, mesma marca-base.
- Pode (e geralmente DEVE) variar:
  · poseOverride: nova pose pensada pro tema do slide. Sempre escrever em PT-BR detalhado (ex: "Modelo em pé de perfil, alongando braços acima da cabeça, olhar suave pra cima.").
  · enquadramentoOverride: "closeup" | "detalhe" | "plano-americano" | "corpo-inteiro". Varie pra ritmo visual.
  · useAparelho: true ou false. Slides intermediários COMUMENTE ficam sem aparelho (cenário limpo) pra dar contraste à capa. Use false quando o tema do slide não pede aparelho específico.

ESTRATÉGIA NARRATIVA:
- Capa (1): poder + chamada (pose forte, talvez com aparelho)
- Intermediários: variar — closeups emotivos, perfis em alongamento, ambiente neutro
- Último slide: geralmente call-to-action visual (corpo inteiro, pose acolhedora)

═══════════════════════════════════════════════════════════════════
FORMATO DE SAÍDA (JSON exclusivo, sem markdown):
═══════════════════════════════════════════════════════════════════

{
  "plans": [
    {
      "index": <numero do slide>,
      "negativeSpaceSide": "right" | "left" | "bottom",
      "textHierarchy": "single-strong" | "multi-block",
      "layoutHint": "LAYOUT: ...",
      "poseOverride": "string opcional, só em slides 2+",
      "enquadramentoOverride": "closeup" | "detalhe" | "plano-americano" | "corpo-inteiro" (opcional, só slides 2+),
      "useAparelho": true | false (opcional, só slides 2+),
      "reasoning": "1 frase explicando suas decisões"
    }
  ]
}

Retorne um item em "plans" pra cada slide do input, na mesma ordem.`

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

    const body = (await req.json()) as PlanRequest
    if (!body.slides || body.slides.length === 0) {
      return new Response(JSON.stringify({ error: 'slides obrigatório (1+)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Constrói o user message com baseline + slides
    const baseline = body.baselineScene ?? {}
    const baselineLines: string[] = []
    if (baseline.avatarNome) baselineLines.push(`- Avatar: ${baseline.avatarNome}`)
    if (baseline.uniformes?.length) baselineLines.push(`- Uniforme(s): ${baseline.uniformes.join(', ')}`)
    if (baseline.aparelhos?.length) baselineLines.push(`- Aparelho(s) na capa: ${baseline.aparelhos.join(', ')}`)
    if (baseline.poseDesigner) baselineLines.push(`- Pose definida pra capa: ${baseline.poseDesigner}`)
    if (baseline.enquadramentoDesigner) baselineLines.push(`- Enquadramento da capa: ${baseline.enquadramentoDesigner}`)
    if (baseline.notas) baselineLines.push(`- Notas: ${baseline.notas}`)

    const baselineBlock = baselineLines.length > 0
      ? `BASELINE (direção do designer pra capa):\n${baselineLines.join('\n')}\n\n`
      : ''

    const slidesBlock = body.slides
      .map((s) => `Slide ${s.index}:\n"${s.text}"`)
      .join('\n\n')

    const userMessage = `${baselineBlock}Formato: ${body.format}\n\nSLIDES:\n${slidesBlock}\n\nGere o array "plans" com 1 item por slide, na mesma ordem.`

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!resp.ok) {
      const errBody = await resp.text()
      console.error('Anthropic plan error:', resp.status, errBody)
      return new Response(JSON.stringify({ error: 'Anthropic falhou', details: errBody }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await resp.json()
    // deno-lint-ignore no-explicit-any
    const textBlocks: any[] = (data?.content ?? []).filter((b: { type?: string }) => b?.type === 'text')
    const text: string = textBlocks.length > 0 ? (textBlocks[textBlocks.length - 1].text ?? '') : ''
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed: { plans?: SlidePlan[] }
    try {
      parsed = JSON.parse(cleaned)
    } catch (err) {
      console.error('JSON parse falhou:', err, 'raw:', cleaned.slice(0, 500))
      return new Response(JSON.stringify({ error: 'Resposta não JSON', raw: cleaned.slice(0, 500) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!Array.isArray(parsed.plans) || parsed.plans.length === 0) {
      return new Response(JSON.stringify({ error: 'plans vazio na resposta', raw: cleaned.slice(0, 500) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Garante valores default e mantém ordem
    const plans = parsed.plans.map((p) => ({
      index: p.index,
      negativeSpaceSide: p.negativeSpaceSide ?? (body.format === 'story-reels' ? 'bottom' : 'right'),
      textHierarchy: p.textHierarchy ?? 'single-strong',
      layoutHint: p.layoutHint ?? '',
      poseOverride: p.poseOverride,
      enquadramentoOverride: p.enquadramentoOverride,
      useAparelho: p.useAparelho,
      reasoning: p.reasoning ?? '',
    }))

    return new Response(
      JSON.stringify({ plans, usage: data?.usage ?? {} }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Layout plan error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
