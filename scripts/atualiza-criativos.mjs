#!/usr/bin/env node
/**
 * Baixa o que os anúncios do Meta estão DIZENDO e grava para a tela do Cérebro.
 *
 * Uso:
 *   node scripts/atualiza-criativos.mjs
 *
 * O token sai de `.env.local`, na chave META_SYSTEM_USER_TOKEN — arquivo que
 * está no .gitignore. O RESULTADO, ao contrário dos leads de RH, pode ir para o
 * repositório: são textos de anúncio, feitos para o público ver, sem nome,
 * telefone ou e-mail de ninguém.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE PEDIR OS CAMPOS DO CRIATIVO UM A UM
 * ────────────────────────────────────────────────────────────────────────────
 * `fields=creative` devolve só `{id}`. O texto do anúncio mora dentro do
 * criativo, e a Graph API não expande nada que não seja pedido pelo nome. Sem a
 * lista abaixo, a leitura volta com 264 anúncios e zero textos — parecendo que
 * a conta não tem criativo nenhum.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE `limit=50` E NÃO 500
 * ────────────────────────────────────────────────────────────────────────────
 * Cada anúncio traz o criativo inteiro, e a resposta fica pesada. Acima de ~50
 * por página a API começa a devolver erro de tempo esgotado em vez da página.
 * Paginar mais vezes sai mais barato do que tentar adivinhar o limite.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'src/features/colaborador/midia-paga/dados/criativos.json');
const V = 'v21.0';
const CONTA = 'act_851020034114523';

/** Os três lugares onde o texto pode estar, mais o que identifica o anúncio. */
const CAMPOS = [
  'id',
  'name',
  'effective_status',
  'adset{name}',
  'campaign{name}',
  'creative{' +
    [
      'id',
      'body',
      'title',
      'call_to_action_type',
      'object_story_spec',
      'asset_feed_spec',
    ].join(',') +
    '}',
].join(',');

const cor = {
  ok: (t) => `\x1b[32m${t}\x1b[0m`,
  ruim: (t) => `\x1b[31m${t}\x1b[0m`,
  fraco: (t) => `\x1b[90m${t}\x1b[0m`,
};

function tokenDoEnv() {
  let env;
  try {
    env = readFileSync(join(RAIZ, '.env.local'), 'utf8');
  } catch {
    throw new Error('.env.local não encontrado na raiz do projeto.');
  }
  const linha = env.split('\n').find((l) => l.startsWith('META_SYSTEM_USER_TOKEN='));
  if (!linha) {
    throw new Error('META_SYSTEM_USER_TOKEN não está em .env.local.');
  }
  return linha.slice('META_SYSTEM_USER_TOKEN='.length).trim().replace(/^["']|["']$/g, '');
}

async function paginado(url) {
  const itens = [];
  let atual = url;
  let pagina = 0;

  while (atual) {
    const resposta = await fetch(atual);
    const corpo = await resposta.json();
    if (corpo.error) throw new Error(corpo.error.message);
    itens.push(...(corpo.data ?? []));
    atual = corpo.paging?.next ?? null;
    pagina += 1;
    process.stdout.write(cor.fraco(`\r  página ${pagina} — ${itens.length} anúncios`));
  }

  process.stdout.write('\n');
  return itens;
}

/** Só o que a tela usa. O criativo cru tem imagens e specs que ninguém lê. */
function enxugar(anuncio) {
  const c = anuncio.creative ?? {};
  return {
    id: anuncio.id,
    name: anuncio.name ?? null,
    effective_status: anuncio.effective_status ?? null,
    adset: anuncio.adset ? { name: anuncio.adset.name ?? null } : null,
    campaign: anuncio.campaign ? { name: anuncio.campaign.name ?? null } : null,
    creative: {
      body: c.body ?? null,
      title: c.title ?? null,
      call_to_action_type: c.call_to_action_type ?? null,
      object_story_spec: c.object_story_spec ?? null,
      asset_feed_spec: c.asset_feed_spec ?? null,
    },
  };
}

async function principal() {
  const token = tokenDoEnv();

  console.log(cor.fraco(`Lendo os anúncios de ${CONTA}…`));
  const anuncios = await paginado(
    `https://graph.facebook.com/${V}/${CONTA}/ads` +
      `?fields=${encodeURIComponent(CAMPOS)}&limit=50&access_token=${token}`,
  );

  const ativos = anuncios.filter((a) => a.effective_status === 'ACTIVE').length;

  writeFileSync(
    DESTINO,
    `${JSON.stringify(
      {
        lido_em: new Date().toISOString(),
        conta: CONTA,
        anuncios: anuncios.map(enxugar),
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(cor.ok(`✓ ${anuncios.length} anúncios (${ativos} no ar) gravados.`));
  console.log(cor.fraco(`  ${DESTINO}`));
}

principal().catch((erro) => {
  console.error(cor.ruim(`✗ ${erro.message}`));
  process.exit(1);
});
