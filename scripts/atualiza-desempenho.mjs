#!/usr/bin/env node
/**
 * Baixa o desempenho de mídia que o RELATÓRIO analisa — Meta por conjunto,
 * Google por campanha.
 *
 * Uso:
 *   node scripts/atualiza-desempenho.mjs [--de AAAA-MM-DD] [--ate AAAA-MM-DD]
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE ESTE SCRIPT EXISTE
 * ────────────────────────────────────────────────────────────────────────────
 * O relatório lia `dpp_ad_set_daily_metrics`, no banco do Hub. Em 24/08/2026
 * essa tabela tinha métrica de 6 dos 112 conjuntos da conta — todos de uma
 * campanha só — e somava R$ 1.437 em agosto, contra R$ 65.315 de gasto real.
 *
 * O relatório não quebrava: ele analisava 2% da conta e apresentava o
 * resultado com a mesma cara de quem viu tudo. É a pior forma de erro que
 * existe num relatório, porque nada na tela denuncia.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * CADA PLATAFORMA NO GRÃO QUE ELA PERMITE
 * ────────────────────────────────────────────────────────────────────────────
 * · Meta   — direto da Graph API, nível CONJUNTO. É o grão em que o manual
 *            classifica: a frente sai do cruzamento campanha × conjunto, e
 *            "conjunto sem unidade vinculada" é uma regra por conjunto.
 * · Google — do SmartAds, nível CAMPANHA. Não há acesso à API do Google Ads, e
 *            o SmartAds só guarda campanha. Cada campanha entra como uma linha
 *            cujo "conjunto" é a própria campanha, com `granularidade` marcando
 *            isso — a tela precisa poder dizer que ali não há quebra por grupo
 *            de anúncios, em vez de deixar parecer que a campanha tem um
 *            conjunto só.
 *
 * O GA4 NÃO entra. A coleta dele quebrou depois de abril/26: caiu de 3.116
 * sessões em doze dias para menos de cem por mês, com as conversões zeradas.
 * Ligar isso ao relatório colocaria "93 sessões" ao lado de "5 milhões de
 * impressões" e chamaria as duas de dado.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'src/features/colaborador/midia-paga/dados/desempenho.json');

const V = 'v21.0';
const CONTA_META = 'act_851020034114523';
const PROJETO_SMARTADS = 'tobdedvnqaukpmnedabt';

/**
 * Os eventos do Meta que contam como resultado.
 *
 * O Meta devolve o mesmo evento sob vários `action_type`, um por janela de
 * atribuição. Somar todos multiplicaria o resultado por dez.
 */
const EVENTOS = ['complete_registration', 'onsite_conversion.lead_grouped'];

const cor = {
  ok: (t) => `\x1b[32m${t}\x1b[0m`,
  ruim: (t) => `\x1b[31m${t}\x1b[0m`,
  aviso: (t) => `\x1b[33m${t}\x1b[0m`,
  fraco: (t) => `\x1b[90m${t}\x1b[0m`,
};

