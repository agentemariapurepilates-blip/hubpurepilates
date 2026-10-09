// Liga a conta do PureSystem ao perfil de quem já está logado no Hub.
//
// POR QUE ESTE PASSO EXISTE: o PureSystem devolve id, nome e login — nunca
// e-mail. Não dá para adivinhar qual perfil do Hub é a mesma pessoa, e adivinhar
// errado entregaria a conta de outra. Então a própria pessoa prova que é dona
// das duas contas: está logada aqui e digita a senha do PureSystem uma vez.
//
// Depois disso, `profiles.puresystem_id` guarda o idUsuario e o login pelo
// PureSystem funciona. A senha segue as mesmas regras: não é registrada nem
// guardada (regra 2).

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

  // Só quem está logado no Hub vincula, e vincula a si mesmo.
  const authHeader = req.headers.get('Authorization') ?? ''
  const comoUsuario = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user } } = await comoUsuario.auth.getUser()
  if (!user) return responder({ erro: 'nao_logado', mensagem: 'Entre no Hub primeiro.' }, 401)

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

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  // O índice único já impede dois perfis com o mesmo id, mas um aviso claro
  // vale mais do que um erro de banco na tela.
  const { data: jaExiste } = await admin
    .from('profiles')
    .select('user_id')
    .eq('puresystem_id', resultado.pessoa.id)
    .maybeSingle()
  if (jaExiste && jaExiste.user_id !== user.id) {
    return responder({ erro: 'ja_vinculado', mensagem: MENSAGENS.ja_vinculado }, 409)
  }

  const { error: erroGravar } = await admin
    .from('profiles')
    .update({ puresystem_id: resultado.pessoa.id })
    .eq('user_id', user.id)

  if (erroGravar) {
    console.error('[puresystem-vincular] falha ao gravar o vínculo:', erroGravar.message)
    return responder({ erro: 'indisponivel', mensagem: MENSAGENS.indisponivel }, 503)
  }

  return responder({ login: resultado.pessoa.login, nome: resultado.pessoa.nome }, 200)
})
