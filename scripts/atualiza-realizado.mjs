#!/usr/bin/env node
/**
 * Baixa o REALIZADO de mídia — Meta e Google, dia a dia — para a avaliação
 * contra o PDM.
 *
 * Uso:
 *   node scripts/atualiza-realizado.mjs
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE O SMARTADS, E NÃO A API DO META
 * ────────────────────────────────────────────────────────────────────────────
 * A primeira versão lia direto da Graph API. Funcionava, mas só entregava
 * Meta — e o Google é 40% do plano. Sem ele a avaliação fica enviesada de um
 * jeito que não dá para consertar na tela: o Meta gasta ABAIXO do planejado e
 * o Google ACIMA, e olhar só um lado inverte a conclusão sobre o mês.
 *
 * O SmartAds (projeto Supabase `tobdedvnqaukpmnedabt`) já sincroniza as duas
 * plataformas na tabela `insights`. Foi conferido contra a Graph API antes de
 * virar fonte: em julho/26 o SmartAds devolve `complete_registration` = 1.190
 * e `onsite_conversion.lead_grouped` = 426, exatamente os números que a API do
 * Meta dá. É espelho, não uma segunda versão da verdade.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * AS DUAS PLATAFORMAS NÃO GUARDAM A MESMA COISA
 * ────────────────────────────────────────────────────────────────────────────
 * · Meta  — traz `actions`, a lista completa de eventos por tipo. Dá para
 *           separar agendamento de lead de formulário.
 * · Google — traz só `conversions`, um inteiro. Não há como separar o que é
 *           agendamento do que é outra conversão. O número entra como
 *           `conversoes`, e a tela compara contra o total planejado do Google
 *           sem fingir uma quebra que o dado não tem.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * CADA PLATAFORMA TEM O SEU PRÓPRIO ATÉ-QUANDO
 * ────────────────────────────────────────────────────────────────────────────
 * As cargas são independentes e uma pode parar sem a outra parar — em 24/08 o
 * Google estava parado desde 12/08 e o Meta rodando normal. Por isso o arquivo
 * grava `ultimo_dia` POR PLATAFORMA: sem isso, agosto mostraria 11 dias de
 * Google contra 23 de Meta como se fossem o mesmo período, e o Google
 * pareceria ter desabado.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'src/features/colaborador/indicadores/dados/realizado.json');

const PROJETO_SMARTADS = 'tobdedvnqaukpmnedabt';

/** Desde quando há PDM para comparar. */
const INICIO = '2026-04-01';

/**
 * Quais eventos do Meta viram quais números.
 *
 * O Meta devolve o mesmo evento sob vários `action_type`, um por janela de
 * atribuição e origem. Somar tudo multiplicaria o resultado por dez. `lead`
 * NÃO serve: junta o lead de formulário com o lead de pixel do site e conta a
 * mesma pessoa duas vezes.
 */
const EVENTOS_DO_META = {
  agendamentos: 'complete_registration',
  leads: 'onsite_conversion.lead_grouped',
};

const cor = {
  ok: (t) => `\x1b[32m${t}\x1b[0m`,
  ruim: (t) => `\x1b[31m${t}\x1b[0m`,
  aviso: (t) => `\x1b[33m${t}\x1b[0m`,
  fraco: (t) => `\x1b[90m${t}\x1b[0m`,
};

