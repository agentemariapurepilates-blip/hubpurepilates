import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

const N8N_WEBHOOK_URL = Deno.env.get('MIDIA_ADICIONAL_WEBHOOK_URL')
  || 'https://backend.purepilates.com.br/webhook/midia-adicional-email'

const PLAN_LABELS: Record<string, string> = {
  '1500_3m': 'R$ 1.500,00 — campanha de aula experimental por 3 meses',
  '2000_3m': 'R$ 2.000,00 — campanha de aula experimental por 3 meses',
  '2500':    'R$ 2.500,00 — campanha de aula experimental',
}

interface RequestBody {
  nome_franqueado: string
  nome_unidade: string
  data_inauguracao: string
  plano: '1500_3m' | '2000_3m' | '2500'
  email_unidade: string
  email_franqueado?: string | null
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

    const body = await req.json() as RequestBody

    if (!body.nome_franqueado || !body.nome_unidade || !body.data_inauguracao ||
        !body.plano || !body.email_unidade) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatorios faltando' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!PLAN_LABELS[body.plano]) {
      return new Response(
        JSON.stringify({ error: 'Plano invalido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: inserted, error: insertError } = await supabaseClient
      .from('midia_adicional_requests')
      .insert({
        user_id: user.id,
        nome_franqueado: body.nome_franqueado,
        nome_unidade: body.nome_unidade,
        data_inauguracao: body.data_inauguracao,
        plano: body.plano,
        email_unidade: body.email_unidade,
        email_franqueado: body.email_franqueado || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Falha ao salvar solicitacao', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    try {
      const planLabel = PLAN_LABELS[body.plano]
      const dataInauguracaoFmt = new Date(body.data_inauguracao + 'T00:00:00').toLocaleDateString('pt-BR')

      const webhookResp = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inserted.id,
          nome_franqueado: body.nome_franqueado,
          nome_unidade: body.nome_unidade,
          data_inauguracao: body.data_inauguracao,
          data_inauguracao_fmt: dataInauguracaoFmt,
          plano: body.plano,
          plano_label: planLabel,
          email_unidade: body.email_unidade,
          email_franqueado: body.email_franqueado || null,
          submitted_by: user.email,
        }),
      })

      if (!webhookResp.ok) {
        const errText = await webhookResp.text()
        console.error('n8n webhook error:', webhookResp.status, errText)
      }
    } catch (err) {
      console.error('Falha ao chamar webhook n8n:', err)
    }

    return new Response(
      JSON.stringify({ success: true, id: inserted.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
