/**
 * Junta os leads que o Meta devolve agora com os que já estavam guardados.
 *
 * POR QUE EXISTE
 * O Meta só entrega os leads dos últimos 90 dias (comprovado em 05/10/2026: o
 * formulário principal conta 393 e entrega 393, o mais antigo com exatamente
 * 90 dias). A tarefa agendada reescrevia o arquivo inteiro só com o que ele
 * devolvia, então todo dia o lead mais antigo saía e se perdia. Aqui o que o
 * Meta deixa de entregar CONTINUA guardado, e o que ele ainda entrega
 * atualiza a cópia.
 *
 * Uma resposta vazia (token errado, permissão faltando) NÃO apaga nada: o
 * resultado é, no mínimo, tudo o que já estava guardado.
 *
 * @param {Array<{id?: string, created_time?: string}>|undefined} existentes
 * @param {Array<{id?: string, created_time?: string}>} novos
 */
export function mesclarLeads(existentes, novos) {
  const porId = new Map();
  let descartados = 0;

  for (const lead of existentes ?? []) {
    if (lead?.id) porId.set(String(lead.id), lead);
    else descartados++;
  }

  const idsAnteriores = new Set(porId.keys());
  const idsDoMeta = new Set();
  let atualizados = 0;
  let adicionados = 0;

  for (const lead of novos ?? []) {
    if (!lead?.id) {
      descartados++;
      continue;
    }
    const id = String(lead.id);
    idsDoMeta.add(id);
    if (idsAnteriores.has(id)) atualizados++;
    else adicionados++;
    porId.set(id, lead);
  }

  const preservados = [...idsAnteriores].filter((id) => !idsDoMeta.has(id)).length;

  const leads = [...porId.values()].sort((a, b) =>
    String(b.created_time ?? '').localeCompare(String(a.created_time ?? '')),
  );

  return { leads, preservados, atualizados, adicionados, descartados };
}
