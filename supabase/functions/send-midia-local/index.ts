// Pedido de MÍDIA LOCAL na TV Globo: grava o pedido e avisa a Rise por e-mail.
//
// NAO PUBLICADA AINDA. Para funcionar precisa de:
//   1. migration 20261104180000_midia_local.sql aplicada;
//   2. esta function publicada;
//   3. workflow n8n "Midia local TV Globo - Notificacao por email" ativo
//      (webhook midia-local-email; fonte do e-mail em n8n/midia-local-email.mjs);
//   4. (opcional) segredo MIDIA_LOCAL_CC_ANCINE: quem recebe cópia quando o
//      criativo é adaptação de campanha (custo de Ancine). Sem ele, não há cópia.
//
// MESMO CAMINHO DA send-verba-professores: autentica o usuário, valida, grava
// com o token DELE (a RLS decide) e chama o webhook do n8n, que monta e envia o
// e-mail. Quem recebe vem da tabela midia_local_email_recipients, cadastrada
// pelos admins no Hub, lida com a CHAVE DE SERVIÇO: quem faz o pedido é
// franqueado, e a RLS da lista (só admin) devolveria vazio para ele.
//
// FALHA NO AVISO NAO DESFAZ O PEDIDO: o pedido já está gravado e aparece na
// Visão Geral das Unidades. A resposta traz `aviso_enviado` e o motivo vai para
// o log, em vez de sumir. Lista vazia = pedido gravado, sem e-mail.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { copiaParaAncine, corpoDoWebhook, destinatariosDoEmail, validarPedido } from './pedido.ts'

const N8N_WEBHOOK_URL = Deno.env.get('MIDIA_LOCAL_WEBHOOK_URL')
  || 'https://backend.purepilates.com.br/webhook/midia-local-email'

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const json = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Sem autorizacao' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return json({ error: 'Nao autorizado' }, 401)

    const validacao = validarPedido(await req.json().catch(() => null))
    if (!validacao.ok) return json({ error: validacao.erro }, 400)
    const pedido = validacao.pedido

    const { data: inserido, error: insertError } = await supabase
      .from('midia_local_requests')
      .insert({ ...pedido, user_id: user.id })
      .select('id')
      .single()

    if (insertError) {
      console.error('[midia-local] falha ao gravar:', insertError)
      return json({ error: 'Falha ao salvar a solicitacao', details: insertError.message }, 500)
    }

    let avisoEnviado = false
    try {
      const servico = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      const { data: linhas, error: listaError } = await servico
        .from('midia_local_email_recipients')
        .select('email')
        .eq('ativo', true)

      if (listaError) throw new Error(`lista de destinatarios: ${listaError.message}`)

      const destinatarios = destinatariosDoEmail(linhas ?? [])
      if (destinatarios.length === 0) {
        throw new Error(
          `pedido ${inserido.id} gravado SEM e-mail: nenhum destinatario ativo em midia_local_email_recipients`,
        )
      }

      const cc = copiaParaAncine(pedido, Deno.env.get('MIDIA_LOCAL_CC_ANCINE'))
      if (pedido.criativo_tipo === 'adaptacao' && cc.length === 0) {
        console.error(
          `[midia-local] pedido ${inserido.id} e adaptacao de campanha (Ancine) mas MIDIA_LOCAL_CC_ANCINE nao esta configurado: sem copia para o marketing`,
        )
      }

      const resposta = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpoDoWebhook(inserido.id, pedido, user.email ?? null, destinatarios, cc)),
      })

      avisoEnviado = resposta.ok
      if (!resposta.ok) {
        console.error(`[midia-local] n8n respondeu ${resposta.status}:`, await resposta.text())
      }
    } catch (err) {
      console.error('[midia-local] aviso por e-mail nao enviado:', err)
    }

    return json({ success: true, id: inserido.id, aviso_enviado: avisoEnviado })
  } catch (error) {
    console.error('[midia-local] erro inesperado:', error)
    return json({ error: 'Erro interno' }, 500)
  }
})
