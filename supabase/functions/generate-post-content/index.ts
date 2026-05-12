import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  post_id: string
  // Editorial guide stripped, sent from frontend (idem ao generate-editorial-plan).
  editorialGuide?: string
}

interface SceneEntry {
  numero: number
  cena: string
  narracao: string
}

interface PostRow {
  id: string
  user_id: string
  title: string | null
  network: string | null
  content_type: string | null
  description: string | null
  post_date: string | null
}

const CONTENT_SYSTEM_PROMPT = `Você é o agente editorial da marca Pure Pilates. Sua tarefa AGORA é GERAR O CONTEÚDO COMPLETO de UM ÚNICO POST a partir do tema já aprovado.

Fonte de verdade:
1. **GUIA EDITORIAL** (regras de tom, vocabulário, públicos, pilares, formatos) injetado em outro bloco. SIGA RIGOROSAMENTE.
2. **MEMÓRIA** (feedbacks anteriores: aprovados, reprovados, edições, refinamentos por campo) injetada em outro bloco. APRENDA com ela.

Em conflito entre instruções e Guia/Memória, o Guia e a Memória prevalecem.

## PESQUISA NA WEB
Você tem web_search. Use quando precisar validar fatos do método Pilates, dados de saúde, referências culturais. Prefira pesquisar a inventar.

## FORMATO DE SAÍDA (JSON)
Responda EXCLUSIVAMENTE com JSON válido { "post": { ... } }. Sem markdown, sem code fences.

O objeto post DEVE conter TODOS os campos abaixo (mesmo os que ficam vazios):
- "legenda": legenda completa pronta para publicação, até 2200 chars, 1-3 emojis no máximo, terminando com 5 a 10 hashtags incluindo #PurePilates e #PurePilatesBR
- "roteiro": APENAS se content_type="video". Resumo do arco narrativo em 2 a 4 linhas (NÃO é o cena-a-cena). Para outros tipos, "".
- "cenas": APENAS se content_type="video". Array de 3 a 8 objetos:
  { "numero": 1, "cena": "ação/visual em frase curta", "narracao": "o que o professor fala" }
  Ambos campos preenchidos. "narracao": "" só quando cena é silenciosa (só texto na tela). Última cena fecha com CTA. Para outros tipos, [].
  Regras: o estúdio grava com 1 (uma) pessoa por vez. Sem diálogos, sem dupla. Sempre o professor falando (no #DesafioDaSemana, SEMPRE o professor; aluno só aparece fazendo o movimento, em silêncio).
- "texto_arte": APENAS se content_type="estatico" ou "carrossel". Estático: 1 a 5 frases (5 a 12 palavras cada, separadas por \\n). Carrossel: "Slide 1: ...\\nSlide 2: ...\\nSlide 3: ..." (3 a 8 slides). Para "video", "".
- "briefing_arte": instruções pro designer. Estruture em 6 linhas: "Visual: ...\\nFoco: ...\\nAnimações: ...\\nCores: (paleta Pure: neutros + vermelho #c10230)\\nMúsica: ...\\nMood: ..."`

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
    const { post_id, editorialGuide } = body
    if (!post_id) {
      return new Response(JSON.stringify({ error: 'post_id obrigatorio' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: postData, error: postErr } = await supabaseClient
      .from('editorial_posts')
      .select('id, user_id, title, network, content_type, description, post_date')
      .eq('id', post_id)
      .single()

    if (postErr || !postData) {
      return new Response(JSON.stringify({ error: 'Post nao encontrado', details: postErr?.message }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const post = postData as PostRow

    const memoryBlock = await buildMemoryBlock(supabaseClient, user.id)

    const systemBlocks: Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }> = [
      { type: 'text', text: CONTENT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
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

    const userMessage = `Tema aprovado pela Renata. Gere o conteúdo completo seguindo as regras do guia.

## TEMA
- Data: ${post.post_date ?? 'n/a'}
- Rede: ${post.network ?? 'n/a'}
- Tipo: ${post.content_type ?? 'n/a'}
- Título: ${post.title ?? '(sem título)'}
- Briefing/ângulo: ${post.description ?? '(sem briefing)'}

Responda com o JSON { "post": { ... } } conforme o schema do system prompt.`

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
        system: systemBlocks,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }],
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!resp.ok) {
      const errBody = await resp.text()
      console.error('Anthropic content gen error:', resp.status, errBody)
      return new Response(JSON.stringify({ error: 'Anthropic falhou', details: errBody }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await resp.json()
    console.log('Content gen done in', Date.now() - t0, 'ms')
    console.log('Usage:', JSON.stringify(data?.usage ?? {}))

    // deno-lint-ignore no-explicit-any
    const textBlocks: any[] = (data?.content ?? []).filter((b: { type?: string }) => b?.type === 'text')
    const text: string = textBlocks.length > 0 ? (textBlocks[textBlocks.length - 1].text ?? '') : ''
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed: { post?: { legenda?: string; roteiro?: string; cenas?: SceneEntry[]; texto_arte?: string; briefing_arte?: string } }
    try {
      parsed = JSON.parse(cleaned)
    } catch (err) {
      console.error('JSON parse falhou:', err, 'raw:', cleaned.slice(0, 500))
      return new Response(JSON.stringify({ error: 'Resposta nao foi JSON valido', raw: cleaned.slice(0, 500) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const content = parsed.post ?? {}

    const finalCenas = Array.isArray(content.cenas) && content.cenas.length > 0 ? content.cenas : null
    const finalRoteiro = content.roteiro && content.roteiro.trim() ? content.roteiro : null
    const finalTextoArte = content.texto_arte && content.texto_arte.trim() ? content.texto_arte : null

    const updates: Record<string, unknown> = {
      legenda: content.legenda ?? null,
      roteiro: post.content_type === 'video' ? finalRoteiro : null,
      cenas: post.content_type === 'video' ? finalCenas : null,
      texto_arte: post.content_type !== 'video' ? finalTextoArte : null,
      briefing_arte: content.briefing_arte ?? null,
    }

    const { error: updateErr } = await supabaseClient
      .from('editorial_posts')
      .update(updates)
      .eq('id', post_id)

    if (updateErr) {
      console.error('Update falhou:', updateErr)
      return new Response(JSON.stringify({ error: 'Falha ao salvar', details: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ ok: true, content: updates }),
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

interface FieldFeedbackEntry {
  status?: 'approved' | 'rejected'
  motivo?: string
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
    const { data: approved } = await supabaseClient
      .from('editorial_posts')
      .select('title, network, content_type, legenda, roteiro, texto_arte')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .not('legenda', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(6)

    const { data: rejected } = await supabaseClient
      .from('editorial_posts')
      .select('title, network, content_type, legenda, feedback_motivo')
      .eq('user_id', userId)
      .eq('status', 'rejected')
      .not('feedback_motivo', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(6)

    const { data: fieldRejectedRows } = await supabaseClient
      .from('editorial_posts')
      .select('title, network, content_type, legenda, roteiro, texto_arte, briefing_arte, field_feedback')
      .eq('user_id', userId)
      .not('field_feedback', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(20)

    const { data: edited } = await supabaseClient
      .from('editorial_posts')
      .select('title, network, content_type, legenda, roteiro, texto_arte, briefing_arte, versao_editada')
      .eq('user_id', userId)
      .not('versao_editada', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(6)

    const sections: string[] = []

    if (Array.isArray(approved) && approved.length > 0) {
      const items = (approved as MemoryRow[]).map((r, i) => {
        const parts = [`### Aprovado ${i + 1} · ${r.network ?? '?'} (${r.content_type ?? 'n/a'})`]
        if (r.title) parts.push(`Título: ${r.title}`)
        if (r.legenda) parts.push(`Legenda:\n${r.legenda}`)
        return parts.join('\n')
      })
      sections.push(`## ✅ EXEMPLOS APROVADOS\n\n${items.join('\n\n---\n\n')}`)
    }

    if (Array.isArray(rejected) && rejected.length > 0) {
      const items = (rejected as MemoryRow[]).map((r, i) => {
        const parts = [`### Reprovado ${i + 1}`]
        if (r.title) parts.push(`Título: ${r.title}`)
        if (r.legenda) parts.push(`Legenda original:\n${r.legenda}`)
        parts.push(`MOTIVO: ${r.feedback_motivo}`)
        return parts.join('\n')
      })
      sections.push(`## ❌ POSTS REPROVADOS\n\n${items.join('\n\n---\n\n')}`)
    }

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
        const bucket = grouped[key].slice(0, 4)
        if (bucket.length === 0) continue
        const items = bucket.map((b, i) => {
          const parts = [`### Reprovado ${i + 1}`]
          if (b.row.title) parts.push(`Post: ${b.row.title}`)
          const fieldContent = b.row[key as 'legenda' | 'roteiro' | 'texto_arte' | 'briefing_arte']
          if (fieldContent) parts.push(`Conteúdo reprovado:\n${fieldContent}`)
          parts.push(`MOTIVO: ${b.motivo}`)
          return parts.join('\n')
        })
        sections.push(`## ❌ CAMPO REPROVADO · ${fieldLabels[key]}\n\n${items.join('\n\n---\n\n')}`)
      }
    }

    if (Array.isArray(edited) && edited.length > 0) {
      const items = (edited as MemoryRow[]).map((r, i) => {
        const parts = [`### Edição ${i + 1}`]
        if (r.title) parts.push(`Título: ${r.title}`)
        if (r.legenda && r.versao_editada?.legenda) {
          parts.push(`Legenda IA original:\n${r.legenda}`)
          parts.push(`Legenda VERSÃO FINAL da Renata:\n${r.versao_editada.legenda}`)
        }
        return parts.join('\n')
      })
      sections.push(`## ✏️ EDIÇÕES MANUAIS (aprenda o delta IA → versão final)\n\n${items.join('\n\n---\n\n')}`)
    }

    if (sections.length === 0) return ''

    return `## MEMÓRIA DO AGENTE — FEEDBACK DA RENATA\nUse como calibração de tom: repita o estilo dos aprovados, evite padrões dos reprovados, aprenda com as edições manuais.\n\n${sections.join('\n\n')}`
  } catch (err) {
    console.error('Falha ao montar memoryBlock:', err)
    return ''
  }
}
