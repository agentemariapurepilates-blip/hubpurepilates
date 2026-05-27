import { getCorsHeaders } from '../_shared/cors.ts'

// ============================================================================
// Layout Compose · Designer (Claude Sonnet com vision)
//
// Recebe texto + formato + IMAGEM (base64) e devolve um JSON com as zonas
// de texto. Claude VÊ a imagem e decide:
//  - onde há espaço livre real (não obrigação, observação)
//  - onde tem rosto/mãos/aparelho pra não cobrir
//  - cor de texto que contrasta com a região específica
//  - hierarquia textual (headline/apoio/remate) + underline na zona certa
//
// negativeSpaceSide vem como DICA (do layout-side), mas o Claude pode ajustar
// vendo a imagem real.
// ============================================================================

interface ComposeRequest {
  textoArte: string
  format: 'feed-quadrado' | 'story-reels' | 'carrossel-feed'
  negativeSpaceSide: 'right' | 'left' | 'bottom'
  photoBase64: string
  photoMimeType: string
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
  // Sublinhado desenhado à mão (SVG). Aplicado opcionalmente à zona de maior
  // peso visual da composição (normalmente headline).
  underline?: {
    variant: 'wave' | 'arch' | 'double'
    color: string
    thickness: number
    widthRatio: number
    position: 'above' | 'below'
    gap: number
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

const SYSTEM_PROMPT = `Você é o designer editorial da Pure Pilates. Recebe a FOTO (imagem como input visual) + o texto que vai sobrepor a foto, e devolve a estrutura de zonas de texto (posições, tamanhos, estilos) que farão uma arte editorial premium.

═══════════════════════════════════════════════════════════════════
ANÁLISE VISUAL DA FOTO — FAÇA PRIMEIRO:
═══════════════════════════════════════════════════════════════════

Antes de propor zonas, examine a foto e identifique:

1) ONDE ESTÁ A MODELO (e suas partes críticas):
   - Rosto, mãos, contorno do corpo, aparelho que ela está usando.
   - Essas áreas SÃO PROIBIDAS pra texto. NÃO sobreponha texto sobre o rosto,
     mãos ou aparelho.

2) ONDE HÁ ESPAÇO LIVRE REAL:
   - Procure áreas de fundo limpo (parede, piso, ciclorama). Esse é o
     território do texto.
   - O parâmetro "negativeSpaceSide" do request é uma DICA do lado livre
     esperado, mas confie no que VÊ. Se a foto ficou com espaço melhor em
     outro lado, ajuste.

3) TOM/LUMINOSIDADE DA ÁREA LIVRE:
   - Fundo claro/bege/areia → texto deve ser ESCURO (#2b2b2b ou #a62436)
     pra contraste.
   - Fundo escuro/saturado → texto deve ser CLARO (#ffffff).
   - Pense zona-por-zona — se a headline cai em região escura mas o apoio
     cai em região clara, podem ter cores diferentes.

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
- Peso 500 (Medium) → apoio (textos secundários/líricos)
- Italic 500 → use apenas pra frases muito líricas/poéticas (raro)

═══════════════════════════════════════════════════════════════════
TIPOS DE ZONA E TAMANHOS — REGRAS DE HIERARQUIA TIPOGRÁFICA
═══════════════════════════════════════════════════════════════════

Hierarquia OBRIGATÓRIA (proporção entre tamanhos):
- HEADLINE >> REMATE > APOIO
- Headline deve ser AO MENOS 3x maior que apoio
- Headline deve ser AO MENOS 2.2x maior que remate
- NUNCA fazer apoio maior que headline

kind: "headline"
- 1 a 3 palavras de impacto
- fontWeight: 800, italic: false
- fontSize: 8-12% da altura do canvas (mais conservador — vai estourar se for grande demais)
  · Canvas 1350h → 110-160px (use 130px como default)
  · Canvas 1920h → 155-230px (use 180px como default)
- color: "#a62436"
- lineHeight: 0.95
- letterSpacing: -2 a -4 (apertado)
- LIMITE MÁXIMO: 180px no feed, 240px no story. NUNCA passar disso.
- ANTES DE FIXAR fontSize, valide: qtd_letras_da_palavra_mais_longa * fontSize * 0.6 deve caber em (w - 40). Se não cabe, REDUZA fontSize OU quebre em 2 linhas via "\\n" no text.

kind: "apoio"
- Frase curta-média de complemento (3-8 palavras). Pode ser conexão direta
  com a headline OU frase lírico-explicativa secundária.
- fontWeight: 500 ou 700 (medium/bold), italic: false (preferencial)
- fontSize: ~3-4.5% da altura (40-60px em 1350h, use 48px default — apoio
  precisa de peso visual suficiente pra carregar o underline com charme)
- color: PREFIRA "#2b2b2b" (preto/cinza escuro) sobre fundo claro/bege;
  use "#ffffff" só se foto for escura/saturada. EVITE "#a62436" (vermelho)
  no apoio — vermelho é da headline, apoio é o contraste.
- lineHeight: 1.2
- Posicionar 16-32px ABAIXO da headline

kind: "remate"
- Fechamento curto (2-3 mini-frases paralelas tipo "Menos X. Mais Y. Mais Z.")
- fontWeight: 800, italic: false
- fontSize: ~3.5-4.5% da altura (47-61px em 1350h, use 54px default)
- color: "#a62436"
- lineHeight: 1.05
- letterSpacing: -1 a -2
- Posicionar no rodapé da área de texto, AO MENOS 80px de margem inferior

═══════════════════════════════════════════════════════════════════
SUBLINHADO MANUSCRITO (underline) — adorno decorativo
═══════════════════════════════════════════════════════════════════

A composição tem uma hierarquia clara:
  1. HEADLINE (vermelho, bold, dominante) — SEM underline
  2. APOIO (preto/escuro, peso médio-bold) — RECEBE o underline

O underline é um traço SVG manuscrito que sublinha a frase de apoio,
criando a sensação "mensagem chamativa escrita à mão". Esse adorno é o
que dá charme à composição e é o que diferencia uma arte de campanha
profissional de um template genérico.

REGRA DE OURO:
- Se a arte tem APOIO → underline VAI NO APOIO (sempre — esse é o padrão).
- Se a arte tem SÓ headline (sem apoio) → underline pode ir na headline
  como exceção.
- NUNCA aplique underline em 2 zonas ao mesmo tempo (vira poluído).
- NUNCA aplique underline no headline se já tiver apoio — vermelho-em-vermelho
  dominante perde força.
- Em remate (3 frases paralelas), NÃO use underline — o ritmo das frases
  já é forte demais sozinho.
- Em carrossel: cada slide tem 1 underline (no apoio do slide, em geral).

Estrutura do underline:
- variant: "wave" (curva ondulada sutil — mais elegante, default),
           "arch" (arco ascendente simples — clássico manuscrito),
           "double" (dois traços sobrepostos — mais peso, use raramente
           pra forte ênfase em frases curtas)
- color: MESMA cor do texto da zona (#2b2b2b preto se o apoio for preto,
         #a62436 vermelho se a exceção for sublinhar a headline)
- thickness: 4-6 (4 default; 5-6 pra apoio com fontSize > 50; 8 só pra
             headline gigante na exceção)
- widthRatio: 0.5-0.95 — fração da largura da zona que o traço ocupa.
              Use 0.85 como default pra apoio (sublinhar quase toda a
              frase). 0.5-0.7 pra ênfase pontual em headline.
- position: "below" como default. "above" praticamente nunca (raríssimo).
- gap: 4-10 (4 default; o frontend automaticamente adiciona clearance
       extra pra descenders das letras, então valores baixos funcionam).

EXEMPLOS:
- "Sua aula experimental | está esperando."
  → headline: "Sua aula experimental" (vermelho, bold, sem underline)
  → apoio: "está esperando." (preto, medium, UNDERLINE no apoio)
- "Mais leve | comece agora"
  → headline: "Mais leve" (vermelho, bold, sem underline)
  → apoio: "comece agora" (preto, medium, UNDERLINE no apoio)
- "Pure" (1 palavra só, sem apoio)
  → headline: "Pure" (vermelho, bold, UNDERLINE na headline como exceção)

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
- h = fontSize * lineHeight * nº_de_linhas + (underline ? max(thickness*4, 16) + gap : 0) + 4px de folga
- Não ser GENEROSO no h sem motivo — h em excesso = espaço vazio dentro da zona = texto desalinhado

REGRA 4 · Espaçamento entre zonas:
- Entre headline e apoio: 8-24px
- Antes do remate: pelo menos 60px de gap em relação à zona anterior
- Se uma zona tem underline, adicione +8px de gap pra próxima zona (pra não grudar no traço)
- Nada de "buracos" gigantes verticais no meio da composição.

═══════════════════════════════════════════════════════════════════
COMO PROCESSAR O textoArte — guia de classificação:
═══════════════════════════════════════════════════════════════════
O textoArte é a ÚNICA fonte de texto. Não invente nada.

Identifique as partes do texto e classifique:

→ headline: palavra(s)/expressão curtíssima de impacto (1-3 palavras)
  Ex: "Mãe", "primeiro passo", "Mais leve", "Cuide-se"

→ apoio: continuação/complemento da headline (3-8 palavras). Pode ser
  conexão direta ("comece agora", "do seu jeito") OU frase lírico-explicativa
  ("respira fundo e começa de novo.", "porque autocuidado também é estilo.").
  Tom: completivo, pode ter pontuação.

→ remate: 2-3 mini-frases paralelas separadas por ponto (estrutura "X. Y. Z.")
  Ex: "Menos culpa. Mais Pilates. Mais estilo."
       "Mais foco. Menos pressa."
  Só use remate quando ENXERGAR essa estrutura paralela. Caso contrário, a frase final vira apoio.

REGRAS DE PRIORIZAÇÃO:
- Se o texto tem só 1 frase curta (≤4 palavras), gere SÓ headline (com underline pra dar charme).
- Se tem 2 partes (uma curta + uma longa), use headline + apoio.
- Se tem 3+ partes, use headline + apoio + remate conforme aplicável (cada um aparece no máx 1 vez).
- SEMPRE escolha 1 zona (geralmente headline) pra receber "underline" — esse adorno é o que dá charme.
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
- NÃO use background preenchido (rgba branca, etc) — o ÚNICO elemento gráfico permitido é o underline manuscrito (SVG).

═══════════════════════════════════════════════════════════════════
FORMATO DE SAÍDA (JSON exclusivo, sem markdown):
═══════════════════════════════════════════════════════════════════
{
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
      "color": "#hexstring",
      "textAlign": "left" | "center" | "right",
      "lineHeight": number,
      "letterSpacing": number,
      "underline": { "variant": "wave" | "arch" | "double", "color": "#hex", "thickness": 6, "widthRatio": 0.75, "position": "below", "gap": 6 }
    }
  ]
}

Inclua "underline" em EXATAMENTE 1 zona por arte (a de maior peso visual). Inclua "letterSpacing" só quando relevante (headline e remate). "id" deve ser único por zona.`

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
    if (!body.photoBase64 || !body.photoMimeType) {
      return new Response(JSON.stringify({ error: 'photoBase64 e photoMimeType obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const dim = FORMAT_DIMENSIONS[body.format]
    const userMessageText = `Analise a foto anexada e gere as zonas de texto da arte.

Texto na arte: ${body.textoArte}

Formato: ${body.format}
canvasW: ${dim.w}
canvasH: ${dim.h}
Dica de lado livre (do step anterior): ${body.negativeSpaceSide}

Lembre-se:
1) Veja onde está a modelo/aparelho na foto e EVITE sobrepor texto lá.
2) Decida a hierarquia (headline / apoio / remate) lendo o textoArte.
3) Escolha as cores baseado no tom REAL do fundo onde cada zona cairá.
4) Adicione "underline" em 1 zona (preferencialmente apoio quando existir).

Responda APENAS com o JSON das zonas.`

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
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: body.photoMimeType,
                  data: body.photoBase64,
                },
              },
              { type: 'text', text: userMessageText },
            ],
          },
        ],
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
