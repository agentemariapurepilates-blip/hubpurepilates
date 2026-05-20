// supabase/functions/dpp-admin-relink-ad-set/index.ts
//
// Admin: troca o ad set vinculado a uma unidade.
// Chamado pelo client React via supabase.functions.invoke. Valida que o
// caller é admin (user_roles.role='admin') e chama o RPC dpp_relink_ad_set
// com service_role (o RPC foi REVOKE'd de authenticated por design).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'No authorization header' }, 401);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

  const { data: roleData } = await userClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (!roleData) return json({ error: 'Apenas admins podem vincular ad sets' }, 403);

  const body = (await req.json()) as { unit_id?: string; ad_set_id?: string };
  const unitId = body.unit_id;
  const adSetId = body.ad_set_id;
  if (!unitId || !adSetId) {
    return json({ error: 'unit_id e ad_set_id são obrigatórios' }, 400);
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await sb.rpc('dpp_relink_ad_set', {
    p_unit_id: unitId,
    p_ad_set_id: adSetId,
    p_actor: user.id,
  });
  if (error) return json({ error: error.message }, 500);

  const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
  return json({
    ok: true,
    moved_from_unit_id: row?.moved_from_unit_id ?? null,
    was_noop: row?.was_noop ?? false,
  });
});
