// Gerador do catálogo da Pure Store.
//
// O QUE FAZ: lê a loja oficial (loja.purepilates.com.br — Nuvemshop) e regenera
// src/data/pureStoreCatalogo.ts com TODOS os produtos do site (nome, preço,
// seção/categoria, foto e link), setorizados igual ao site. Remove os itens
// PURE BOX (B2B, não vão pro cliente final).
//
// COMO RODAR:
//   node scripts/gerar-catalogo-pure-store.mjs
//
// Depois, para publicar: commit + ./deploy.sh (o catálogo de todas as unidades
// passa a mostrar a lista nova automaticamente — os links não mudam).
//
// Recomendação: rodar ~1x por semana, ou quando a loja mudar.

import { writeFileSync } from 'node:fs';

const SITEMAP = 'https://loja.purepilates.com.br/sitemap.xml';

// Subcategorias de Vestuário do site (usadas pra setorizar). Os "tipos" têm
// prioridade sobre "Lançamentos" quando um produto está em mais de uma.
const CATEGORIAS = [
  ['Acessórios', 'https://loja.purepilates.com.br/vestuario/acessorios/'],
  ['Moletons', 'https://loja.purepilates.com.br/vestuario/moletom1/'],
  ['Camisetas', 'https://loja.purepilates.com.br/vestuario/camisetas/'],
  ['Cropped', 'https://loja.purepilates.com.br/vestuario/cropped/'],
  ['Legging', 'https://loja.purepilates.com.br/vestuario/legging/'],
  ['Lançamentos', 'https://loja.purepilates.com.br/vestuario/lancamentos/'],
];
const PRIORIDADE = CATEGORIAS.map(([nome]) => nome); // tipos primeiro, Lançamentos por último

const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (catalogo-generator)' } };
const dec = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

async function getText(url) {
  const r = await fetch(url, UA);
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  return r.text();
}

