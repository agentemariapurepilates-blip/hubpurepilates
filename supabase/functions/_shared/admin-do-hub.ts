import { createClient } from 'npm:@supabase/supabase-js@2';

/** Quem pediu, quando o pedido veio do navegador e não do cron. */
export interface AdminIdentificado {
  id: string;
  /** Para onde vai o "enviar teste". Pode faltar num usuário sem e-mail. */
  email: string | null;
}

/**
 * O admin do Hub por trás de um cabeçalho Authorization, ou `null`.
 *
 * Mesma checagem das outras functions administrativas (ver
 * dpp-admin-relink-ad-set): a consulta a `user_roles` roda com o JWT DO
 * PRÓPRIO usuário, não com a service_role. Assim a RLS continua valendo e um
 * token de colaborador simplesmente não acha a linha de admin — em vez de
 * depender de a function lembrar de filtrar direito.
 */
export async function adminDoHub(authorization: string | null): Promise<AdminIdentificado | null> {
  if (!authorization) return null;

  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) return null;

  const comOToken = createClient(url, anon, {
    global: { headers: { Authorization: authorization } },
  });

  const { data: { user }, error } = await comOToken.auth.getUser();
  if (error || !user) return null;

  const { data: papel } = await comOToken
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!papel) return null;

  return { id: user.id, email: user.email ?? null };
}
