// Pedido de verba para campanha de recrutamento de novos professores.
//
// CÓPIA DO CAMINHO DA send-midia-adicional, do pedido à aprovação (pedido do
// usuário em 16/09/2026): autentica o usuário, valida, grava com o token dele
// (RLS) e chama o webhook do n8n, que monta e envia o e-mail. Falha no webhook
// só é registrada no log — igual à Mídia Adicional, o pedido já está gravado e
// aparece na Visão Geral das Unidades.
//
// Diferença: a validação mora em pedido.ts, com testes, e é a mesma da tela.
//
// NAO PUBLICADA AINDA. Ver n8n/README.md, seção verba-professores.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { corpoDoWebhook, validarPedido } from './pedido.ts'

const N8N_WEBHOOK_URL = Deno.env.get('VERBA_PROFESSORES_WEBHOOK_URL')
  || 'https://backend.purepilates.com.br/webhook/verba-professores-email'

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

    const validacao = validarPedido(await req.json().catch(() => null))
    if (!validacao.ok) {
      return new Response(
        JSON.stringify({ error: validacao.erro }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const pedido = validacao.pedido

    const { data: inserted, error: insertError } = await supabaseClient
      .from('verba_professores_requests')
      .insert({ ...pedido, user_id: user.id })
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
      const webhookResp = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpoDoWebhook(inserted.id, pedido, user.email ?? null)),
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
