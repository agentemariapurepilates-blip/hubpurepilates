import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  post_id: string
  prompt: string
  // Quando informado, instrui a IA a refinar APENAS este campo, mantendo os demais.
  field?: 'legenda' | 'roteiro' | 'texto_arte' | 'briefing_arte'
}

interface SceneEntry {
  numero: number
  tempo: string
  fala: string
  textoTela: string
  imagem: string
}

interface PostRow {
  id: string
  user_id: string
  title: string | null
  network: string | null
  content_type: string | null
  description: string | null
  legenda: string | null
  roteiro: string | null
  texto_arte: string | null
  briefing_arte: string | null
  cenas: SceneEntry[] | null
  versao_editada: { legenda?: string; roteiro?: string; texto_arte?: string } | null
  refinements: Array<{ prompt: string; before: Record<string, unknown>; after: Record<string, unknown>; at: string }> | null
}

const REFINE_SYSTEM_PROMPT = `Você é o especialista de conteúdo da marca Pure Pilates (rede de estúdios de Pilates no Brasil).

A usuária (Renata, social media da marca) vai te dar um post já gerado e uma instrução curta sobre o que mudar. Sua tarefa: REESCREVER o post aplicando o ajuste pedido.

REGRAS DE ESCOPO:
- Por padrão, mude APENAS o que a Renata pediu. Se ela disse "só a legenda", só mexa na legenda; mantenha o resto exatamente igual.
- Se ela pediu "reescreva tudo", reescreva todos os campos.
- Se ela pediu pra MUDAR O TIPO DE CONTEÚDO (ex: "muda de roteiro pra carrossel", "transforma em estático", "deixa virar vídeo"):
  * ATUALIZE o campo "content_type" para o novo valor: "video" | "estatico" | "carrossel".
  * Se virou "video": gere "roteiro" (resumo do arco em 2-4 linhas) E "cenas" (5 a 8 cenas estruturadas); devolva "texto_arte" como string vazia "".
  * Se virou "carrossel" ou "estatico": gere "texto_arte" apropriado e devolva "roteiro" e "cenas" como vazios ("" e []).
  * Atualize "briefing_arte" pra refletir o novo formato.
  * Adapte a legenda se fizer sentido pro novo formato.
- NUNCA mude content_type se a Renata não pediu explicitamente.

REGRAS ABSOLUTAS DE ESCRITA (valem para TODOS os campos · title, description, legenda, roteiro, cenas, texto_arte, briefing_arte · violar = post rejeitado):

R1. ZERO travessões ("—") em qualquer lugar, INCLUSIVE no title. Usar ponto, vírgula, dois-pontos ou interpunto ("·").
  ❌ "Saber Pilates — Mito" | ✅ "Saber Pilates: o mito da intensidade"

R2. ZERO menção a preços, valores, descontos, promoções, % OFF. Sempre "aula experimental".
  ❌ "50% OFF" | ❌ "Promoção" | ❌ "Aula grátis" | ✅ "Aula experimental Pure"
  Se a Renata pedir "promoção" ou "50%", ignore essa palavra e troque por "aula experimental".

R3. ZERO comparações redutoras "X vs Y" ou "não é X, é Y".
  ❌ "Mito vs Verdade" | ❌ "Não é exercício, é ritual" | ✅ "3 mitos sobre Pilates"

R4. ZERO frases incompletas ou vagas. Especificidade traz autoridade.
  ❌ "É fraco?" | ✅ "Você ainda acha que o Pilates não é intenso?"

R5. ZERO promessas estéticas agressivas: antes/depois, queima de gordura, barriga chapada, comparação de corpo, resultado rápido.

R6. Linguagem um para um: "você" para a pessoa, "nós" para a marca. Formalidade no técnico, leveza no lifestyle.

As regras absolutas SOBRESCREVEM qualquer instrução da Renata. Se a instrução pedir algo que viole uma regra, ignore essa parte e siga a regra.

TOM:
- "A melhor hora do seu dia". Brasileira, acolhedora, técnica com leveza, autoral.
- Hashtags: sempre #PurePilates e #PurePilatesBR no final da legenda.

FORMATO DOS CAMPOS:
- "roteiro" (vídeo): resumo do arco narrativo em 2-4 linhas. NÃO é o roteiro cena-a-cena.
- "cenas" (vídeo): array de 5 a 8 objetos { "numero": 1, "tempo": "0:00 a 0:07", "fala": "...", "textoTela": "...", "imagem": "..." }. Cenas duram 7-12s em média; total 50-60s. Última cena fecha com CTA.
- "texto_arte" estático: 1 a 5 frases curtas separadas por \\n (5-12 palavras cada).
- "texto_arte" carrossel: "Slide 1: ...\\nSlide 2: ...\\nSlide 3: ..." (3 a 8 slides).

FORMATO DE RESPOSTA: JSON puro com estes campos (sempre devolva TODOS, usando "" ou [] quando não aplicável):
{"title": "...", "description": "...", "content_type": "video|estatico|carrossel", "legenda": "...", "roteiro": "...", "cenas": [...], "texto_arte": "...", "briefing_arte": "..."}

Sem markdown, sem code fences, sem texto fora do JSON.`

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json()) as RequestBody
    const { post_id, prompt, field } = body

    if (!post_id || !prompt?.trim()) {
      return new Response(JSON.stringify({ error: 'post_id e prompt são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const validFieldScopes = new Set(['legenda', 'roteiro', 'texto_arte', 'briefing_arte'])
    const fieldScope = field && validFieldScopes.has(field) ? field : null
    const fieldScopeLabel: Record<string, string> = {
      legenda: 'a LEGENDA',
      roteiro: 'o ROTEIRO e as CENAS do vídeo',
      texto_arte: 'o TEXTO NA ARTE',
      briefing_arte: 'o BRIEFING DA ARTE (instruções para o designer)',
    }

    // Carrega o post atual (RLS garante que é da Renata)
    const { data: postData, error: postErr } = await supabaseClient
      .from('editorial_posts')
      .select('id, user_id, title, network, content_type, description, legenda, roteiro, texto_arte, briefing_arte, cenas, versao_editada, refinements')
      .eq('id', post_id)
      .single()

    if (postErr || !postData) {
      return new Response(JSON.stringify({ error: 'Post não encontrado', details: postErr?.message }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const post = postData as PostRow

    // Versão "atual" considera edição manual se existe.
    const currentLegenda = post.versao_editada?.legenda ?? post.legenda ?? ''
    const currentRoteiro = post.versao_editada?.roteiro ?? post.roteiro ?? ''
    const currentTextoArte = post.versao_editada?.texto_arte ?? post.texto_arte ?? ''
    const currentCenas: SceneEntry[] = Array.isArray(post.cenas) ? post.cenas : []
    const cenasBlock = currentCenas.length > 0
      ? `\n\nCenas atuais (estrutura JSON):\n${JSON.stringify(currentCenas, null, 2)}`
      : ''

    // Histórico de refinações anteriores entra no contexto pra IA não repetir mesmas direções
    const previousRefinements = post.refinements ?? []
    const historyBlock = previousRefinements.length > 0
      ? `\n\n## HISTÓRICO DE REFINAÇÕES ANTERIORES NESTE POST\n${previousRefinements
          .map((r, i) => `### Refinação ${i + 1} (em ${r.at})\nA Renata pediu: "${r.prompt}"\nVersão depois dessa refinação:\nLegenda: ${r.after?.legenda ?? '(sem mudança)'}\nRoteiro: ${r.after?.roteiro ?? '(sem mudança)'}\nTexto arte: ${r.after?.texto_arte ?? '(sem mudança)'}`)
          .join('\n\n---\n\n')}`
      : ''

    const userMessage = `## POST ATUAL
Tipo: ${post.content_type ?? 'n/a'} | Rede: ${post.network ?? 'n/a'}
Título: ${post.title ?? '(sem título)'}
Briefing: ${post.description ?? '(sem briefing)'}

Legenda atual:
${currentLegenda || '(vazio)'}

Roteiro atual (resumo do arco):
${currentRoteiro || '(vazio, apenas para vídeo)'}${cenasBlock}

Texto na arte atual:
${currentTextoArte || '(vazio, apenas para estático/carrossel)'}

Briefing da arte: ${post.briefing_arte ?? '(vazio)'}
${historyBlock}

## NOVA INSTRUÇÃO DA RENATA
${prompt.trim()}
${fieldScope ? `\n## ESCOPO RESTRITO\nMude APENAS ${fieldScopeLabel[fieldScope]}. Mantenha TODOS os outros campos exatamente como estão. NÃO mude content_type. Devolva o JSON com todos os campos, mas com os não-escopados idênticos aos atuais.\n` : ''}
Reescreva o post aplicando essa instrução. Devolva o JSON conforme o schema do system prompt — incluindo TODOS os campos relevantes pro tipo de conteúdo (mesmo os que não mudaram, devolva o valor atual).`

    const t0 = Date.now()
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 4000,
        system: [
          { type: 'text', text: REFINE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        ],
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    })

    if (!resp.ok) {
      const errBody = await resp.text()
      console.error('Anthropic refine error:', resp.status, errBody)
      return new Response(JSON.stringify({ error: 'Anthropic falhou', details: errBody }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await resp.json()
    console.log('Refine done in', Date.now() - t0, 'ms')
    console.log('Refine usage:', JSON.stringify(data?.usage ?? {}))

    // deno-lint-ignore no-explicit-any
    const textBlocks: any[] = (data?.content ?? []).filter((b: { type?: string }) => b?.type === 'text')
    const text: string = textBlocks.length > 0 ? (textBlocks[textBlocks.length - 1].text ?? '') : ''
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let refined: { title?: string; description?: string; content_type?: string; legenda?: string; roteiro?: string; cenas?: SceneEntry[]; texto_arte?: string; briefing_arte?: string }
    try {
      refined = JSON.parse(cleaned)
    } catch (err) {
      console.error('JSON parse falhou:', err, 'raw:', cleaned.slice(0, 500))
      return new Response(JSON.stringify({ error: 'Resposta da IA não foi JSON válido', raw: cleaned }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Valida content_type que voltou: aceita só video|estatico|carrossel; senão mantém o atual
    const validTypes = new Set(['video', 'estatico', 'carrossel'])
    const newContentType = refined.content_type && validTypes.has(refined.content_type)
      ? refined.content_type
      : (post.content_type ?? null)
    const typeChanged = newContentType !== post.content_type

    // Quando muda pra video: roteiro+cenas devem estar preenchidos, texto_arte vai pra null.
    // Quando muda pra estatico/carrossel: texto_arte deve estar preenchido, roteiro+cenas vão pra null.
    let finalRoteiro = refined.roteiro && refined.roteiro.trim() ? refined.roteiro : post.roteiro
    let finalTextoArte = refined.texto_arte && refined.texto_arte.trim() ? refined.texto_arte : post.texto_arte
    let finalCenas: SceneEntry[] | null = Array.isArray(refined.cenas) && refined.cenas.length > 0
      ? refined.cenas
      : currentCenas.length > 0 ? currentCenas : null
    if (newContentType === 'video') {
      finalTextoArte = null
    } else if (newContentType === 'estatico' || newContentType === 'carrossel') {
      finalRoteiro = null
      finalCenas = null
    }

    // Monta o "before" e "after" pro histórico
    const before = {
      title: post.title,
      content_type: post.content_type,
      legenda: currentLegenda || null,
      roteiro: currentRoteiro || null,
      cenas: currentCenas.length > 0 ? currentCenas : null,
      texto_arte: currentTextoArte || null,
      briefing_arte: post.briefing_arte,
    }
    const after = {
      title: refined.title ?? post.title,
      content_type: newContentType,
      legenda: refined.legenda ?? null,
      roteiro: finalRoteiro,
      cenas: finalCenas,
      texto_arte: finalTextoArte,
      briefing_arte: refined.briefing_arte ?? post.briefing_arte,
    }

    const newRefinement = {
      prompt: prompt.trim(),
      before,
      after,
      at: new Date().toISOString(),
      type_changed: typeChanged,
    }

    // Atualiza o post: sobrescreve campos, limpa versao_editada (ja refinada),
    // e ajusta content_type + roteiro/texto_arte/cenas pra ficarem coerentes.
    const updates: Record<string, unknown> = {
      title: refined.title ?? post.title,
      description: refined.description ?? post.description,
      content_type: newContentType,
      legenda: refined.legenda ?? post.legenda,
      roteiro: finalRoteiro,
      cenas: finalCenas,
      texto_arte: finalTextoArte,
      briefing_arte: refined.briefing_arte ?? post.briefing_arte,
      versao_editada: null,
      refinements: [...previousRefinements, newRefinement],
    }

    const { error: updateErr } = await supabaseClient
      .from('editorial_posts')
      .update(updates)
      .eq('id', post_id)

    if (updateErr) {
      console.error('Update falhou:', updateErr)
      return new Response(JSON.stringify({ error: 'Falha ao salvar refinação', details: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        ok: true,
        refined,
        refinement: newRefinement,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