function tokenDoEnv() {
  let env;
  try {
    env = readFileSync(join(RAIZ, '.env.local'), 'utf8');
  } catch {
    throw new Error('.env.local não encontrado na raiz do projeto.');
  }
  const linha = env.split('\n').find((l) => l.startsWith('SUPABASE_ACCESS_TOKEN='));
  if (!linha) {
    throw new Error(
      'SUPABASE_ACCESS_TOKEN não está em .env.local. É o token pessoal do Supabase (sbp_…), ' +
        'o mesmo que a CLI usa.',
    );
  }
  return linha.slice('SUPABASE_ACCESS_TOKEN='.length).trim().replace(/^["']|["']$/g, '');
}

async function consultar(token, sql) {
  const resposta = await fetch(
    `https://api.supabase.com/v1/projects/${PROJETO_SMARTADS}/database/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    },
  );

  const corpo = await resposta.json();
  if (!resposta.ok || corpo.message) {
    throw new Error(corpo.message ?? `HTTP ${resposta.status}`);
  }
  return corpo;
}

/**
 * Um dia por plataforma, com os eventos do Meta já separados por tipo.
 *
 * A soma é feita no banco: são milhares de linhas de campanha por dia, e
 * trazer tudo para cá só para somar gastaria banda à toa.
 */
const SQL = `
  with dias as (
    select
      date,
      platform,
      sum(spend)         as verba,
      sum(impressions)   as impressoes,
      sum(clicks)        as cliques,
      sum(conversions)   as conversoes
    from insights
    where date >= '${INICIO}' and object_type = 'campaign'
    group by 1, 2
  ),
  eventos as (
    select
      i.date,
      sum(case when a->>'action_type' = '${EVENTOS_DO_META.agendamentos}'
               then (a->>'value')::numeric else 0 end) as agendamentos,
      sum(case when a->>'action_type' = '${EVENTOS_DO_META.leads}'
               then (a->>'value')::numeric else 0 end) as leads
    from insights i, jsonb_array_elements(i.actions->'items') a
    where i.platform = 'meta' and i.date >= '${INICIO}' and i.object_type = 'campaign'
    group by 1
  )
  select
    d.date::text                        as data,
    d.platform                          as plataforma,
    round(d.verba::numeric, 2)          as verba,
    coalesce(d.impressoes, 0)::bigint   as impressoes,
    coalesce(d.cliques, 0)::bigint      as cliques,
    coalesce(d.conversoes, 0)::bigint   as conversoes,
    coalesce(e.agendamentos, 0)::bigint as agendamentos,
    coalesce(e.leads, 0)::bigint        as leads
  from dias d
  left join eventos e on e.date = d.date and d.platform = 'meta'
  order by d.date, d.platform
`;

async function principal() {
  const token = tokenDoEnv();

  console.log(cor.fraco(`Lendo o realizado do SmartAds, a partir de ${INICIO}…`));

  const linhas = await consultar(token, SQL.replace(/\s+/g, ' ').trim());

  const dias = linhas.map((l) => ({
    data: l.data,
    plataforma: l.plataforma,
    verba: Number(l.verba) || 0,
    impressoes: Number(l.impressoes) || 0,
    cliques: Number(l.cliques) || 0,
    conversoes: Number(l.conversoes) || 0,
    // Só o Meta tem a quebra por tipo de evento.
    agendamentos: l.plataforma === 'meta' ? Number(l.agendamentos) || 0 : null,
    leads: l.plataforma === 'meta' ? Number(l.leads) || 0 : null,
  }));

  // O até-quando de cada plataforma, que é o que impede comparar 11 dias de
  // uma com 23 dias da outra.
  const plataformas = {};
  for (const d of dias) {
    const p = (plataformas[d.plataforma] ??= { ultimo_dia: d.data, dias: 0 });
    if (d.data > p.ultimo_dia) p.ultimo_dia = d.data;
    p.dias += 1;
  }

  writeFileSync(
    DESTINO,
    `${JSON.stringify(
      {
        lido_em: new Date().toISOString(),
        fonte: 'smartads',
        projeto: PROJETO_SMARTADS,
        eventos_do_meta: EVENTOS_DO_META,
        plataformas,
        dias,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(cor.ok(`✓ ${dias.length} linhas de dia × plataforma.`));

  const horizontes = Object.entries(plataformas);
  for (const [nome, p] of horizontes) {
    const verba = dias
      .filter((d) => d.plataforma === nome)
      .reduce((a, d) => a + d.verba, 0);
    console.log(
      `  ${nome.padEnd(7)} ${String(p.dias).padStart(3)} dias, até ${p.ultimo_dia}, ` +
        `R$ ${verba.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
    );
  }

  // Uma carga parada é invisível na tela se ninguém disser nada aqui.
  const maisRecente = horizontes.reduce((a, [, p]) => (p.ultimo_dia > a ? p.ultimo_dia : a), '');
  for (const [nome, p] of horizontes) {
    if (p.ultimo_dia < maisRecente) {
      console.log(
        cor.aviso(
          `  ⚠ a carga do ${nome} está parada em ${p.ultimo_dia}, ` +
            `enquanto a mais recente vai até ${maisRecente}.`,
        ),
      );
    }
  }

  console.log(cor.fraco(`  ${DESTINO}`));
}

principal().catch((erro) => {
  console.error(cor.ruim(`✗ ${erro.message}`));
  process.exit(1);
});
