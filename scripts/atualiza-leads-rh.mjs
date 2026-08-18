#!/usr/bin/env node
/**
 * Atualiza a lista de candidatos de RH — LOCALMENTE.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE ESTE SCRIPT EXISTE
 * ────────────────────────────────────────────────────────────────────────────
 * A atualização automática "de verdade" mora no Supabase: a função de borda
 * `rh-leads-sync` mais o agendamento em `20260818180000_leads_rh_cron.sql`.
 * Enquanto isso não for publicado, este script faz o mesmo trabalho na máquina
 * de quem o roda, regravando o arquivo de prévia que a tela lê em
 * desenvolvimento.
 *
 * A diferença entre os dois, e ela importa:
 *   · este aqui só atualiza ESTA máquina, e só com ela ligada;
 *   · o do Supabase atualiza para todo mundo, sozinho, sempre.
 *
 * Uso:
 *   node scripts/atualiza-leads-rh.mjs
 *
 * O token sai de `.env.local`, na chave META_SYSTEM_USER_TOKEN. Esse arquivo
 * está no .gitignore — o token nunca pode ir para o repositório.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'src/features/colaborador/leads-rh/dados-locais/leads-rh.json');
const V = 'v21.0';

/** Quais formulários são de RH. O mesmo critério da função de borda. */
const EH_FORMULARIO_DE_RH = /rh|cargo|instrutor|recrut|vaga|curr/i;

/**
 * Sem pedir `fields`, a Graph API devolve o lead SEM o conjunto de anúncio — e
 * é dele que sai a separação por unidade.
 */
const CAMPOS = [
  'id', 'created_time', 'ad_id', 'ad_name', 'adset_id', 'adset_name',
  'campaign_id', 'campaign_name', 'form_id', 'platform', 'is_organic', 'field_data',
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
    throw new Error(
      'Falta META_SYSTEM_USER_TOKEN no .env.local.\n' +
        '  Acrescente a linha:  META_SYSTEM_USER_TOKEN=EAA...',
    );
  }
  return linha.slice('META_SYSTEM_USER_TOKEN='.length).trim();
}

async function paginado(url) {
  const itens = [];
  let atual = url;
  while (atual) {
    const corpo = await (await fetch(atual)).json();
    if (corpo.error) throw new Error(corpo.error.message);
    itens.push(...(corpo.data ?? []));
    atual = corpo.paging?.next ?? null;
  }
  return itens;
}

(async () => {
  const token = tokenDoEnv();

  const paginas = (
    await (await fetch(`https://graph.facebook.com/${V}/me/accounts?fields=id,name,access_token&access_token=${token}`)).json()
  ).data ?? [];

  if (paginas.length === 0) throw new Error('O token não enxerga nenhuma Página.');

  const leads = [];
  let contados = 0;
  const bloqueados = [];

  for (const pagina of paginas) {
    let forms;
    try {
      forms = await paginado(
        `https://graph.facebook.com/${V}/${pagina.id}/leadgen_forms` +
          `?fields=id,name,leads_count&limit=100&access_token=${pagina.access_token}`,
      );
    } catch {
      continue; // Página sem permissão de listar formulários.
    }

    for (const form of forms.filter((f) => EH_FORMULARIO_DE_RH.test(f.name ?? ''))) {
      contados += form.leads_count ?? 0;
      try {
        const doForm = await paginado(
          `https://graph.facebook.com/${V}/${form.id}/leads` +
            `?fields=${CAMPOS}&limit=100&access_token=${pagina.access_token}`,
        );
        doForm.forEach((l) => leads.push({ ...l, form_name: form.name }));

        // Contado ≠ trazido quase sempre significa MANAGE_LEADS faltando na
        // Página — e não ausência de leads. Sem avisar, some em silêncio.
        if ((form.leads_count ?? 0) > doForm.length) {
          bloqueados.push(`${form.name}: conta ${form.leads_count}, entrega ${doForm.length}`);
        }
      } catch (e) {
        bloqueados.push(`${form.name}: ${e.message.slice(0, 60)}`);
      }
    }
  }

  leads.sort((a, b) => String(b.created_time).localeCompare(String(a.created_time)));
  // `automatica` diz à tela que existe agendamento nesta máquina, para o
  // painel poder mostrar a próxima carga em vez de "não agendada". Quem roda
  // o script na mão passa --manual e o painel não promete a próxima.
  const automatica = !process.argv.includes('--manual');
  writeFileSync(
    DESTINO,
    JSON.stringify({ geradoEm: new Date().toISOString(), automatica, leads }),
  );

  const teste = leads.filter((l) => JSON.stringify(l.field_data ?? []).includes('<test lead')).length;
  const conjuntos = new Set(leads.map((l) => l.adset_name ?? '(sem conjunto)')).size;

  console.log('');
  console.log(cor.ok(`  ${leads.length} candidatos gravados`) + cor.fraco(`  (${teste} de teste)`));
  console.log(cor.fraco(`  ${conjuntos} conjuntos · atualizado em ${new Date().toLocaleString('pt-BR')}`));

  if (bloqueados.length > 0) {
    console.log('');
    console.log(cor.ruim('  Nem todos os leads vieram:'));
    bloqueados.forEach((b) => console.log('    ' + b));
    console.log(cor.fraco('  Rode: node scripts/verifica-acesso-leads-rh.mjs SEU_TOKEN'));
  }
  console.log('');
})().catch((e) => {
  console.error('\n  ' + cor.ruim('FALHOU: ') + e.message + '\n');
  process.exit(1);
});
