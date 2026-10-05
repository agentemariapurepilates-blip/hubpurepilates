#!/usr/bin/env node
/**
 * Importa para a lista de candidatos de RH uma planilha (CSV) com leads que o
 * Meta já não entrega — LOCALMENTE.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE ESTE SCRIPT EXISTE
 * ────────────────────────────────────────────────────────────────────────────
 * O Meta só guarda lead por 90 dias. Em 05/10/2026 isso significava que nada
 * antes de 07/07 podia ser buscado — e quem pediu a lista "desde março" só
 * consegue isso com uma cópia de fora (a exportação da agência, uma planilha).
 * Aqui essa cópia entra no mesmo arquivo que `atualiza-leads-rh.mjs` mantém, no
 * mesmo formato, e a tela passa a mostrá-la.
 *
 * Uso:
 *   node scripts/importa-leads-rh-csv.mjs planilha.csv              # só simula
 *   node scripts/importa-leads-rh-csv.mjs planilha.csv --gravar     # grava
 *
 * Opções:
 *   --gerar-id   a planilha não traz o id do Meta: cria um id estável a partir
 *                da data e das respostas. Linhas da janela que o Meta ainda
 *                entrega são puladas, para não duplicar.
 *   --destino X  grava em outro arquivo (para ensaiar sem tocar no real).
 *
 * NÃO MEXE NA PRODUÇÃO. Isto alimenta só o arquivo local (a prévia de
 * `npm run dev`). Os leads de produção ficam na tabela `rh_leads` do Supabase,
 * e levar a planilha para lá é um passo à parte.
 *
 * O arquivo tem dado pessoal de candidato e está no .gitignore. Este script
 * nunca imprime nome, e-mail nem telefone — só contagens.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { importarCsv, decodificar } from './lib/leads-csv.mjs';
import { mesclarLeads } from './lib/mescla-leads.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO_PADRAO = join(RAIZ, 'src/features/colaborador/leads-rh/dados-locais/leads-rh.json');

const cor = {
  ok: (t) => `\x1b[32m${t}\x1b[0m`,
  ruim: (t) => `\x1b[31m${t}\x1b[0m`,
  fraco: (t) => `\x1b[90m${t}\x1b[0m`,
};

const args = process.argv.slice(2);
const flag = (nome) => args.includes(nome);
const valorDe = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};
const arquivo = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--destino');

if (!arquivo || flag('--ajuda')) {
  console.log('Uso: node scripts/importa-leads-rh-csv.mjs planilha.csv [--gravar] [--gerar-id] [--destino arquivo.json]');
  process.exit(arquivo ? 0 : 1);
}

try {
  const destino = valorDe('--destino') ? resolve(valorDe('--destino')) : DESTINO_PADRAO;
  const existe = existsSync(destino);
  const anterior = existe ? JSON.parse(readFileSync(destino, 'utf8')) : { leads: [] };
  const existentes = anterior.leads ?? [];

  // A janela que o Meta ainda entrega começa no lead mais antigo vindo do Meta
  // (ids que não são os inventados por --gerar-id).
  const doMeta = existentes.filter((l) => !String(l.id).startsWith('csv-'));
  const inicioDaJanela = doMeta.map((l) => l.created_time).sort()[0];

  const r = importarCsv(decodificar(readFileSync(resolve(arquivo))), {
    gerarId: flag('--gerar-id'),
    apenasAntesDe: inicioDaJanela,
  });

  const idsExistentes = new Set(existentes.map((l) => String(l.id)));
  const novos = r.leads.filter((l) => !idsExistentes.has(String(l.id))).length;
  const jaExistiam = r.leads.length - novos;

  console.log('');
  console.log(cor.ok(`  ${r.lidas} linhas lidas`) + cor.fraco(`  · ${r.leads.length} leads válidos`));
  if (r.periodo) console.log(`  Período da planilha: ${r.periodo.de} a ${r.periodo.ate}`);
  console.log(`  ${novos} são novos · ${jaExistiam} já estavam no arquivo (o que já estava é mantido)`);
  if (r.repetidos) console.log(cor.fraco(`  ${r.repetidos} repetidos dentro da própria planilha`));
  if (r.pulados) console.log(cor.fraco(`  ${r.pulados} pulados por já virem do Meta (evita duplicar)`));

  const porFormulario = {};
  for (const l of r.leads) porFormulario[l.form_name ?? '(sem formulário)'] = (porFormulario[l.form_name ?? '(sem formulário)'] ?? 0) + 1;
  Object.entries(porFormulario).forEach(([f, n]) => console.log(cor.fraco(`    ${n} · ${f}`)));

  if (r.rejeitadas.length) {
    console.log('');
    console.log(cor.ruim(`  ${r.rejeitadas.length} linhas NÃO entraram:`));
    r.rejeitadas.slice(0, 10).forEach((x) => console.log(`    linha ${x.linha}: ${x.motivo}`));
    if (r.rejeitadas.length > 10) console.log(cor.fraco(`    ... e mais ${r.rejeitadas.length - 10}`));
  }

  if (!flag('--gravar')) {
    console.log('');
    console.log(cor.fraco('  Simulação: nada foi gravado. Acrescente --gravar para gravar.'));
    console.log('');
    process.exit(0);
  }

  // O que já estava no arquivo vale mais que a planilha: veio da API, com o
  // conjunto de anúncio e o formulário completos. Por isso `existentes` é o
  // segundo argumento (o que sobrescreve).
  const { leads } = mesclarLeads(r.leads, existentes);
  writeFileSync(
    destino,
    JSON.stringify({
      // Importar não é capturar: a data de captura e o aviso de agendamento
      // continuam os do arquivo, para a tela não parecer mais fresca do que é.
      geradoEm: anterior.geradoEm ?? new Date().toISOString(),
      automatica: anterior.automatica ?? false,
      leads,
    }),
  );

  const datas = leads.map((l) => l.created_time).sort();
  console.log('');
  console.log(cor.ok(`  ${leads.length} candidatos no arquivo`) + cor.fraco(`  (de ${datas[0].slice(0, 10)} a ${datas[datas.length - 1].slice(0, 10)})`));
  console.log('');
} catch (e) {
  console.error('\n  ' + cor.ruim('FALHOU: ') + e.message + '\n');
  process.exit(1);
}
