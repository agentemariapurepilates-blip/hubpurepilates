import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  month: string
  year: string
  networks: string[]
  instructions?: string
  editorialGuide?: string
}

interface GeneratedPost {
  date: string
  network: string
  title: string
  description: string
  content_type?: string
  legenda?: string
  roteiro?: string
  texto_arte?: string
  briefing_arte?: string
}

const SYSTEM_PROMPT = `Você é um especialista sênior em planejamento editorial de redes sociais para a marca Pure Pilates (rede de estúdios de Pilates no Brasil).

## SOBRE A MARCA
- Posicionamento: "A melhor hora do seu dia". Pilates como ritual de cuidado pessoal.
- Linguagem: brasileira, próxima, encorajadora, calorosa — nunca clínica, distante ou agressiva.
- Paleta: vermelho institucional #c10230, neutros (off-white, cinza grafite).
- Hashtags institucionais obrigatórias em todas as legendas: #PurePilates #PurePilatesBR

## REGRAS DE CONTEÚDO (sempre aplicar)
1. Distribuição: espalhar postagens ao longo do mês inteiro, sem concentrar em poucos dias.
2. Datas comemorativas: INCLUIR OBRIGATORIAMENTE as datas sazonais relevantes do mês no Brasil — feriados nacionais, datas comerciais (Dia das Mães em maio, Dia dos Namorados em junho, Dia dos Pais em agosto, Black Friday em novembro, Natal em dezembro), datas de saúde (Setembro Amarelo, Outubro Rosa, Novembro Azul) e datas relacionadas ao universo Pilates/saúde/bem-estar.
3. Mix de conteúdo: variar entre educativo sobre Pilates, depoimentos/social proof, promocional sutil, datas comemorativas/sazonais, bastidores, dicas de saúde/postura, motivacional.
4. TikTok: sempre vídeo curto (Reels/Shorts) — desafios, transformações, dicas rápidas, antes/depois.
5. Instagram: variado — posts estáticos, carrosséis, Reels, depoimentos.

## FORMATO DE CADA POSTAGEM
Para cada post, gere TODOS os campos em uma única passagem:

- "date": data ISO 8601 (formato "YYYY-MM-DD")
- "network": "Instagram Studios" ou "Tik Tok" (use EXATAMENTE esses valores; NUNCA gere "Facebook Studios" — Facebook é replicado automaticamente do Instagram)
- "title": título curto (até 60 caracteres)
- "description": briefing da postagem (2-4 linhas; mencione explicitamente quando for sazonal/comemorativo)
- "content_type": "video" | "estatico" | "carrossel" — TikTok sempre é "video"; Instagram pode ser qualquer um
- "legenda": legenda completa pronta para publicação (linguagem brasileira próxima e calorosa, 1-3 emojis no máximo, terminando com 5-10 hashtags relevantes incluindo #PurePilates e #PurePilatesBR; máximo 2200 caracteres)
- "roteiro": APENAS quando content_type="video" — roteiro cena-a-cena. Formato: "Cena 1 (0-3s): ação visual + fala\\nCena 2 (3-7s): ..." Para outros tipos retorne string vazia "".
- "texto_arte": APENAS quando content_type="estatico" ou "carrossel" — frases curtas que vão DENTRO da arte:
  * Estático: 1 a 5 frases impactantes separadas por \\n (5 a 12 palavras cada)
  * Carrossel: formato "Slide 1: ...\\nSlide 2: ...\\nSlide 3: ..." (3 a 8 slides)
  * Para vídeo retorne string vazia ""
- "briefing_arte": instruções para o designer — referência visual, paleta de cores Pure (vermelho #c10230, neutros), composição, mood, elementos. Para vídeos descreva a estética. 2 a 4 frases.

## REGRAS DE TOM (vale para legenda, roteiro, textos da arte e briefings)
- Linguagem brasileira, próxima, encorajadora — nunca clínica.
- Sem promessas estéticas agressivas. Sem comparações de corpo. Sem termos como "queima de gordura" ou "barriga chapada".
- Foco em bem-estar, postura, equilíbrio, qualidade de vida e ritual de cuidado.

## FORMATO DE RESPOSTA (CRÍTICO)
Responda EXCLUSIVAMENTE com JSON válido neste formato:
{"posts": [{"date": "...", "network": "...", "title": "...", "description": "...", "content_type": "...", "legenda": "...", "roteiro": "...", "texto_arte": "...", "briefing_arte": "..."}]}

Sem texto antes ou depois. Sem markdown. Sem comentários. Sem code fences.`

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = (await req.json()) as RequestBody
    const { month, year, networks, instructions, editorialGuide } = body

    if (!month || !year || !networks?.length) {
      return new Response(
        JSON.stringify({ error: 'month, year e networks são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const monthIdx = getMonthIndex(month)
    const monthNum = String(monthIdx + 1).padStart(2, '0')
    const exampleDate = `${year}-${monthNum}-15`

    const wantInstagram = networks.includes('Instagram Studios')
    const wantFacebook = networks.includes('Facebook Studios')
    const wantTiktok = networks.includes('Tik Tok')
    const generateInstagramBlock = wantInstagram || wantFacebook

    const generationRules: string[] = []
    if (generateInstagramBlock) {
      generationRules.push('- Gere NO MÍNIMO 25 postagens com network = "Instagram Studios" (essas mesmas postagens serão replicadas para o Facebook automaticamente).')
    }
    if (wantTiktok) {
      generationRules.push('- Gere NO MÍNIMO 12 postagens com network = "Tik Tok" (pelo menos 3 por semana, distribuídas ao longo do mês).')
    }

    const buildUserMessage = (chunkLabel: string, dayRange: string, igTarget: number, tiktokTarget: number) => {
      const chunkRules: string[] = []
      if (generateInstagramBlock && igTarget > 0) {
        chunkRules.push(`- Gere EXATAMENTE ${igTarget} postagens com network = "Instagram Studios" para esta janela.`)
      }
      if (wantTiktok && tiktokTarget > 0) {
        chunkRules.push(`- Gere EXATAMENTE ${tiktokTarget} postagens com network = "Tik Tok" para esta janela.`)
      }
      return `Crie ${chunkLabel} do plano editorial de **${month} de ${year}**.

JANELA DESTE LOTE: ${dayRange} (todas as datas devem cair dentro dessa janela).
Data ISO de exemplo do mês: "${exampleDate}".

## QUANTIDADE PARA ESTE LOTE
${chunkRules.join('\n')}

${instructions ? `## INSTRUÇÕES ESPECÍFICAS DESTE MÊS\n${instructions}\n` : ''}${editorialGuide ? `## GUIA EDITORIAL DESTE MÊS\n${editorialGuide}\n` : ''}
Inclua as datas comemorativas e sazonais relevantes de ${month}/${year} que caiam dentro desta janela.

Responda agora com o JSON completo seguindo exatamente o formato definido no system prompt.`
    }

    const callAnthropicChunk = async (userMessage: string): Promise<{ posts: GeneratedPost[]; usage: Record<string, number> } > => {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 12000,
          system: [
            { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
          ],
          messages: [
            { role: 'user', content: userMessage },
          ],
        }),
      })
      if (!resp.ok) {
        const errBody = await resp.text()
        throw new Error(`Anthropic ${resp.status}: ${errBody}`)
      }
      const data = await resp.json()
      const text: string = data?.content?.[0]?.text ?? ''
      const chunkParsed = JSON.parse(stripCodeFences(text)) as { posts: GeneratedPost[] }
      return { posts: chunkParsed.posts ?? [], usage: data?.usage ?? {} }
    }

    let parsed: { posts: GeneratedPost[] } | null = null
    let providerUsed = 'none'
    let lastError = ''

    if (anthropicApiKey) {
      try {
        const lastDay = new Date(Number(year), monthIdx + 1, 0).getDate()
        const midDay = Math.floor(lastDay / 2)
        const igTotal = generateInstagramBlock ? 25 : 0
        const tiktokTotal = wantTiktok ? 12 : 0
        const igHalf = Math.ceil(igTotal / 2)
        const tiktokHalf = Math.ceil(tiktokTotal / 2)

        const msgFirst = buildUserMessage(
          'a PRIMEIRA METADE',
          `dias 1 a ${midDay}`,
          igHalf,
          tiktokHalf,
        )
        const msgSecond = buildUserMessage(
          'a SEGUNDA METADE',
          `dias ${midDay + 1} a ${lastDay}`,
          igTotal - igHalf,
          tiktokTotal - tiktokHalf,
        )

        const t0 = Date.now()
        const [first, second] = await Promise.all([
          callAnthropicChunk(msgFirst),
          callAnthropicChunk(msgSecond),
        ])
        console.log('Anthropic parallel chunks done in', Date.now() - t0, 'ms')
        console.log('Usage chunk1:', JSON.stringify(first.usage))
        console.log('Usage chunk2:', JSON.stringify(second.usage))

        parsed = { posts: [...first.posts, ...second.posts] }
        providerUsed = 'anthropic'
      } catch (err) {
        lastError = String(err)
        console.error('Anthropic failed, will try Gemini fallback:', lastError)
        parsed = null
      }
    }

    if (!parsed && geminiApiKey) {
      try {
        const fullPrompt = `${SYSTEM_PROMPT}\n\n---\n\n${userMessage}`
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`
        const geminiResp = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
              temperature: 0.8,
              responseMimeType: 'application/json',
            },
          }),
        })

        if (!geminiResp.ok) {
          const errBody = await geminiResp.text()
          throw new Error(`Gemini ${geminiResp.status}: ${errBody}`)
        }

        const geminiData = await geminiResp.json()
        const text: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        parsed = JSON.parse(stripCodeFences(text))
        providerUsed = 'gemini-fallback'
      } catch (err) {
        lastError = `${lastError} | Gemini: ${String(err)}`
        console.error('Gemini fallback also failed:', lastError)
      }
    }

    if (!parsed || !Array.isArray(parsed.posts)) {
      return new Response(
        JSON.stringify({ error: 'Falha em todos os provedores de IA', details: lastError }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let finalPosts = parsed.posts.filter((p) => {
      return p.network === 'Instagram Studios' || p.network === 'Tik Tok'
    })

    if (wantFacebook) {
      const igPosts = finalPosts.filter((p) => p.network === 'Instagram Studios')
      const fbPosts = igPosts.map((p) => ({ ...p, network: 'Facebook Studios' }))
      finalPosts = [...finalPosts, ...fbPosts]
    }

    if (!wantInstagram && wantFacebook) {
      finalPosts = finalPosts.filter((p) => p.network !== 'Instagram Studios')
    }

    if (!wantTiktok) {
      finalPosts = finalPosts.filter((p) => p.network !== 'Tik Tok')
    }

    return new Response(
      JSON.stringify({ posts: finalPosts, provider: providerUsed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getMonthIndex(name: string): number {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return months.indexOf(name)
}

function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}
