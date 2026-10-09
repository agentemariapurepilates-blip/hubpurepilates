// Login do Hub com o usuário do PureSystem.
//
// POR QUE ESTA FUNCTION EXISTE: o guia de integração manda que a chamada ao
// /auth/login saia do BACKEND, nunca do navegador (regra 1). O Hub é um site
// estático, então o backend é esta function.
//
// A senha existe só dentro desta requisição: não entra em log, não é guardada
// e não é devolvida (regra 2). Qualquer erro, demora ou resposta estranha
// resulta em SEM ACESSO (regra 3). A funcionalidade é conferida a cada login
// (regra 4) e a pessoa é achada pelo idUsuario (regra 5).
//
// A sessão que a pessoa ganha é a do Hub (Supabase), curta e renovável; o token
// do PureSystem é descartado e nunca vira credencial daqui (regra 6).

import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { autenticar, MENSAGENS } from '../_shared/puresystem.ts'

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req)
  const responder = (corpo: unknown, status: number) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') {
    return responder({ erro: 'configuracao', mensagem: MENSAGENS.configuracao }, 405)
  }

  let usuario = ''
  let senha = ''
  try {
    const corpo = await req.json()
    usuario = String(corpo?.usuario ?? '').trim()
    senha = String(corpo?.senha ?? '')
  } catch {
    return responder({ erro: 'credenciais', mensagem: MENSAGENS.credenciais }, 400)
  }

  const resultado = await autenticar(usuario, senha)
  if ('falha' in resultado) {
    const status =
      resultado.falha === 'credenciais' ? 401
      : resultado.falha === 'muitas_tentativas' ? 429
      : resultado.falha === 'sem_acesso' ? 403
      : 503
    return responder({ erro: resultado.falha, mensagem: MENSAGENS[resultado.falha] }, status)
  }

  // Achar o perfil do Hub ligado a este idUsuario.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  const { data: perfil, error: erroPerfil } = await admin
    .from('profiles')
    .select('email')
    .eq('puresystem_id', resultado.pessoa.id)
    .maybeSingle()

  if (erroPerfil) {
    console.error('[puresystem-login] falha ao ler profiles:', erroPerfil.message)
    return responder({ erro: 'indisponivel', mensagem: MENSAGENS.indisponivel }, 503)
  }
  if (!perfil?.email) {
    // A vinculação é explícita: o PureSystem não devolve e-mail, e casar por
    // nome ou login poderia entregar a conta de outra pessoa.
    return responder({ erro: 'nao_vinculado', mensagem: MENSAGENS.nao_vinculado }, 409)
  }

  // Abrir a sessão do Hub (não a do PureSystem).
  const { data: link, error: erroLink } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: perfil.email,
  })
  if (erroLink || !link?.properties?.email_otp) {
    console.error('[puresystem-login] falha ao gerar a sessão:', erroLink?.message)
    return responder({ erro: 'indisponivel', mensagem: MENSAGENS.indisponivel }, 503)
  }

  // Código de uso único, que o navegador troca por sessão.
  return responder({ email: perfil.email, codigo: link.properties.email_otp }, 200)
})