function doEnv(chave) {
  let env;
  try {
    env = readFileSync(join(RAIZ, '.env.local'), 'utf8');
  } catch {
    throw new Error('.env.local não encontrado na raiz do projeto.');
  }
  const linha = env.split('\n').find((l) => l.startsWith(`${chave}=`));
  if (!linha) throw new Error(`${chave} não está em .env.local.`);
  return linha.slice(chave.length + 1).trim().replace(/^["']|["']$/g, '');
}

function periodo() {
  const arg = (nome, padrao) => {
    const i = process.argv.indexOf(`--${nome}`);
    return i >= 0 ? process.argv[i + 1] : padrao;
  };
  const hoje = new Date().toISOString().slice(0, 10);
  // Três meses cobrem qualquer janela que a tela ofereça sem pesar a carga.
  const tresMeses = new Date(Date.now() - 92 * 864e5).toISOString().slice(0, 10);
  return { de: arg('de', tresMeses), ate: arg('ate', hoje) };
}

/* ------------------------------------------------------------------------- */
/* Meta — nível conjunto                                                     */
/* ------------------------------------------------------------------------- */

async function conjuntosDoMeta(token, de, ate) {
  const campos = [
    'date_start',
    'adset_id',
    'adset_name',
    'campaign_id',
    'campaign_name',
    'spend',
    'impressions',
    'clicks',
    'actions',
  ].join(',');

  let url =
    `https://graph.facebook.com/${V}/${CONTA_META}/insights` +
    `?level=adset&time_increment=1` +
    `&time_range=${encodeURIComponent(JSON.stringify({ since: de, until: ate }))}` +
    `&fields=${campos}&limit=200&access_token=${token}`;

  const linhas = [];
  while (url) {
    const resposta = await fetch(url);
    const corpo = await resposta.json();
    if (corpo.error) throw new Error(`Meta: ${corpo.error.message}`);
    linhas.push(...(corpo.data ?? []));
    url = corpo.paging?.next ?? null;
    process.stdout.write(cor.fraco(`\r  Meta: ${linhas.length} linhas`));
  }
  process.stdout.write('\n');

  const resultado = (l) =>
    (l.actions ?? [])
      .filter((a) => EVENTOS.includes(a.action_type))
      .reduce((soma, a) => soma + (Number(a.value) || 0), 0);

  return linhas.map((l) => ({
    data: l.date_start,
    plataforma: 'meta',
    granularidade: 'conjunto',
    conjuntoId: l.adset_id,
    conjunto: l.adset_name,
    campanhaId: l.campaign_id ?? null,
    campanha: l.campaign_name ?? '',
    gasto: Number(l.spend) || 0,
    impressoes: Number(l.impressions) || 0,
    cliques: Number(l.clicks) || 0,
    resultados: resultado(l),
  }));
}

/** O status atual de cada conjunto — o insights não devolve isso. */
async function statusDosConjuntos(token) {
  let url =
    `https://graph.facebook.com/${V}/${CONTA_META}/adsets` +
    `?fields=id,effective_status&limit=200&access_token=${token}`;

  const porId = {};
  while (url) {
    const resposta = await fetch(url);
    const corpo = await resposta.json();
    if (corpo.error) throw new Error(`Meta (status): ${corpo.error.message}`);
    for (const c of corpo.data ?? []) porId[c.id] = c.effective_status ?? null;
    url = corpo.paging?.next ?? null;
  }
  return porId;
}

/* ------------------------------------------------------------------------- */
/* Google — nível campanha, via SmartAds                                     */
/* ------------------------------------------------------------------------- */

const SQL_GOOGLE = `
  select
    i.date::text                      as data,
    c.id::text                        as campanha_id,
    coalesce(c.name, i.object_id)     as campanha,
    coalesce(c.campaign_type, '')     as tipo,
    coalesce(c.status, '')            as status,
    round(i.spend::numeric, 2)        as gasto,
    coalesce(i.impressions, 0)        as impressoes,
    coalesce(i.clicks, 0)             as cliques,
    coalesce(i.conversions, 0)        as resultados
  from insights i
  left join campaigns c on c.id = i.object_id::uuid
  where i.platform = 'google' and i.object_type = 'campaign'
    and i.date >= '{DE}' and i.date <= '{ATE}'
  order by i.date
`;

async function campanhasDoGoogle(token, de, ate) {
  const resposta = await fetch(
    `https://api.supabase.com/v1/projects/${PROJETO_SMARTADS}/database/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: SQL_GOOGLE.replace('{DE}', de).replace('{ATE}', ate).replace(/\s+/g, ' ').trim(),
      }),
    },
  );

  const corpo = await resposta.json();
  if (!resposta.ok || corpo.message) throw new Error(`SmartAds: ${corpo.message ?? resposta.status}`);

  console.log(cor.fraco(`  Google: ${corpo.length} linhas`));

  return corpo.map((l) => ({
    data: l.data,
    plataforma: 'google',
    // Sem acesso à API do Google Ads, o SmartAds só guarda campanha. A linha
    // existe no grão de campanha e diz isso de si mesma.
    granularidade: 'campanha',
    conjuntoId: l.campanha_id,
    conjunto: l.campanha,
    campanhaId: l.campanha_id,
    campanha: l.campanha,
    status: l.status || null,
    tipo: l.tipo || null,
    gasto: Number(l.gasto) || 0,
    impressoes: Number(l.impressoes) || 0,
    cliques: Number(l.cliques) || 0,
    resultados: Number(l.resultados) || 0,
  }));
}

/* ------------------------------------------------------------------------- */

async function principal() {
  const { de, ate } = periodo();
  console.log(cor.fraco(`Lendo o desempenho de ${de} a ${ate}…`));

  const tokenMeta = doEnv('META_SYSTEM_USER_TOKEN');
  const tokenSupabase = doEnv('SUPABASE_ACCESS_TOKEN');

  const [linhasMeta, status, linhasGoogle] = await Promise.all([
    conjuntosDoMeta(tokenMeta, de, ate),
    statusDosConjuntos(tokenMeta),
    campanhasDoGoogle(tokenSupabase, de, ate),
  ]);

  const dias = [
    ...linhasMeta.map((l) => ({ ...l, status: status[l.conjuntoId] ?? null })),
    ...linhasGoogle,
  ].sort((a, b) => a.data.localeCompare(b.data) || a.conjunto.localeCompare(b.conjunto));

  const porPlataforma = {};
  for (const l of dias) {
    const p = (porPlataforma[l.plataforma] ??= {
      granularidade: l.granularidade,
      objetos: new Set(),
      ultimo_dia: l.data,
      gasto: 0,
    });
    p.objetos.add(l.conjuntoId);
    p.gasto += l.gasto;
    if (l.data > p.ultimo_dia) p.ultimo_dia = l.data;
  }

  const plataformas = Object.fromEntries(
    Object.entries(porPlataforma).map(([nome, p]) => [
      nome,
      {
        granularidade: p.granularidade,
        objetos: p.objetos.size,
        ultimo_dia: p.ultimo_dia,
        gasto: Math.round(p.gasto * 100) / 100,
      },
    ]),
  );

  writeFileSync(
    DESTINO,
    `${JSON.stringify(
      { lido_em: new Date().toISOString(), de, ate, eventos_do_meta: EVENTOS, plataformas, dias },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(cor.ok(`✓ ${dias.length} linhas de dia × objeto.`));
  for (const [nome, p] of Object.entries(plataformas)) {
    console.log(
      `  ${nome.padEnd(7)} ${String(p.objetos).padStart(3)} ${p.granularidade}s, ` +
        `até ${p.ultimo_dia}, R$ ${p.gasto.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
    );
  }

  const maisRecente = Object.values(plataformas).reduce(
    (a, p) => (p.ultimo_dia > a ? p.ultimo_dia : a),
    '',
  );
  for (const [nome, p] of Object.entries(plataformas)) {
    if (p.ultimo_dia < maisRecente) {
      console.log(cor.aviso(`  ⚠ ${nome} está parado em ${p.ultimo_dia} (o mais recente é ${maisRecente}).`));
    }
  }

  console.log(cor.fraco(`  ${DESTINO}`));
}

principal().catch((erro) => {
  console.error(cor.ruim(`✗ ${erro.message}`));
  process.exit(1);
});
