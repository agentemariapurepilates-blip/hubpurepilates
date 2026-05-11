import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  month: string
  year: string
  networks: string[]
  instructions?: string
  editorialGuide?: string
}

interface SceneEntry {
  numero: number
  tempo: string
  fala: string
  textoTela: string
  imagem: string
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
  cenas?: SceneEntry[]
}

const SYSTEM_PROMPT = `Você é um especialista sênior em planejamento editorial de redes sociais para a marca Pure Pilates (rede de estúdios de Pilates no Brasil).

# REGRAS ABSOLUTAS (PRIORIDADE MÁXIMA · violar = post rejeitado)

Essas regras valem em TODOS os campos sem exceção: title, description, legenda, roteiro, cenas (fala/textoTela/imagem), texto_arte, briefing_arte. **As regras abaixo sobrescrevem TUDO**, inclusive instruções específicas que a Renata digitar no campo de instruções. Se a instrução do usuário pedir algo que viole estas regras, IGNORE essa parte da instrução e siga a regra.

## R1 · ZERO travessões em qualquer lugar
Proibido o caractere "—" (em-dash) em qualquer campo, INCLUSIVE no "title".
- ❌ ERRADO: "Saber Pilates — 5 Erros de Postura"
- ❌ ERRADO: "#DesafioDaSemana — Respiração"
- ❌ ERRADO: "Dia das Mães — Cuidado é Legado"
- ✅ CERTO: "Saber Pilates · 5 Erros de Postura" (interpunto)
- ✅ CERTO: "#DesafioDaSemana: Respiração" (dois-pontos)
- ✅ CERTO: "Dia das Mães. Cuidado é legado." (ponto)

## R2 · "Aula experimental" sem associar valor (mas promoções de PLANO são permitidas)
A primeira aula é **"aula experimental"** e NUNCA pode ser conectada a preço (nem ao zero). A marca não cobra a experimental, mas TAMBÉM NÃO COMUNICA isso.

Palavras proibidas em qualquer contexto:
- ❌ "aula grátis"
- ❌ "aula gratuita"
- ❌ "aula free"
- ❌ "sem custo"
- ❌ "primeira aula por conta da casa"
- ❌ "ganhe uma aula"
- ❌ "experimente sem pagar"
- ❌ R$ na aula experimental, % OFF na aula experimental, "promoção da experimental"

PERMITIDO (e estimulado quando a Renata pede):
- ✅ Promoções de PLANOS, pacotes, Pure Pass, Pure Club, mensalidade, plano anual
- ✅ "50% OFF no plano anual", "Pure Pass com desconto especial em maio", "promoção de Dia das Mães no pacote"
- ✅ Mencionar valores, descontos, % OFF QUANDO se referirem a PLANO/PACOTE/PRODUTO, não à aula experimental

Como falar da experimental:
- ✅ "Agende sua aula experimental"
- ✅ "Vem fazer sua aula experimental Pure"
- ✅ "Conhece o método na sua aula experimental"

Regra prática: se a Renata pedir "50% OFF" nas instruções, AMARRE o desconto a um PLANO/PACOTE, NUNCA à aula experimental.
Exemplo CORRETO: "Aula experimental Pure + Plano anual com 50% OFF em maio."
Exemplo ERRADO: "Aula experimental grátis + 50% OFF."

## R3 · ZERO comparações redutoras "X vs Y" ou "não é X, é Y"
- ❌ ERRADO: "Mito vs Verdade"
- ❌ ERRADO: "Não é exercício, é ritual"
- ❌ ERRADO: "Não é sobre estética, é sobre saúde"
- ❌ ERRADO: "Pilates: mito vs realidade"
- ✅ CERTO: "3 mitos sobre Pilates que travam o aluno"
- ✅ CERTO: "Pilates é ritual de cuidado diário"
- ✅ CERTO: "Como o Pilates atua na sua coluna"

## R4 · ZERO frases incompletas ou vagas
- ❌ ERRADO: "Você ainda acha que é fraco?" (fraco em quê?)
- ❌ ERRADO: "Mãe diferente" (diferente como?)
- ✅ CERTO: "Você ainda acha que o Pilates não é intenso?"
- ✅ CERTO: "A mãe que faz Pilates muda o ritmo dos dias dela"

## R5 · ZERO promessas estéticas agressivas
Proibido: "antes e depois", "queima de gordura", "barriga chapada/sequinha", comparação de corpo, "resultado rápido", "exercício leve/suave", "emagrecer rápido".

## R6 · Linguagem um para um
Sempre "você" para a pessoa, "nós" quando a marca fala em 1ª pessoa. Formalidade no técnico (Saber Pilates, anatomia); leveza em lifestyle.

# CADÊNCIA SEMANAL OBRIGATÓRIA do Instagram

Esta é a cadência DEFAULT por dia da semana. Use ela RIGOROSAMENTE, exceto quando um post comemorativo (com data ISO fornecida) precisar do slot. Comemorativa SEMPRE prevalece na data exata.

| Dia da semana | Conteúdo padrão | content_type |
|---|---|---|
| **Domingo** | #DesafioDaSemana LANÇAMENTO (princípio + exercício em equipamento) | video |
| Segunda | (sem feed; só Stories) NÃO gerar post de feed neste dia, exceto comemorativa | — |
| Terça | Saber Pilates (educacional) | carrossel |
| Quarta | A Melhor Hora (lifestyle, estúdio) | video |
| Quinta | Cultura Pilates ou UGC | carrossel |
| **Sexta** | #DesafioDaSemana ENCERRAMENTO (prova social, curadoria) | video |
| Sábado | Começa Agora (aula experimental, link na bio) | estatico |

**REGRAS DE PRIORIDADE QUANDO COMEMORATIVA CAIR EM DIA DE CADÊNCIA:**
- A comemorativa SEMPRE fica na data ISO exata fornecida no bloco "DATAS COMEMORATIVAS".
- Se a comemorativa cai no domingo (slot do Desafio), você tem 2 opções: (a) pular o lançamento do Desafio nessa semana, ou (b) fazer 2 posts no domingo (comemorativa + Desafio). NÃO mover a comemorativa para outro dia.
- Datas comemorativas usam EXATAMENTE a data ISO listada. NUNCA inventar data próxima.

# SOBRE A MARCA
- Posicionamento: "A melhor hora do seu dia". Pilates como ritual de cuidado pessoal.
- Paleta: vermelho institucional #c10230, neutros (off-white, cinza grafite).
- Hashtags institucionais obrigatórias em todas as legendas: #PurePilates #PurePilatesBR
- 5 pilares de conteúdo (siga a distribuição): A Melhor Hora · Cultura Pilates · Saber Pilates · Começa Agora · Você Traz, Você Ganha.

# REGRAS COMPLEMENTARES
1. TikTok: sempre vídeo curto (content_type = "video").
2. Sempre incluir TODAS as datas comemorativas fornecidas no bloco "DATAS COMEMORATIVAS" com a data ISO exata.
3. A Renata pode usar o campo "INSTRUÇÕES ESPECÍFICAS DESTE MÊS" para guiar tema, mood ou foco. Você aplica essas instruções DENTRO das regras R1 a R6 e da cadência acima. Se as instruções da Renata violarem alguma regra absoluta, ignore essa parte e siga a regra.

## FORMATO DE CADA POSTAGEM
Para cada post, gere TODOS os campos em uma única passagem:

- "date": data ISO 8601 (formato "YYYY-MM-DD")
- "network": "Instagram Studios" ou "Tik Tok" (use EXATAMENTE esses valores; NUNCA gere "Facebook Studios" — Facebook é replicado automaticamente do Instagram)
- "title": título curto (até 60 caracteres)
- "description": briefing da postagem (2-4 linhas; mencione explicitamente quando for sazonal/comemorativo)
- "content_type": "video" | "estatico" | "carrossel" — TikTok sempre é "video"; Instagram pode ser qualquer um
- "legenda": legenda completa pronta para publicação (linguagem brasileira, próxima e técnica conforme contexto, 1-3 emojis no máximo, terminando com 5-10 hashtags relevantes incluindo #PurePilates e #PurePilatesBR; máximo 2200 caracteres)
- "roteiro": APENAS quando content_type="video" — resumo do arco narrativo do vídeo em 2 a 4 linhas (NÃO é o roteiro cena-a-cena; isso vai em "cenas"). Para outros tipos retorne string vazia "".
- "cenas": APENAS quando content_type="video" — array obrigatório de 5 a 8 objetos, cada um com a estrutura:
  { "numero": 1, "tempo": "0:00 a 0:07", "fala": "...", "textoTela": "...", "imagem": "..." }
  Regras das cenas:
  * "numero": inteiro sequencial a partir de 1.
  * "tempo": faixa em formato "0:XX a 0:YY" (segundos). Cenas duram em média 7 a 12s; cena de abertura pode ser 5-7s; total entre 50s e 60s.
  * "fala": o que o instrutor fala em voz natural, 1 a 3 frases por cena, seguindo as regras inegociáveis.
  * "textoTela": texto curto que aparece na tela (legível em 1-2 segundos, sem ponto final, sem travessões). Não duplica a fala literalmente — sintetiza a ideia-chave.
  * "imagem": descrição visual da cena (enquadramento, ação, expressão, equipamento, gesto). 1 a 2 frases objetivas, em tom de roteiro de direção.
  A última cena fecha com CTA claro. Para content_type diferente de "video", retorne "cenas": [].
- "texto_arte": APENAS quando content_type="estatico" ou "carrossel" — frases curtas que vão DENTRO da arte:
  * Estático: 1 a 5 frases impactantes separadas por \\n (5 a 12 palavras cada)
  * Carrossel: formato "Slide 1: ...\\nSlide 2: ...\\nSlide 3: ..." (3 a 8 slides)
  * Para vídeo retorne string vazia ""
- "briefing_arte": instruções para o designer — referência visual, paleta de cores Pure (vermelho #c10230, neutros), composição, mood, elementos. Para vídeos descreva a estética geral (figurino, locação, ângulos). 2 a 4 frases.

## TEMPLATE FIXO DE ROTEIRO DE VÍDEO (use SEMPRE como base quando content_type = "video")
Cabeçalho do roteiro (fixo, não muda nunca): CLIENTE = "Estúdio"; OBSERVAÇÃO = "Vertical e horizontal"; PRODUTORA = "BONIARTE"; APRESENTAÇÃO = "Professor(a) / Porta voz Pure Pilates"; DIREÇÃO = "ANDRÉ ÂNGELO"; Tom = "Claro, acolhedor e direto"; Formato = "Vertical e horizontal". Esses metadados ficam no DOCX gerado a partir da resposta; você NÃO precisa incluí-los na resposta JSON.

Estrutura obrigatória de cada cena (a ordem dos blocos importa):
1. numero (inteiro sequencial)
2. tempo (faixa "0:XX a 0:YY")
3. fala (1 a 3 frases, voz do instrutor, em "você"/"nós", seguindo regras inegociáveis)
4. textoTela (frase curta legível em 1-2s, sem ponto final, sem travessões, sintetiza a ideia-chave da cena, NÃO duplica a fala)
5. imagem (descrição visual em tom de roteiro de direção: enquadramento, ação, expressão, equipamento, gesto. 1-2 frases objetivas)

Exemplo de uma cena no formato esperado:
{ "numero": 1, "tempo": "0:00 a 0:07", "fala": "Cliente Pure, a gente pensou em você. Sabe quando você indica a Pure para alguém porque gosta da experiência e quer que essa pessoa também se cuide? Agora isso pode virar um presente para você.", "textoTela": "Cliente Pure, a gente pensou em você", "imagem": "Professor ao lado do Barrel, olhando direto para a câmera, com postura acolhedora." }

Regras: 5 a 8 cenas por roteiro; cenas duram 7-12s em média (abertura pode ser 5-7s); total 50-60s; a última cena fecha com CTA claro.

## FORMATO DE RESPOSTA (CRÍTICO)
Responda EXCLUSIVAMENTE com JSON válido neste formato:
{"posts": [{"date": "...", "network": "...", "title": "...", "description": "...", "content_type": "...", "legenda": "...", "roteiro": "...", "cenas": [...], "texto_arte": "...", "briefing_arte": "..."}]}

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

    // ============================================================
    // RAG: Memória do agente — busca histórico do usuário e monta
    // bloco de exemplos pra calibrar tom/estilo nas próximas geracões.
    // ============================================================
    const memoryBlock = await buildMemoryBlock(supabaseClient, user.id)

    // Calendário OFICIAL de datas comemorativas brasileiras pro mês/ano em questão.
    // CRÍTICO: o modelo erra datas calculadas (ex: 2º domingo de maio). Aqui calculamos no servidor.
    const allDates = getCommemorativeDates(monthIdx, Number(year))
    const datesByRange = (fromDay: number, toDay: number) =>
      allDates.filter((d) => {
        const dia = Number(d.iso.slice(8, 10))
        return dia >= fromDay && dia <= toDay
      })

    const buildUserMessage = (chunkLabel: string, dayRange: string, fromDay: number, toDay: number, igTarget: number, tiktokTarget: number) => {
      const chunkRules: string[] = []
      if (generateInstagramBlock && igTarget > 0) {
        chunkRules.push(`- Gere EXATAMENTE ${igTarget} postagens com network = "Instagram Studios" para esta janela.`)
      }
      if (wantTiktok && tiktokTarget > 0) {
        chunkRules.push(`- Gere EXATAMENTE ${tiktokTarget} postagens com network = "Tik Tok" para esta janela.`)
      }
      const datesInWindow = datesByRange(fromDay, toDay)
      const datesBlock = datesInWindow.length > 0
        ? `## DATAS COMEMORATIVAS REAIS DESTA JANELA (USE EXATAMENTE ESTAS DATAS — NÃO INVENTE)\n${datesInWindow.map((d) => `- **${d.iso}** — ${d.nome}`).join('\n')}\n\nPara cada data acima, gere PELO MENOS uma postagem (Instagram e/ou TikTok conforme aplicável) usando EXATAMENTE essa data ISO. NUNCA invente outra data para esses eventos. Se não estiver na lista acima, NÃO mencione como data comemorativa.`
        : '## DATAS COMEMORATIVAS\nNenhuma data oficial nesta janela. Foque em conteúdo recorrente da marca.'

      return `Crie ${chunkLabel} do plano editorial de **${month} de ${year}**.

JANELA DESTE LOTE: ${dayRange} (todas as datas devem cair dentro dessa janela).
Data ISO de exemplo do mês: "${exampleDate}".

## QUANTIDADE PARA ESTE LOTE
${chunkRules.join('\n')}

${datesBlock}

${instructions ? `## INSTRUÇÕES ESPECÍFICAS DESTE MÊS\n${instructions}\n` : ''}
Aplique RIGOROSAMENTE o tom, vocabulário e regras do Guia Editorial Pure Pilates fornecido no system prompt.

