import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

interface ReferenceImage {
  mime_type: string
  data: string // base64 sem prefixo data URI
}

interface RequestBody {
  prompt: string
  references?: ReferenceImage[]
  model?: 'flash' | 'pro'
  temperature?: number
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9'
  resolution?: '1K' | '2K' | '4K'
  system_instructions?: string
  grounding?: boolean
  avatar_name?: string
}

const MODEL_MAP: Record<'flash' | 'pro', string> = {
  flash: 'gemini-3.1-flash-image-preview',
  pro: 'gemini-3-pro-image-preview',
}

const MAX_REFERENCES = 14

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
    const {
      prompt,
      references = [],
      model = 'flash',
      temperature,
      aspect_ratio,
      resolution,
      system_instructions,
      grounding,
      avatar_name,
    } = body

    if (!prompt || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'prompt obrigatorio' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (references.length > MAX_REFERENCES) {
      return new Response(
        JSON.stringify({ error: `maximo ${MAX_REFERENCES} imagens de referencia` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const modelId = MODEL_MAP[model] ?? MODEL_MAP.flash

    // Parts: imagens de referência (inline) + texto do prompt
    const parts: Array<Record<string, unknown>> = []
    for (const ref of references) {
      parts.push({
        inline_data: {
          mime_type: ref.mime_type,
          data: ref.data,
        },
      })
    }
    parts.push({ text: prompt })

    // Monta generationConfig
    const generationConfig: Record<string, unknown> = {}
    if (typeof temperature === 'number') {
      generationConfig.temperature = temperature
    }
    // imageConfig — Gemini 3 image generation
    const imageConfig: Record<string, unknown> = {}
    if (aspect_ratio) {
      imageConfig.aspectRatio = aspect_ratio
    }
    if (resolution) {
      // Pro suporta 1K/2K/4K. Flash ignora.
      imageConfig.imageSize = resolution
    }
    if (Object.keys(imageConfig).length > 0) {
      generationConfig.imageConfig = imageConfig
    }

    // Body do Gemini
    const geminiBody: Record<string, unknown> = {
      contents: [{ parts }],
    }
    if (Object.keys(generationConfig).length > 0) {
      geminiBody.generationConfig = generationConfig
    }
    if (system_instructions && system_instructions.trim().length > 0) {
      geminiBody.systemInstruction = {
        parts: [{ text: system_instructions.trim() }],
      }
    }
    if (grounding) {
      geminiBody.tools = [{ googleSearch: {} }]
    }

    const t0 = Date.now()
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      }
    )
    const elapsed = Date.now() - t0

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('Gemini API error', resp.status, errText)
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
    const imagePart = candidateParts.find(
      (p: Record<string, unknown>) =>
        (p as { inlineData?: unknown }).inlineData ||
        (p as { inline_data?: unknown }).inline_data
    )

    if (!imagePart) {
      console.error('No image in Gemini response. Finish reason:', data?.candidates?.[0]?.finishReason)
      return new Response(
        JSON.stringify({
          error: 'Nenhuma imagem gerada',
          finish_reason: data?.candidates?.[0]?.finishReason ?? 'unknown',
          text_response: candidateParts.find((p: Record<string, unknown>) => p.text)?.text ?? null,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const imageData = (imagePart as { inlineData?: { mimeType: string; data: string } }).inlineData
      ?? (imagePart as { inline_data?: { mime_type: string; data: string } }).inline_data!

    const mimeType = (imageData as { mimeType?: string }).mimeType
      ?? (imageData as { mime_type?: string }).mime_type
      ?? 'image/png'

    return new Response(
      JSON.stringify({
        success: true,
        image: {
          mime_type: mimeType,
          data: (imageData as { data: string }).data,
        },
        model: modelId,
        elapsed_ms: elapsed,
        avatar_name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error', message: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
