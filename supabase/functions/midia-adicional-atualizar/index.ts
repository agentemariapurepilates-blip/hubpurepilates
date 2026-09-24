// Edição de um pedido de Campanha Aporte pela Visão Geral das Unidades.
//
// Grava a correção e AVISA POR E-MAIL quem recebe os pedidos, com os dados já
// corrigidos (pedido do usuário em 24/09/2026). É por isso que a edição passa
// por aqui em vez de ser um update direto do navegador como a aprovação: o
// webhook do n8n não aceita chamada do navegador.
//
// O e-mail sai pelo MESMO workflow do pedido novo (webhook midia-adicional-email),
// com `editado: true` no corpo — o workflow escreve "EDITADA" no assunto e no
// título. Quem recebe continua sendo a lista fixa daquele workflow.
//
// QUEM PODE: a gravação usa o token de quem pediu, então a RLS de
// midia_adicional_requests é quem decide (colaborador ou admin). Se ela barrar,
// nenhuma linha volta do update e a function responde 403 — em vez de dizer
// "salvo" sem ter salvo nada.
//
// PUBLICADA em 24/09/2026 (verify_jwt ligado). O workflow do n8n ja distingue
// edicao de pedido novo: "EDITADA" no assunto e no titulo, mais "Editado por".

import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { camposParaGravar, corpoDoWebhook, validarEdicao } from './pedido.ts'

const N8N_WEBHOOK_URL = Deno.env.get('MIDIA_ADICIONAL_WEBHOOK_URL')
  || 'https://backend.purepilates.com.br/webhook/midia-adicional-email'

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const json = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Sem autorizacao' }, 401)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return json({ error: 'Nao autorizado' }, 401)

    const validacao = validarEdicao(await req.json().catch(() => null))
    if (!validacao.ok) return json({ error: validacao.erro }, 400)
    const pedido = validacao.pedido

    const { data: linhas, error: updateError } = await supabase
      .from('midia_adicional_requests')
      .update(camposParaGravar(pedido))
      .eq('id', pedido.id)
      .select('id')

    if (updateError) {
      console.error('[midia-adicional-atualizar] falha ao gravar:', updateError)
      return json({ error: 'Falha ao salvar a edicao', details: updateError.message }, 500)
    }
    // Update barrado pela RLS não dá erro: só não muda nenhuma linha.
    if (!linhas || linhas.length === 0) {
      return json({ error: 'Voce nao tem permissao para editar este pedido.' }, 403)
    }

    let avisoEnviado = false
    try {
      const resposta = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpoDoWebhook(pedido, user.email ?? null)),
      })
      avisoEnviado = resposta.ok
      if (!resposta.ok) {
        console.error(`[midia-adicional-atualizar] n8n respondeu ${resposta.status}:`, await resposta.text())
      }
    } catch (err) {
      // A edição já está gravada; o aviso é que não saiu.
      console.error('[midia-adicional-atualizar] falha ao chamar o n8n:', err)
    }

    return json({ success: true, id: pedido.id, aviso_enviado: avisoEnviado })
  } catch (error) {
    console.error('[midia-adicional-atualizar] erro inesperado:', error)
    return json({ error: 'Erro interno' }, 500)
  }
})
