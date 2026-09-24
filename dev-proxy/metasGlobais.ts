// Gravação das METAS GLOBAIS DIÁRIAS (daily_goals com unit_id nulo) pelo proxy
// do servidor de desenvolvimento. Roda no processo Node do `npm run dev`, nunca
// no navegador — ver o plugin `indicadores-dev-proxy` em vite.config.ts.
//
// POR QUE ESTA É A ÚNICA ESCRITA DA ÁREA DE DASHBOARD
// A Administração nasceu somente consulta (spec de 30/07/2026). Em 16/09/2026 o
// usuário pediu para cadastrar metas pelo Hub, como faz no painel do Cloudflare.
// A exceção é estreita de propósito: só esta tabela, só metas globais, só as
// quatro métricas da aba, e só no servidor local.
//
// POR QUE NÃO É UM UPSERT
// O painel original faz `upsert(onConflict: 'unit_id,date,metric_key')`. Com
// unit_id NULO, um UNIQUE comum do Postgres não considera duas linhas iguais
// (NULL é distinto de NULL), e o upsert pode virar INSERT duplicado dependendo
// de como a constraint foi criada naquele banco. Em vez de apostar nisso, aqui
// se lê o mês, atualiza por `id` o que existe e insere só o que falta.
//
// POR QUE RELÊ NO FIM
// O spec de 30/07 mediu que escrita barrada pela RLS responde 204 sem mudar
// nada. Com a chave de serviço a RLS não se aplica, mas a regra continua: só
// dizemos "salvo" depois de ler de volta e conferir cada valor.

export const METRICAS_COM_META = [
  'experimentais',
  'experimentais_presenca',
  'matriculas_total',
  'matriculas_purepass',
] as const;

/** Teto por célula. Meta diária da rede inteira fica na casa dos milhares. */
const VALOR_MAXIMO = 1_000_000;

export interface MetaDoDia {
  date: string;
  metric_key: string;
  daily_target: number;
}

interface LinhaDoBanco extends MetaDoDia {
  id: number;
}

export interface ResultadoDaGravacao {
  criadas: number;
  atualizadas: number;
  inalteradas: number;
}

/** Erro com o código HTTP que o proxy deve devolver. */
export class ErroDeMetas extends Error {
  constructor(
    public status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

function ultimoDia(mes: string): number {
  const [ano, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(ano, m, 0)).getUTCDate();
}

/**
 * Confere o pedido inteiro antes de qualquer acesso ao banco. Nada é gravado se
 * uma única linha estiver errada — gravar metade de um mês é pior que recusar.
 */
export function validarPedido(mes: string, corpo: unknown): MetaDoDia[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    throw new ErroDeMetas(400, `Mês inválido: "${mes}". Use AAAA-MM.`);
  }

  const metas = (corpo as { metas?: unknown } | null)?.metas;
  if (!Array.isArray(metas) || metas.length === 0) {
    throw new ErroDeMetas(400, 'Nenhuma meta enviada.');
  }

  const dias = ultimoDia(mes);
  if (metas.length > dias * METRICAS_COM_META.length) {
    throw new ErroDeMetas(400, 'Mais metas do que cabem no mês.');
  }

  const vistas = new Set<string>();
  return metas.map((item, i) => {
    const { date, metric_key, daily_target } = (item ?? {}) as Record<string, unknown>;
    const onde = `Meta ${i + 1}`;

    if (typeof date !== 'string' || !date.startsWith(`${mes}-`)) {
      throw new ErroDeMetas(400, `${onde}: a data precisa ser de ${mes}.`);
    }
    const dia = Number(date.slice(8));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || dia < 1 || dia > dias) {
      throw new ErroDeMetas(400, `${onde}: data inexistente (${date}).`);
    }
    if (typeof metric_key !== 'string' || !(METRICAS_COM_META as readonly string[]).includes(metric_key)) {
      throw new ErroDeMetas(400, `${onde}: indicador não permitido (${String(metric_key)}).`);
    }
    if (typeof daily_target !== 'number' || !Number.isInteger(daily_target) || daily_target < 0 || daily_target > VALOR_MAXIMO) {
      throw new ErroDeMetas(400, `${onde}: o valor precisa ser um número inteiro entre 0 e ${VALOR_MAXIMO}.`);
    }

    const chave = `${date}|${metric_key}`;
    if (vistas.has(chave)) {
      throw new ErroDeMetas(400, `${onde}: ${metric_key} em ${date} aparece duas vezes.`);
    }
    vistas.add(chave);

    return { date, metric_key, daily_target };
  });
}

