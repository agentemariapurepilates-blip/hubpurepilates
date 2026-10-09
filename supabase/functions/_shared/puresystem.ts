// Conversa com o PureSystem, compartilhada por quem entra (puresystem-login) e
// por quem vincula a conta (puresystem-vincular).
//
// Está num módulo só porque as duas precisam seguir as MESMAS regras do guia de
// integração: User-Agent próprio, 20 segundos de limite, tratamento igual dos
// erros e, acima de tudo, a senha não sair daqui — ela não é registrada, não é
// devolvida e não é guardada.

/** Endereço do PureSystem do mesmo ambiente. Produção é escolha explícita. */
export const PURESYSTEM_API =
  Deno.env.get('PURESYSTEM_API') || 'https://treino-api.purepilates.com.br'

/** A funcionalidade que representa o Hub no perfil do PureSystem. */
export const FUNCIONALIDADE_HUB = Deno.env.get('PURESYSTEM_FUNCIONALIDADE')

// O Cloudflare do PureSystem recusa agente genérico (403, erro 1010).
const USER_AGENT = 'HubPurePilates/1.0'
const TIMEOUT_MS = 20_000

export type FalhaPureSystem =
  | 'credenciais'
  | 'muitas_tentativas'
  | 'indisponivel'
  | 'sem_acesso'
  | 'configuracao'

/** Mensagens genéricas: não dizem se o usuário existe nem se a senha errou. */
export const MENSAGENS: Record<FalhaPureSystem | 'nao_vinculado' | 'ja_vinculado', string> = {
  credenciais: 'Usuário ou senha inválidos.',
  muitas_tentativas: 'Muitas tentativas. Aguarde alguns minutos.',
  indisponivel: 'PureSystem indisponível, tente em instantes.',
  sem_acesso: 'Seu perfil no PureSystem não tem acesso ao Hub.',
  configuracao: 'Login do PureSystem indisponível.',
  nao_vinculado:
    'Esta conta do PureSystem ainda não está ligada a um perfil do Hub. Entre com e-mail e senha uma vez e vincule em Minha conta.',
  ja_vinculado: 'Esta conta do PureSystem já está ligada a outro perfil do Hub.',
}

export type PessoaPureSystem = { id: string; nome: string; login: string }

/**
 * Autentica no PureSystem e confere a funcionalidade do Hub.
 * Devolve a pessoa, ou a falha a mostrar. Falha fechado em qualquer dúvida.
 */
export async function autenticar(
  usuario: string,
  senha: string,
): Promise<{ pessoa: PessoaPureSystem } | { falha: FalhaPureSystem }> {
  if (!FUNCIONALIDADE_HUB) {
    console.error('[puresystem] PURESYSTEM_FUNCIONALIDADE não configurada; acesso recusado.')
    return { falha: 'configuracao' }
  }
  if (!usuario || !senha) return { falha: 'credenciais' }

  const controle = new AbortController()
  const relogio = setTimeout(() => controle.abort(), TIMEOUT_MS)
  let resposta: Response
  try {
    resposta = await fetch(`${PURESYSTEM_API.replace(/\/$/, '')}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
      body: JSON.stringify({ username: usuario, password: senha }),
      signal: controle.signal,
    })
  } catch {
    return { falha: 'indisponivel' } // timeout, DNS, rede
  } finally {
    clearTimeout(relogio)
  }

  if (resposta.status === 400 || resposta.status === 401) return { falha: 'credenciais' }
  if (resposta.status === 429) return { falha: 'muitas_tentativas' }
  if (!resposta.ok) {
    console.error(`[puresystem] respondeu ${resposta.status}`)
    return { falha: 'indisponivel' }
  }

  let sessao: {
    usuario?: { idUsuario?: unknown; nome?: unknown; login?: unknown }
    funcionalidades?: unknown[]
  }
  try {
    sessao = (await resposta.json())?.session ?? {}
  } catch {
    return { falha: 'indisponivel' }
  }

  const id = sessao?.usuario?.idUsuario
  if (id === undefined || id === null || id === '') {
    console.error('[puresystem] resposta sem session.usuario.idUsuario')
    return { falha: 'indisponivel' }
  }

  // A funcionalidade decide o acesso, e é conferida a cada login.
  const funcionalidades = new Set((sessao?.funcionalidades ?? []).map((f) => Number(f)))
  if (!funcionalidades.has(Number(FUNCIONALIDADE_HUB))) return { falha: 'sem_acesso' }

  const login = String(sessao?.usuario?.login ?? '')
  return {
    pessoa: {
      id: String(id),
      nome: String(sessao?.usuario?.nome ?? '') || login,
      login,
    },
  }
}
