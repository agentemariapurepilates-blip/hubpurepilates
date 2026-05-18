import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  image: {
    mime_type: string
    data: string // base64 sem prefixo data URI
  }
}

const POSE_SYSTEM_INSTRUCTIONS = `Você é especialista em descrever poses humanas para geração de imagens fotorrealistas.

Sua tarefa: olhe a imagem enviada e descreva A POSE CORPORAL da pessoa principal, em extremo detalhe técnico — incluindo qualquer aparelho ou objeto QUE SUSTENTE OU FAÇA PARTE DA POSE.

INCLUA na descrição:
- Posição e ângulo da cabeça (inclinação, rotação, direção do olhar)
- Posição dos ombros (relaxados, contraídos, inclinados)
- Posição e ângulo de cada braço (estendido, dobrado, ângulo do cotovelo)
- Posição das mãos e dedos (palma virada, punho fechado, dedos abertos, tocando algo)
- Posição do tronco (ereto, inclinado, rotacionado)
- Posição do quadril (alinhado, lateralizado)
- Posição e ângulo de cada perna (estendida, dobrada, ângulo do joelho)
- Posição dos pés (em pé, apoiado, ponta de pé)
- Distribuição de peso e contato com superfície/objeto
- Expressão postural (tensão, relaxamento)

REGRA SOBRE APARELHOS E OBJETOS — IMPORTANTE:
Se a pose envolver, depender de, estar apoiada em, deitada sobre, sentada em, ou interagindo com algum aparelho/objeto (reformer, cadillac, chair, barrel, bola de pilates / fitball, mat / colchonete, faixa elástica, bastão, halter, bola pequena, rolo, banco, parede, chão), você DEVE mencionar o tipo do aparelho/objeto e descrever a RELAÇÃO DO CORPO COM ELE (pontos de apoio, ângulos, contato). Sem isso a pose não faz sentido.

NÃO descreva o aparelho/objeto em detalhe visual (cor, material, marca, formato exato, dimensões). Apenas cite o tipo (ex: "deitada de costas sobre uma bola de pilates", "sentada no reformer com pés no footbar") — o modelo visual exato será fornecido por uma foto anexada separadamente.

Exemplo de boa descrição de pose com aparelho:
"Deitada de costas sobre uma bola de pilates, com a coluna em arco acompanhando a curvatura da bola, cabeça pendendo levemente pra trás, braços abertos lateralmente em cruz com palmas voltadas pra cima, pernas estendidas com pés apoiados firmes no chão dando estabilidade."

Note: a frase cita "bola de pilates" (tipo) e descreve a relação (apoio, curvatura, ângulos), mas NÃO diz cor, tamanho exato em centímetros nem marca.

NÃO MENCIONE (a menos que faça parte direta da pose como acima):
- Quem é a pessoa, gênero, idade, etnia, traços faciais, cabelo
- Roupas, acessórios, calçados
- Ambiente, fundo, cenário, decoração (paredes, plantas, móveis ao redor que não sustentam a pose)
- Iluminação, cores, sombras
- Estilo da imagem, qualidade, câmera, enquadramento

Critério de decisão sobre um objeto: pergunte "se eu remover esse objeto da cena, a pose continua possível e idêntica?" — se SIM, ignore o objeto. Se NÃO, descreva-o.

Responda em português, em texto corrido (1 a 2 parágrafos densos). Comece direto pela descrição da pose, sem prefixos como "Pose:" ou "A pessoa está". Use frases descritivas e técnicas.`

const MODEL_ID = 'gemini-2.5-flash'

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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY missing' }), {
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
    if (!body.image?.data || !body.image?.mime_type) {
      return new Response(JSON.stringify({ error: 'image (mime_type + data base64) obrigatorio' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiBody = {
      systemInstruction: { parts: [{ text: POSE_SYSTEM_INSTRUCTIONS }] },
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: body.image.mime_type,
                data: body.image.data,
              },
            },
            { text: 'Descreva a pose seguindo rigorosamente as regras do system instructions.' },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
      },
    }

    const t0 = Date.now()
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      }
    )
    const elapsed = Date.now() - t0

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('Gemini analyze-pose error', resp.status, errText)
      return new Response(
        JSON.stringify({
          error: 'Gemini API failed',
          status: resp.status,
          details: errText,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await resp.json()
    const candidateParts = data?.candidates?.[0]?.content?.parts ?? []
    const description = candidateParts
      .map((p: Record<string, unknown>) => (p as { text?: string }).text)
      .filter(Boolean)
      .join('\n')
      .trim()

    if (!description) {
      console.error('No text in Gemini response. Finish reason:', data?.candidates?.[0]?.finishReason)
      return new Response(
        JSON.stringify({
          error: 'Nenhuma descricao gerada',
          finish_reason: data?.candidates?.[0]?.finishReason ?? 'unknown',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        description,
        model: MODEL_ID,
        elapsed_ms: elapsed,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('analyze-pose-image error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error', message: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