interface Conexao {
  base: string;
  chave: string;
  fetch?: typeof fetch;
}

async function lerMes(c: Conexao, mes: string): Promise<LinhaDoBanco[]> {
  const f = c.fetch ?? fetch;
  const consulta = new URLSearchParams({
    select: 'id,date,metric_key,daily_target',
    unit_id: 'is.null',
    order: 'date.asc,metric_key.asc',
  });
  consulta.append('date', `gte.${mes}-01`);
  consulta.append('date', `lte.${mes}-${String(ultimoDia(mes)).padStart(2, '0')}`);

  const resposta = await f(`${c.base}/rest/v1/daily_goals?${consulta}`, {
    headers: { apikey: c.chave, Authorization: `Bearer ${c.chave}` },
  });
  if (!resposta.ok) {
    throw new ErroDeMetas(502, `O banco respondeu ${resposta.status} ao ler as metas de ${mes}.`);
  }
  return (await resposta.json()) as LinhaDoBanco[];
}

async function escrever(c: Conexao, url: string, metodo: 'PATCH' | 'POST', corpo: unknown): Promise<unknown[]> {
  const f = c.fetch ?? fetch;
  const resposta = await f(url, {
    method: metodo,
    headers: {
      apikey: c.chave,
      Authorization: `Bearer ${c.chave}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(corpo),
  });
  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => '');
    throw new ErroDeMetas(502, `O banco recusou a gravação (${resposta.status}). ${texto}`.trim());
  }
  return (await resposta.json()) as unknown[];
}

export async function salvarMetasGlobais(
  c: Conexao,
  mes: string,
  metas: MetaDoDia[],
): Promise<ResultadoDaGravacao> {
  const existentes = await lerMes(c, mes);

  const porChave = new Map<string, LinhaDoBanco>();
  for (const linha of existentes) {
    const chave = `${linha.date}|${linha.metric_key}`;
    // Duplicata já no banco: não há como saber qual das duas o painel lê.
    // Escolher uma em silêncio mudaria a meta de um jeito que ninguém pediu.
    if (porChave.has(chave)) {
      throw new ErroDeMetas(
        409,
        `Há duas metas globais de ${linha.metric_key} em ${linha.date} no banco. ` +
          'Corrija a duplicata antes de salvar este mês.',
      );
    }
    porChave.set(chave, linha);
  }

  const novas: MetaDoDia[] = [];
  const mudadas: Array<{ id: number; daily_target: number }> = [];
  let inalteradas = 0;

  for (const meta of metas) {
    const atual = porChave.get(`${meta.date}|${meta.metric_key}`);
    if (!atual) novas.push(meta);
    else if (Number(atual.daily_target) !== meta.daily_target) mudadas.push({ id: atual.id, daily_target: meta.daily_target });
    else inalteradas++;
  }

  // Em lotes pequenos: um mês inteiro são ~124 PATCHes, e disparar todos de uma
  // vez contra a API do Supabase só troca lentidão por erro 429.
  for (let i = 0; i < mudadas.length; i += 10) {
    await Promise.all(
      mudadas.slice(i, i + 10).map(async ({ id, daily_target }) => {
        const linhas = await escrever(c, `${c.base}/rest/v1/daily_goals?id=eq.${id}`, 'PATCH', { daily_target });
        if (linhas.length !== 1) {
          throw new ErroDeMetas(502, `A meta ${id} não foi atualizada (o banco devolveu ${linhas.length} linhas).`);
        }
      }),
    );
  }

  if (novas.length > 0) {
    const linhas = await escrever(
      c,
      `${c.base}/rest/v1/daily_goals`,
      'POST',
      novas.map((m) => ({ ...m, unit_id: null })),
    );
    if (linhas.length !== novas.length) {
      throw new ErroDeMetas(502, `Eram ${novas.length} metas novas e o banco confirmou ${linhas.length}.`);
    }
  }

  const depois = await lerMes(c, mes);
  const gravado = new Map(depois.map((l) => [`${l.date}|${l.metric_key}`, Number(l.daily_target)]));
  const divergentes = metas.filter((m) => gravado.get(`${m.date}|${m.metric_key}`) !== m.daily_target);
  if (divergentes.length > 0) {
    throw new ErroDeMetas(
      500,
      `A gravação não se confirmou em ${divergentes.length} meta(s) — ex.: ${divergentes[0].metric_key} em ${divergentes[0].date}.`,
    );
  }

  return { criadas: novas.length, atualizadas: mudadas.length, inalteradas };
}
