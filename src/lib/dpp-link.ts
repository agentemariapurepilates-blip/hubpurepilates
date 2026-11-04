// Desde 04/11/2026 uma unidade pode ter vários ad sets vinculados
// (migration 20261104170000), e o PostgREST devolve o nested resource
// dpp_unit_ad_set_link como array. Antes, com o `UNIQUE (unit_id)`, vinha
// como OBJETO ÚNICO (cardinalidade 1:1). Esta função normaliza pra array
// sempre, nos dois casos.

export function normalizeLink<T>(raw: T | T[] | null | undefined): T[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}
