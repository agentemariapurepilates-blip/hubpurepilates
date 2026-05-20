// PostgREST detecta o `UNIQUE (unit_id)` em dpp_unit_ad_set_link e retorna
// o nested resource como OBJETO ÚNICO (cardinalidade 1:1), não array.
// Os typings do supabase-js declaram array, então acessar `link?.[0]` em
// runtime retorna undefined. Esta função normaliza pra array sempre.

export function normalizeLink<T>(raw: T | T[] | null | undefined): T[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}
