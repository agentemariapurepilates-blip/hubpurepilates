// Acabamento e conferência do texto que o Gemini devolve. Sem dependência do
// Deno, para ser testado no vitest e usado também pela tela do Hub, que mostra
// a mesma conferência enquanto o time edita.

const TAGS_PERMITIDAS = new Set(['h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br'])

// Entidades que o Gemini às vezes usa no lugar do acento (come&ccedil;o).
// &lt; &gt; &amp; e &quot; ficam como estão: decodificar abriria tag no texto.
const ENTIDADES: Record<string, string> = {
  nbsp: ' ', ordm: 'º', ordf: 'ª', deg: '°', hellip: '…', ndash: '-', mdash: '—',
  laquo: '«', raquo: '»', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', middot: '·',
}
for (const [base, letras] of Object.entries({ acute: 'aeiouyAEIOUY', grave: 'aeiouAEIOU', circ: 'aeiouAEIOU', tilde: 'anoANO', uml: 'aeiouAEIOU', cedil: 'cC' })) {
  for (const l of letras) ENTIDADES[`${l}${base}`] = `${l}${{ acute: '́', grave: '̀', circ: '̂', tilde: '̃', uml: '̈', cedil: '̧' }[base]}`.normalize('NFC')
}

export const decodificarEntidades = (texto: string): string =>
  texto
    .replace(/&#(\d+);/g, (m, n) => { const c = Number(n); return [38, 60, 62, 34].includes(c) ? m : String.fromCodePoint(c) })
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => { const c = parseInt(h, 16); return [38, 60, 62, 34].includes(c) ? m : String.fromCodePoint(c) })
    .replace(/&([a-z]+);/gi, (m, nome: string) => ENTIDADES[nome] ?? m)

/** O blog não usa travessão: vira vírgula. */
export const tirarTravessao = (texto: string): string => texto.replace(/\s*—\s*/g, ', ').trim()

/** Deixa só as tags do formato do blog, sem atributo, com acento de verdade e sem travessão. */
export const limparHtml = (html: string): string =>
  tirarTravessao(
    decodificarEntidades(
      html
        .replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, '')
        .replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (tag, nome: string) => {
          const n = nome.toLowerCase()
          if (!TAGS_PERMITIDAS.has(n)) return ''
          return tag.startsWith('</') ? `</${n}>` : `<${n}>`
        }),
    ),
  )

export const criarSlug = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .slice(0, 8)
    .join('-')

/** Minúsculas, sem acento, sem tag e com um espaço só: para comparar texto. */
export const normalizar = (texto: string): string =>
  decodificarEntidades(texto.replace(/<[^>]+>/g, ' '))
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const contem = (texto: string, termo: string) => ` ${normalizar(texto)} `.includes(` ${termo} `)
const ocorrencias = (texto: string, termo: string) => ` ${normalizar(texto)} `.split(` ${termo} `).length - 1

const PROIBIDO_GRATIS = /gr[aá]tis|gratuit|de gra[cç]a|sem custo|cortesia/i

export interface TextoParaConferir {
  titulo: string
  meta_descricao: string
  conteudo_html: string
}

/**
 * As regras obrigatórias do blog que dá para conferir no código. Devolve a lista
 * do que está faltando, em frases prontas para mostrar ao time; vazia é aprovado.
 */
export function conferirArtigo(artigo: TextoParaConferir, palavraChave: string): string[] {
  const problemas: string[] = []
  const termo = normalizar(palavraChave)
  const meta = artigo.meta_descricao.trim()
  const html = artigo.conteudo_html

  if (!artigo.titulo.trim()) problemas.push('Falta o título.')
  else if (artigo.titulo.trim().length > 60) problemas.push(`O título tem ${artigo.titulo.trim().length} caracteres; o máximo é 60.`)

  if (!meta) problemas.push('Falta a meta descrição.')
  else if (meta.length < 140 || meta.length > 160) problemas.push(`A meta descrição tem ${meta.length} caracteres; o ideal é de 140 a 160.`)

  if (!termo) {
    problemas.push('Falta a palavra-chave principal.')
  } else {
    if (artigo.titulo && !contem(artigo.titulo, termo)) problemas.push('A palavra-chave não está no título.')
    const primeiroParagrafo = html.match(/<p>([\s\S]*?)<\/p>/i)?.[1] ?? ''
    if (!contem(primeiroParagrafo, termo)) problemas.push('A palavra-chave não está no primeiro parágrafo.')
    const subtitulos = [...html.matchAll(/<h2>([\s\S]*?)<\/h2>/gi)].map((m) => m[1])
    if (!subtitulos.some((s) => contem(s, termo))) problemas.push('A palavra-chave não aparece em nenhum subtítulo.')
    if (meta && !contem(meta, termo)) problemas.push('A meta descrição não tem a palavra-chave.')
    const vezes = ocorrencias(html, termo)
    if (vezes < 3) problemas.push(`A palavra-chave aparece ${vezes} ${vezes === 1 ? 'vez' : 'vezes'} no texto; o ideal é de 3 a 6.`)
    else if (vezes > 8) problemas.push(`A palavra-chave aparece ${vezes} vezes no texto; pode soar forçado.`)
  }

  const subtitulosTotal = (html.match(/<h2>/gi) ?? []).length
  if (subtitulosTotal < 4) problemas.push(`O texto tem ${subtitulosTotal} subtítulos; o mínimo é 4.`)

  if ([artigo.titulo, meta, html].some((t) => PROIBIDO_GRATIS.test(decodificarEntidades(t)))) {
    problemas.push('O texto fala em aula grátis ou gratuita, o que é proibido.')
  }
  return problemas
}

/**
 * A palavra da pauta manda; a do Gemini só vale quando a pauta veio sem. Mas,
 * se as duas são a mesma palavra e só a do Gemini tem acento, fica a acentuada:
 * em 05/11/2026 uma pauta chegou como "transicao de carreira bem estar" e o
 * título saiu sem acento.
 */
export function escolherPalavraChave(daPauta: string | undefined, doGemini: string): string {
  const pauta = (daPauta ?? '').trim()
  const gemini = doGemini.trim()
  if (!pauta) return gemini
  if (gemini && normalizar(gemini) === normalizar(pauta) && gemini !== pauta) return gemini
  return pauta
}
