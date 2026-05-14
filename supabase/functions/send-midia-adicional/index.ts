import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

// TODO: substituir pelo email definitivo do time de marketing.
const MARKETING_EMAIL = Deno.env.get('MARKETING_NOTIFICATION_EMAIL') || 'marketing@purepilates.com.br'

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

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      const planLabel = PLAN_LABELS[body.plano]
      const formattedDate = new Date(body.data_inauguracao + 'T00:00:00').toLocaleDateString('pt-BR')

      const htmlBody = `
        <h2>Nova solicitacao de Midia adicional</h2>
        <table style="border-collapse: collapse; font-family: Arial, sans-serif;">
          <tr><td style="padding: 6px 12px;"><b>Franqueado:</b></td><td style="padding: 6px 12px;">${escapeHtml(body.nome_franqueado)}</td></tr>
          <tr><td style="padding: 6px 12px;"><b>Unidade:</b></td><td style="padding: 6px 12px;">${escapeHtml(body.nome_unidade)}</td></tr>
          <tr><td style="padding: 6px 12px;"><b>Inauguracao:</b></td><td style="padding: 6px 12px;">${formattedDate}</td></tr>
          <tr><td style="padding: 6px 12px;"><b>Plano:</b></td><td style="padding: 6px 12px;">${planLabel}</td></tr>
          <tr><td style="padding: 6px 12px;"><b>Email da unidade:</b></td><td style="padding: 6px 12px;">${escapeHtml(body.email_unidade)}</td></tr>
          ${body.email_franqueado ? `<tr><td style="padding: 6px 12px;"><b>Email do franqueado:</b></td><td style="padding: 6px 12px;">${escapeHtml(body.email_franqueado)}</td></tr>` : ''}
        </table>
        <p style="font-family: Arial, sans-serif; color: #666; font-size: 12px;">
          Solicitacao #${inserted.id}<br/>
          Submetida em ${new Date(inserted.created_at).toLocaleString('pt-BR')} por ${user.email}
        </p>
      `

      const emailResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Hub Pure Pilates <hub@purepilates.com.br>',
          to: MARKETING_EMAIL,
          reply_to: body.email_franqueado || body.email_unidade,
          subject: `Midia adicional · ${body.nome_unidade}`,
          html: htmlBody,
        }),
      })

      if (!emailResp.ok) {
        const errText = await emailResp.text()
        console.error('Resend error:', emailResp.status, errText)
        // Nao falha a request: solicitacao ja foi salva.
      }
    } else {
      console.warn('RESEND_API_KEY nao configurada — solicitacao salva sem envio de email.')
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
