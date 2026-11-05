// Quem pode chamar as functions do Blog: colaborador ou admin logado no Hub.
// Franqueado não gasta a cota do Gemini por aqui.

import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'

export const clienteAdmin = (): SupabaseClient =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

/** Devolve o usuário se ele for do time da Pure; senão, a mensagem e o status do erro. */
export async function usuarioDoTime(req: Request): Promise<{ user: User } | { erro: string; status: number }> {
  const comoUsuario = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: { user } } = await comoUsuario.auth.getUser()
  if (!user) return { erro: 'entre no Hub para usar o Blog da Pure', status: 401 }
  const [{ data: colab }, { data: admin }] = await Promise.all([
    comoUsuario.rpc('is_colaborador', { _user_id: user.id }),
    comoUsuario.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
  ])
  if (!colab && !admin) return { erro: 'o Blog da Pure é só para o time da Pure', status: 403 }
  return { user }
}
