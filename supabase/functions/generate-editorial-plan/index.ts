import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  month: string
  year: string
  networks: string[]
  instructions?: string
  editorialGuide?: string
}

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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!

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

    const prompt = `Você é um especialista em planejamento editorial de redes sociais para a marca Pure Pilates (rede de estúdios de Pilates no Brasil).

Crie um plano editorial mensal completo para ${month} de ${year}, distribuído nas seguintes redes: ${networks.join(', ')}.

${instructions ? `Instruções específicas do cliente: ${instructions}` : ''}
${editorialGuide ? `Guia editorial: ${editorialGuide}` : ''}

REGRAS OBRIGATÓRIAS:
1. Gere NO MÍNIMO 25 postagens no total para o mês (somando todas as redes). Pode gerar até 35 se fizer sentido.
2. Distribua bem ao longo do mês, sem concentrar em poucos dias.
3. INCLUA OBRIGATORIAMENTE conteúdos sazonais e datas comemorativas relevantes do mês de ${month}/${year} no Brasil — feriados nacionais, datas comerciais (ex: Dia das Mães em maio, Dia dos Namorados em junho, Dia dos Pais em agosto, Black Friday em novembro, Natal em dezembro), datas de saúde (Setembro Amarelo, Outubro Rosa, Novembro Azul) e datas relacionadas ao universo Pilates/saúde/bem-estar.
4. Misture tipos de conteúdo: educativo sobre Pilates, depoimentos/social proof, promocional sutil, datas comemorativas/sazonais, bastidores, dicas de saúde/postura, motivacional.
5. Cada rede deve receber entre 8 e 12 postagens (ajuste conforme número de redes solicitadas para totalizar pelo menos 25).

Para cada postagem, retorne:
- "date": data ISO 8601 (ex: "${exampleDate}")
- "network": uma das redes informadas (use exatamente o nome dado)
- "title": título curto (até 60 caracteres)
- "description": briefing da postagem (2-4 linhas, o que postar e como; mencione explicitamente quando for sazonal/comemorativo)

Responda EXCLUSIVAMENTE com JSON válido no formato:
{"posts": [{"date": "...", "network": "...", "title": "...", "description": "..."}]}

Sem texto antes ou depois. Sem markdown. Sem comentários.`

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`

    const geminiResp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!geminiResp.ok) {
      const errBody = await geminiResp.text()
      console.error('Gemini error:', geminiResp.status, errBody)
      return new Response(
        JSON.stringify({ error: 'Gemini API falhou', details: errBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiData = await geminiResp.json()
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    let parsed: { posts: Array<{ date: string; network: string; title: string; description: string }> }
    try {
      parsed = JSON.parse(text)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Resposta do Gemini não foi JSON válido', raw: text }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!Array.isArray(parsed?.posts)) {
      return new Response(
        JSON.stringify({ error: 'Formato de resposta inesperado', raw: parsed }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ posts: parsed.posts }),
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
