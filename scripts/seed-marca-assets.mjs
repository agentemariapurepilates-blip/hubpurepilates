// Carga inicial da biblioteca "Assets de marca" a partir da pasta do kit de marca.
//
// Uso (uma vez, depois da migration 20261117120000_marca_assets.sql):
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/seed-marca-assets.mjs "~/Documents/Kits de marca"
//
// A pasta segue o padrão do Canva: uma subpasta por unidade de negócio e, dentro
// dela, subpastas opcionais (ex.: "Pure Store/Coleção Move"). Logos já cadastrados
// (mesma unidade + subpasta + nome) são pulados, então rodar de novo não duplica.
// Depois da carga, os logos novos entram pela tela Assets de marca, no Hub.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const URL_ = process.env.SUPABASE_URL;
const CHAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASTA = (process.argv[2] || '~/Documents/Kits de marca').replace(/^~/, os.homedir());
if (!URL_ || !CHAVE) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

/** "Quando usar" de cada logo do kit atual. Logo sem frase aqui entra com uma frase genérica. */
const DESCRICOES = {
  'logo-pure-pilates.png':
    'Logo oficial da Pure Pilates, versão positiva (fundo claro). Para artes institucionais e das unidades.',
  'logo-pure-store.png':
    'Logo principal da Pure Store. Para qualquer arte da loja: produtos, promoções, tabela de preços, uniformes.',
  'logo-colecao-move.png':
    'Logo da Coleção Move, coleção da Pure Store. Para artes de peças, lançamento ou pré-venda da coleção Move.',
  'logo-academy.png':
    'Logo da Pure Academy. Para cursos, formação de instrutores, workshops e conteúdos de educação.',
  'logo-pure-franchising-preto.png':
    'Logo da Pure Franchising (preto, para fundo claro). Para expansão, venda de franquias e comunicação com franqueados.',
  'logo-pilates-play.png': 'Logo da Pilates Play. Para artes da plataforma de aulas Pilates Play.',
};

const NOMES = {
  'logo-pure-pilates.png': 'Pure Pilates — oficial',
  'logo-pure-store.png': 'Pure Store',
  'logo-colecao-move.png': 'Coleção Move',
  'logo-academy.png': 'Pure Academy',
  'logo-pure-franchising-preto.png': 'Pure Franchising — preto',
  'logo-pilates-play.png': 'Pilates Play',
};

const fatia = (t) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/(^-|-$)/g, '');

const tipos = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

/** Largura e altura do PNG, lidas do cabeçalho (sem dependências). */
function medidasPng(buf) {
  if (buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG') return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) };
  return { largura: null, altura: null };
}

const cab = { apikey: CHAVE, Authorization: `Bearer ${CHAVE}` };

const existentes = await (await fetch(`${URL_}/rest/v1/marca_assets?select=unidade,subpasta,nome`, { headers: cab })).json();
if (!Array.isArray(existentes)) {
  console.error('A tabela marca_assets não respondeu — a migration já foi aplicada?', existentes);
  process.exit(1);
}
const ja = new Set(existentes.map((e) => `${e.unidade}|${e.subpasta ?? ''}|${e.nome}`));

function* arquivos(dir, rel = []) {
  for (const nome of fs.readdirSync(dir)) {
    if (nome.startsWith('.')) continue;
    const cheio = path.join(dir, nome);
    if (fs.statSync(cheio).isDirectory()) yield* arquivos(cheio, [...rel, nome]);
    else if (tipos[path.extname(nome).toLowerCase()]) yield { cheio, nome, rel };
  }
}

let novos = 0;
for (const { cheio, nome, rel } of arquivos(PASTA)) {
  if (rel.length === 0) continue; // arquivo solto na raiz: sem unidade, fica de fora
  const unidade = rel[0].normalize('NFC');
  const subpasta = rel.slice(1).join(' / ').normalize('NFC') || null;
  const nomeAsset = NOMES[nome] ?? nome.replace(/\.[^.]+$/, '').replace(/[-_.]+/g, ' ');
  if (ja.has(`${unidade}|${subpasta ?? ''}|${nomeAsset}`)) {
    console.log(`já existe: ${unidade}${subpasta ? ` › ${subpasta}` : ''} · ${nomeAsset}`);
    continue;
  }
  const buf = fs.readFileSync(cheio);
  const caminho = [fatia(unidade), subpasta ? fatia(subpasta) : null, fatia(nome)].filter(Boolean).join('/');
  const up = await fetch(`${URL_}/storage/v1/object/marca-assets/${caminho}`, {
    method: 'POST',
    headers: { ...cab, 'Content-Type': tipos[path.extname(nome).toLowerCase()], 'x-upsert': 'true' },
    body: buf,
  });
  if (!up.ok) {
    console.error(`falhou o envio de ${nome}:`, await up.text());
    continue;
  }
  const { largura, altura } = medidasPng(buf);
  const linha = {
    unidade,
    subpasta,
    nome: nomeAsset,
    tipo: 'logo',
    descricao: DESCRICOES[nome] ?? `Logo ${nomeAsset} (${unidade}).`,
    arquivo_path: caminho,
    url: `${URL_}/storage/v1/object/public/marca-assets/${caminho}`,
    largura,
    altura,
  };
  const ins = await fetch(`${URL_}/rest/v1/marca_assets`, {
    method: 'POST',
    headers: { ...cab, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(linha),
  });
  if (!ins.ok) console.error(`falhou o cadastro de ${nome}:`, await ins.text());
  else {
    novos++;
    console.log(`ok: ${unidade}${subpasta ? ` › ${subpasta}` : ''} · ${nomeAsset}`);
  }
}
console.log(`${novos} asset(s) novo(s).`);