// 1) Sitemap → produtos (slug, url, primeira foto)
async function lerSitemap() {
  const xml = await getText(SITEMAP);
  const blocks = xml.split('<url>').slice(1).map((b) => b.split('</url>')[0]);
  const prods = [];
  for (const b of blocks) {
    const loc = (b.match(/<loc>([^<]+)<\/loc>/) || [])[1] || '';
    if (!loc.includes('/produtos/')) continue;
    const slug = (loc.match(/\/produtos\/([^/]+)\//) || [])[1] || '';
    const foto = (b.match(/<image:loc>([^<]+)<\/image:loc>/) || [])[1] || '';
    if (!slug || !foto) continue;
    prods.push({ slug, url: loc, foto });
  }
  return prods;
}

// 2) Páginas de categoria → slug pertence a quais categorias
async function lerCategorias() {
  const slugCats = {};
  for (const [nome, url] of CATEGORIAS) {
    const encontrados = new Set();
    for (let page = 1; page <= 6; page += 1) {
      let h = '';
      try {
        h = await getText(url + (page > 1 ? `?page=${page}` : ''));
      } catch {
        break;
      }
      const antes = encontrados.size;
      [...h.matchAll(/\/produtos\/([a-z0-9-]+)\//g)].forEach((m) => encontrados.add(m[1]));
      if (encontrados.size === antes) break; // sem novos → acabou a paginação
    }
    for (const s of encontrados) (slugCats[s] = slugCats[s] || []).push(nome);
  }
  return slugCats;
}

// Categoria de fallback (produtos fora do Vestuário): breadcrumb da página.
function breadcrumb(html) {
  const scripts = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => m[1],
  );
  for (const s of scripts) {
    try {
      const j = JSON.parse(s);
      for (const o of Array.isArray(j) ? j : [j]) {
        const bl = o && o.breadcrumb && o.breadcrumb.itemListElement;
        if (Array.isArray(bl)) {
          const names = bl
            .slice()
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map((e) => e.name)
            .filter(Boolean);
          if (names.length >= 2) {
            const c = names[names.length - 2];
            if (c && c !== 'Início') return dec(c);
          }
        }
      }
    } catch {
      /* ignora JSON-LD inválido */
    }
  }
  return 'Outros';
}

// 3) Página de produto → nome, preço, estoque e categoria final
async function lerProduto(p, slugCats) {
  const h = await getText(p.url);
  const price = (h.match(/nuvemshop:price"\s*content="([0-9.]+)"/) || [])[1];
  const stock = (h.match(/nuvemshop:stock"\s*content="([0-9-]+)"/) || [])[1];
  const title = (h.match(/og:title"\s*content="([^"]+)"/) || [])[1];

  const cats = slugCats[p.slug] || [];
  let categoria = PRIORIDADE.find((c) => cats.includes(c));
  if (!categoria) {
    const bc = breadcrumb(h);
    if (bc === 'Franquias') categoria = 'PURE BOX'; // B2B → será removido
    else if (bc === 'Meias') categoria = 'Meias';
    else if (['Acessórios', 'Moletons', 'Camisetas', 'Cropped', 'Legging', 'Lançamentos'].includes(bc))
      categoria = bc;
    else categoria = 'Outros';
  }
  return {
    nome: title ? dec(title) : p.slug,
    preco: price ? parseFloat(price) : 0,
    categoria,
    foto: p.foto,
    url: p.url,
    esgotado: stock === '0',
  };
}

async function emPool(itens, n, fn) {
  const out = new Array(itens.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < itens.length) {
        const idx = i;
        i += 1;
        try {
          out[idx] = await fn(itens[idx]);
        } catch {
          out[idx] = null;
        }
      }
    }),
  );
  return out.filter(Boolean);
}

// ---- Execução ----
console.log('Lendo sitemap...');
const base = await lerSitemap();
console.log(`  ${base.length} produtos no sitemap.`);

console.log('Lendo páginas de categoria...');
const slugCats = await lerCategorias();

console.log('Lendo páginas de produto...');
let prods = await emPool(base, 8, (p) => lerProduto(p, slugCats));

// Remove PURE BOX (B2B — não vai pro cliente final).
const antes = prods.length;
prods = prods.filter((p) => p.categoria !== 'PURE BOX');
console.log(`  Removidos ${antes - prods.length} itens PURE BOX. Total no catálogo: ${prods.length}.`);

const cont = {};
prods.forEach((p) => {
  cont[p.categoria] = (cont[p.categoria] || 0) + 1;
});
console.log('  Seções:', cont);

const linhas = prods
  .map(
    (o) =>
      '  { nome: ' +
      JSON.stringify(o.nome) +
      ', preco: ' +
      o.preco +
      ', categoria: ' +
      JSON.stringify(o.categoria) +
      ', foto: ' +
      JSON.stringify(o.foto) +
      ', url: ' +
      JSON.stringify(o.url) +
      (o.esgotado ? ', esgotado: true' : '') +
      ' }',
  )
  .join(',\n');

const ts = `// Catálogo Pure Store — todos os produtos do site (loja.purepilates.com.br, Nuvemshop).
// GERADO AUTOMATICAMENTE por scripts/gerar-catalogo-pure-store.mjs — não editar à mão.
// Para atualizar: node scripts/gerar-catalogo-pure-store.mjs  (depois commit + deploy).

export interface CatalogoProduto {
  nome: string;
  /** Preço no site, em R$. */
  preco: number;
  /** Seção/categoria do site. */
  categoria: string;
  /** Foto do produto (CDN da loja). */
  foto: string;
  /** Link direto do produto no site. */
  url: string;
  esgotado?: boolean;
}

export const catalogoProdutos: CatalogoProduto[] = [
${linhas},
];
`;

writeFileSync('src/data/pureStoreCatalogo.ts', ts);
console.log('OK → src/data/pureStoreCatalogo.ts atualizado.');