Responda agora com o JSON completo seguindo exatamente o formato definido no system prompt.`
    }

    // System prompt blocks: cada bloco tem seu cache_control próprio.
    // 1) Regras estáveis da marca.
    // 2) Guia Editorial completo (~50K tokens quando presente).
    // 3) Memória do agente — exemplos do que funcionou/não funcionou (RAG).
    // Anthropic permite até 4 cache_control breakpoints; usamos no máximo 3.
    const systemBlocks: Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }> = [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ]
    if (editorialGuide && editorialGuide.trim().length > 0) {
      systemBlocks.push({
        type: 'text',
        text: `## GUIA EDITORIAL OFICIAL DA PURE PILATES (siga RIGOROSAMENTE)\n\n${editorialGuide.trim()}`,
        cache_control: { type: 'ephemeral' },
      })
    }
    if (memoryBlock && memoryBlock.trim().length > 0) {
      systemBlocks.push({
        type: 'text',
        text: memoryBlock,
        cache_control: { type: 'ephemeral' },
      })
    }
    console.log('System blocks:', systemBlocks.length, '| memory chars:', memoryBlock.length)

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
          system: systemBlocks,
          // Web search server-side: Claude decide quando buscar (max 2 buscas por chunk).
          // Útil pra trends atuais, referências culturais, datas que não estão no calendário fixo.
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }],
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
      // Com tool use, content pode ter blocks de tipo "text", "tool_use", "web_search_tool_result".
      // Pegamos o ULTIMO bloco de texto (resposta final do Claude após buscas).
      // deno-lint-ignore no-explicit-any
      const textBlocks: any[] = (data?.content ?? []).filter((b: { type?: string }) => b?.type === 'text')
      const text: string = textBlocks.length > 0 ? (textBlocks[textBlocks.length - 1].text ?? '') : ''
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
          1,
          midDay,
          igHalf,
          tiktokHalf,
        )
        const msgSecond = buildUserMessage(
          'a SEGUNDA METADE',
          `dias ${midDay + 1} a ${lastDay}`,
          midDay + 1,
          lastDay,
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
        const guideBlock = editorialGuide?.trim()
          ? `\n\n## GUIA EDITORIAL OFICIAL DA PURE PILATES (siga RIGOROSAMENTE)\n${editorialGuide.trim()}\n`
          : ''
        const geminiUserMsg = `Crie o plano editorial COMPLETO de **${month} de ${year}**.\nData ISO de exemplo: "${exampleDate}".\n\n## QUANTIDADE OBRIGATÓRIA\n${generationRules.join('\n')}\n\n${instructions ? `## INSTRUÇÕES ESPECÍFICAS DESTE MÊS\n${instructions}\n` : ''}\nResponda com o JSON completo.`
        const fullPrompt = `${SYSTEM_PROMPT}${guideBlock}\n\n---\n\n${geminiUserMsg}`
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

interface DataComemorativa {
  iso: string
  nome: string
}

// Calcula o N-ésimo dia-da-semana do mês (ex: 2º domingo de maio).
// dow: 0=domingo, 1=segunda, ..., 6=sábado.
function nthWeekdayOfMonth(year: number, monthIdx: number, dow: number, n: number): string {
  const first = new Date(Date.UTC(year, monthIdx, 1))
  const firstDow = first.getUTCDay()
  let dayOfMonth = 1 + ((dow - firstDow + 7) % 7) + (n - 1) * 7
  const last = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate()
  if (dayOfMonth > last) dayOfMonth = last
  const mm = String(monthIdx + 1).padStart(2, '0')
  const dd = String(dayOfMonth).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

// Calcula a Páscoa (algoritmo Anonymous Gregorian).
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

function fmtIso(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86400000)
}

function getCommemorativeDates(monthIdx: number, year: number): DataComemorativa[] {
  const items: DataComemorativa[] = []
  const easter = easterSunday(year)
  const carnavalTerca = addDays(easter, -47)
  const carnavalSegunda = addDays(easter, -48)
  const sextaSanta = addDays(easter, -2)
  const corpusChristi = addDays(easter, 60)

  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = (m: number, d: number) => `${year}-${pad(m + 1)}-${pad(d)}`

  // Datas fixas + móveis por mês (Brasil + universo Pilates/saúde).
  switch (monthIdx) {
    case 0: // Janeiro
      items.push({ iso: iso(0, 1), nome: 'Confraternização Universal (feriado nacional)' })
      items.push({ iso: iso(0, 6), nome: 'Dia de Reis' })
      items.push({ iso: iso(0, 25), nome: 'Aniversário de São Paulo' })
      break
    case 1: // Fevereiro
      if (carnavalSegunda.getUTCMonth() === 1) items.push({ iso: fmtIso(carnavalSegunda), nome: 'Carnaval (segunda)' })
      if (carnavalTerca.getUTCMonth() === 1) items.push({ iso: fmtIso(carnavalTerca), nome: 'Carnaval (terça-feira)' })
      items.push({ iso: iso(1, 14), nome: "Valentine's Day (referência internacional)" })
      break
    case 2: // Março
      if (carnavalSegunda.getUTCMonth() === 2) items.push({ iso: fmtIso(carnavalSegunda), nome: 'Carnaval (segunda)' })
      if (carnavalTerca.getUTCMonth() === 2) items.push({ iso: fmtIso(carnavalTerca), nome: 'Carnaval (terça-feira)' })
      items.push({ iso: iso(2, 8), nome: 'Dia Internacional da Mulher' })
      items.push({ iso: iso(2, 21), nome: 'Dia Internacional contra Discriminação Racial' })
      if (sextaSanta.getUTCMonth() === 2) items.push({ iso: fmtIso(sextaSanta), nome: 'Sexta-feira Santa' })
      if (easter.getUTCMonth() === 2) items.push({ iso: fmtIso(easter), nome: 'Páscoa' })
      break
    case 3: // Abril
      if (sextaSanta.getUTCMonth() === 3) items.push({ iso: fmtIso(sextaSanta), nome: 'Sexta-feira Santa' })
      if (easter.getUTCMonth() === 3) items.push({ iso: fmtIso(easter), nome: 'Páscoa' })
      items.push({ iso: iso(3, 6), nome: 'Dia Mundial da Atividade Física' })
      items.push({ iso: iso(3, 7), nome: 'Dia Mundial da Saúde' })
      items.push({ iso: iso(3, 21), nome: 'Tiradentes (feriado nacional)' })
      items.push({ iso: iso(3, 22), nome: 'Descobrimento do Brasil' })
      break
    case 4: // Maio
      items.push({ iso: iso(4, 1), nome: 'Dia do Trabalhador (feriado nacional)' })
      items.push({ iso: nthWeekdayOfMonth(year, 4, 0, 2), nome: 'Dia das Mães (2º domingo de maio)' })
      items.push({ iso: iso(4, 13), nome: 'Dia da Abolição da Escravatura' })
      items.push({ iso: iso(4, 28), nome: 'Dia Internacional pela Saúde da Mulher' })
      if (corpusChristi.getUTCMonth() === 4) items.push({ iso: fmtIso(corpusChristi), nome: 'Corpus Christi' })
      break
    case 5: // Junho
      items.push({ iso: iso(5, 5), nome: 'Dia Mundial do Meio Ambiente' })
      items.push({ iso: iso(5, 12), nome: 'Dia dos Namorados' })
      items.push({ iso: iso(5, 24), nome: 'Dia de São João' })
      if (corpusChristi.getUTCMonth() === 5) items.push({ iso: fmtIso(corpusChristi), nome: 'Corpus Christi' })
      break
    case 6: // Julho
      items.push({ iso: iso(6, 9), nome: 'Revolução Constitucionalista (SP)' })
      items.push({ iso: iso(6, 26), nome: 'Dia dos Avós' })
      // mês de férias escolares — bom pra conteúdo família/criança
      break
    case 7: // Agosto
      items.push({ iso: nthWeekdayOfMonth(year, 7, 0, 2), nome: 'Dia dos Pais (2º domingo de agosto)' })
      items.push({ iso: iso(7, 11), nome: 'Dia do Estudante' })
      items.push({ iso: iso(7, 22), nome: 'Dia do Folclore' })
      items.push({ iso: iso(7, 31), nome: 'Dia do Nutricionista' })
      // Agosto Dourado (amamentação)
      break
    case 8: // Setembro
      items.push({ iso: iso(8, 7), nome: 'Independência do Brasil (feriado nacional)' })
      items.push({ iso: iso(8, 10), nome: 'Dia Mundial de Prevenção ao Suicídio (Setembro Amarelo)' })
      items.push({ iso: iso(8, 21), nome: 'Dia Mundial do Alzheimer' })
      items.push({ iso: iso(8, 22), nome: 'Dia da Primavera' })
      // Setembro Amarelo: o mês inteiro
      break
    case 9: // Outubro
      items.push({ iso: iso(9, 12), nome: 'Dia das Crianças / Nossa Senhora Aparecida (feriado nacional)' })
      items.push({ iso: iso(9, 15), nome: 'Dia do Professor' })
      items.push({ iso: iso(9, 28), nome: 'Dia do Servidor Público' })
      items.push({ iso: iso(9, 31), nome: 'Halloween (referência cultural)' })
      // Outubro Rosa: o mês inteiro
      break
    case 10: { // Novembro
      items.push({ iso: iso(10, 2), nome: 'Finados (feriado nacional)' })
      items.push({ iso: iso(10, 15), nome: 'Proclamação da República (feriado nacional)' })
      items.push({ iso: iso(10, 20), nome: 'Dia da Consciência Negra' })
      // Black Friday = última sexta de novembro
      const lastDay = new Date(Date.UTC(year, 11, 0))
      const lastDow = lastDay.getUTCDay()
      const blackFridayDay = lastDay.getUTCDate() - ((lastDow - 5 + 7) % 7)
      items.push({ iso: iso(10, blackFridayDay), nome: 'Black Friday' })
      items.push({ iso: iso(10, blackFridayDay + 3), nome: 'Cyber Monday' })
      // Novembro Azul: o mês inteiro
      break
    }
    case 11: // Dezembro
      items.push({ iso: iso(11, 8), nome: 'Dia da Imaculada Conceição' })
      items.push({ iso: iso(11, 24), nome: 'Véspera de Natal' })
      items.push({ iso: iso(11, 25), nome: 'Natal (feriado nacional)' })
      items.push({ iso: iso(11, 31), nome: 'Véspera de Ano Novo / Réveillon' })
      break
  }

  // Ordena por dia
  return items.sort((a, b) => a.iso.localeCompare(b.iso))
}

function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

interface FieldFeedbackEntry {
  status?: 'approved' | 'rejected'
  motivo?: string
  at?: string
}

interface FieldFeedback {
  legenda?: FieldFeedbackEntry
  roteiro?: FieldFeedbackEntry
  texto_arte?: FieldFeedbackEntry
  briefing_arte?: FieldFeedbackEntry
}

interface MemoryRow {
  title: string | null
  network: string | null
  content_type: string | null
  legenda: string | null
  roteiro: string | null
  texto_arte: string | null
  briefing_arte: string | null
  feedback_motivo: string | null
  field_feedback: FieldFeedback | null
  versao_editada: { legenda?: string; roteiro?: string; texto_arte?: string; briefing_arte?: string } | null
  refinements: Array<{ prompt: string; after?: { legenda?: string | null; roteiro?: string | null; texto_arte?: string | null; briefing_arte?: string | null }; at: string }> | null
}

const fieldLabels: Record<keyof FieldFeedback, string> = {
  legenda: 'Legenda',
  roteiro: 'Roteiro / Cenas do vídeo',
  texto_arte: 'Texto na arte',
  briefing_arte: 'Briefing da arte',
}

// deno-lint-ignore no-explicit-any
async function buildMemoryBlock(supabaseClient: any, userId: string): Promise<string> {
  try {
    // Aprovados recentes (positivos): só os últimos 8 com legenda preenchida.
    const { data: approved } = await supabaseClient
      .from('editorial_posts')
      .select('title, network, content_type, legenda, roteiro, texto_arte')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .not('legenda', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(8)

    // Reprovados com motivo (negativos): últimos 8 com feedback explicito.
    const { data: rejected } = await supabaseClient
      .from('editorial_posts')
      .select('title, network, content_type, legenda, feedback_motivo')
      .eq('user_id', userId)
      .eq('status', 'rejected')
      .not('feedback_motivo', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(8)

    // Reprovações por CAMPO (granular): posts com field_feedback contendo status='rejected'
    // em algum dos campos. Limitamos a 30 posts pra agrupar depois por campo.
    const { data: fieldRejectedRows } = await supabaseClient
      .from('editorial_posts')
      .select('title, network, content_type, legenda, roteiro, texto_arte, briefing_arte, field_feedback')
      .eq('user_id', userId)
      .not('field_feedback', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(30)

    // Edições manuais (deltas IA -> versão final): últimas 6.
    const { data: edited } = await supabaseClient
      .from('editorial_posts')
      .select('title, network, content_type, legenda, roteiro, texto_arte, briefing_arte, versao_editada')
      .eq('user_id', userId)
      .not('versao_editada', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(6)

    // Conversas com o agente (refinações por prompt): últimos 8 posts com refinements.
    const { data: refinedRows } = await supabaseClient
      .from('editorial_posts')
      .select('title, network, content_type, refinements')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(40)

    const sections: string[] = []

    if (Array.isArray(approved) && approved.length > 0) {
      const items = (approved as MemoryRow[]).map((r, i) => {
        const parts = [`### Aprovado ${i + 1} — ${r.network ?? '?'} (${r.content_type ?? 'n/a'})`]
        if (r.title) parts.push(`Título: ${r.title}`)
        if (r.legenda) parts.push(`Legenda:\n${r.legenda}`)
        if (r.roteiro) parts.push(`Roteiro:\n${r.roteiro}`)
        if (r.texto_arte) parts.push(`Texto na arte:\n${r.texto_arte}`)
        return parts.join('\n')
      })
      sections.push(`## ✅ EXEMPLOS APROVADOS (siga ESTE tom, ritmo e vocabulário)\n\n${items.join('\n\n---\n\n')}`)
    }

    if (Array.isArray(rejected) && rejected.length > 0) {
      const items = (rejected as MemoryRow[]).map((r, i) => {
        const parts = [`### Reprovado ${i + 1} · ${r.network ?? '?'} (${r.content_type ?? 'n/a'})`]
        if (r.title) parts.push(`Título: ${r.title}`)
        if (r.legenda) parts.push(`Legenda original (que foi reprovada):\n${r.legenda}`)
        parts.push(`MOTIVO DA REPROVAÇÃO: ${r.feedback_motivo}`)
        return parts.join('\n')
      })
      sections.push(`## ❌ EXEMPLOS REPROVADOS NO POST INTEIRO (NÃO repita esses padrões, leia o motivo)\n\n${items.join('\n\n---\n\n')}`)
    }

    // Reprovações granulares por campo: agrupa por campo.
    if (Array.isArray(fieldRejectedRows) && fieldRejectedRows.length > 0) {
      const grouped: Record<keyof FieldFeedback, Array<{ row: MemoryRow; motivo: string }>> = {
        legenda: [], roteiro: [], texto_arte: [], briefing_arte: [],
      }
      for (const row of fieldRejectedRows as MemoryRow[]) {
        const ff = row.field_feedback
        if (!ff) continue
        for (const key of ['legenda', 'roteiro', 'texto_arte', 'briefing_arte'] as Array<keyof FieldFeedback>) {
          const entry = ff[key]
          if (entry?.status === 'rejected' && entry.motivo) {
            grouped[key].push({ row, motivo: entry.motivo })
          }
        }
      }
      for (const key of ['legenda', 'roteiro', 'texto_arte', 'briefing_arte'] as Array<keyof FieldFeedback>) {
        const bucket = grouped[key].slice(0, 6)
        if (bucket.length === 0) continue
        const items = bucket.map((b, i) => {
          const parts = [`### Reprovado ${i + 1} · ${b.row.network ?? '?'} (${b.row.content_type ?? 'n/a'})`]
          if (b.row.title) parts.push(`Post: ${b.row.title}`)
          const fieldContent = b.row[key as 'legenda' | 'roteiro' | 'texto_arte' | 'briefing_arte']
          if (fieldContent) parts.push(`Conteúdo reprovado:\n${fieldContent}`)
          parts.push(`MOTIVO: ${b.motivo}`)
          return parts.join('\n')
        })
        sections.push(`## ❌ CAMPO REPROVADO · ${fieldLabels[key]} (NÃO repita esses padrões em ${fieldLabels[key]})\n\n${items.join('\n\n---\n\n')}`)
      }
    }

    if (Array.isArray(edited) && edited.length > 0) {
      const items = (edited as MemoryRow[]).map((r, i) => {
        const parts = [`### Edição ${i + 1} — ${r.network ?? '?'} (${r.content_type ?? 'n/a'})`]
        if (r.title) parts.push(`Título: ${r.title}`)
        if (r.legenda && r.versao_editada?.legenda) {
          parts.push(`Legenda IA (original):\n${r.legenda}`)
          parts.push(`Legenda VERSÃO FINAL (corrigida pela usuária — é ASSIM que ela quer):\n${r.versao_editada.legenda}`)
        }
        if (r.roteiro && r.versao_editada?.roteiro) {
          parts.push(`Roteiro IA:\n${r.roteiro}`)
          parts.push(`Roteiro VERSÃO FINAL:\n${r.versao_editada.roteiro}`)
        }
        if (r.texto_arte && r.versao_editada?.texto_arte) {
          parts.push(`Texto arte IA:\n${r.texto_arte}`)
          parts.push(`Texto arte VERSÃO FINAL:\n${r.versao_editada.texto_arte}`)
        }
        if (r.briefing_arte && r.versao_editada?.briefing_arte) {
          parts.push(`Briefing arte IA:\n${r.briefing_arte}`)
          parts.push(`Briefing arte VERSÃO FINAL:\n${r.versao_editada.briefing_arte}`)
        }
        return parts.join('\n')
      })
      sections.push(`## ✏️ EDIÇÕES MANUAIS (delta IA para versão final, aprenda o ajuste)\n\n${items.join('\n\n---\n\n')}`)
    }

    // Refinações por prompt — peso ALTO porque é feedback direto da Renata em linguagem natural
    if (Array.isArray(refinedRows)) {
      const refinedFiltered = (refinedRows as MemoryRow[]).filter((r) => Array.isArray(r.refinements) && r.refinements!.length > 0).slice(0, 8)
      if (refinedFiltered.length > 0) {
        const items = refinedFiltered.map((r, i) => {
          const lastRefinement = r.refinements![r.refinements!.length - 1]
          const parts = [`### Conversa ${i + 1} — ${r.network ?? '?'} (${r.content_type ?? 'n/a'})`]
          if (r.title) parts.push(`Post: ${r.title}`)
          parts.push(`Histórico (mais recente por último):`)
          r.refinements!.forEach((ref, j) => {
            parts.push(`  Turn ${j + 1}: A Renata pediu: "${ref.prompt}"`)
          })
          if (lastRefinement.after?.legenda) {
            parts.push(`Resultado final aceito (legenda):\n${lastRefinement.after.legenda}`)
          }
          return parts.join('\n')
        })
        sections.push(`## 💬 REFINAÇÕES POR PROMPT (instruções diretas da Renata sobre posts específicos — aplique padrões similares)\n\n${items.join('\n\n---\n\n')}`)
      }
    }

    if (sections.length === 0) return ''

    return `## MEMÓRIA DO AGENTE — HISTÓRICO DESTA USUÁRIA
Esta memória vem das últimas decisões da Renata sobre conteúdos gerados por você. Use isso como CALIBRAÇÃO DE TOM:
- Repita o estilo dos APROVADOS.
- Evite os padrões dos REPROVADOS (e leia o motivo).
- Para EDIÇÕES, compare a versão IA com a versão final dela e aprenda o ajuste.

${sections.join('\n\n')}`
  } catch (err) {
    console.error('Falha ao montar memoryBlock:', err)
    return ''
  }
}

