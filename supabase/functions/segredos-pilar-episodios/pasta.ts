// Leitura da pasta do Drive da série "Os segredos de Pilar".
//
// Sem dependência de Deno: é importado pela Edge Function e pelos testes do
// vitest (src/features/geral/segredos-pilar/segredos-pilar.test.ts).
//
// A pasta é lida pela página "embeddedfolderview" do Drive, que devolve HTML
// para pastas compartilhadas por link, sem chave de API nem conta de serviço.
// Não é uma API documentada: se o Google mudar o HTML, lerPasta passa a
// devolver lista vazia e a aba mostra "nenhum episódio" — os testes daqui
// fixam o formato que existia em 16/09/2026.

export type ItemDaPasta = {
  id: string;
  nome: string;
  tipo: 'video' | 'pasta' | 'outro';
  /** Capa gerada pelo Drive (lh3.googleusercontent.com), sem o id do arquivo. */
  capa: string | null;
};

export type Episodio = {
  numero: number | null;
  titulo: string;
  driveId: string;
  capa: string | null;
};

export type Temporada = {
  /** null = vídeos soltos na raiz da pasta. */
  titulo: string | null;
  episodios: Episodio[];
};

const ENTIDADES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&nbsp;': ' ',
};

const decodificar = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTIDADES[e.toLowerCase()] ?? e);

const EXTENSOES_DE_VIDEO = /\.(mov|mp4|m4v|webm|mkv|avi|wmv|mpe?g)$/i;

export function lerPasta(html: string): ItemDaPasta[] {
  const itens: ItemDaPasta[] = [];
  // Cada item começa em <div class="flip-entry" id="entry-<id>">.
  const blocos = html.split('<div class="flip-entry"').slice(1);
  for (const bloco of blocos) {
    const id = bloco.match(/id="entry-([A-Za-z0-9_-]+)"/)?.[1];
    const nomeCru = bloco.match(/<div class="flip-entry-title">([^<]*)<\/div>/)?.[1];
    if (!id || nomeCru === undefined) continue;
    // NFC: arquivo enviado do Mac chega com o acento separado ("o" + U+0301) e
    // aí "Episódio" não casaria com as regras de limparTitulo.
    const nome = decodificar(nomeCru).normalize('NFC').trim();

    const ehPasta = /\/drive\/folders\//.test(bloco);
    const ehVideo = /\/type\/video\//.test(bloco) || EXTENSOES_DE_VIDEO.test(nome);
    const capaCrua = bloco.match(/<div class="flip-entry-thumb"><img src="([^"]+)"/)?.[1];

    itens.push({
      id,
      nome,
      tipo: ehPasta ? 'pasta' : ehVideo ? 'video' : 'outro',
      // =s190 é a miniatura da listagem; =w1280 pede a mesma imagem maior.
      capa: capaCrua ? decodificar(capaCrua).replace(/=s\d+$/, '=w1280') : null,
    });
  }
  return itens;
}

// Sufixos de trabalho que não podem aparecer para quem assiste:
// "-v5", "_v3", " V2", "(1)", "- Cópia", "_final", "-revisado"...
// "final"/"revisado" só saem colados por "_" ou "-": "A Grande Final" é título.
const SUFIXOS_DE_TRABALHO = [
  /[\s_\-.]*v\s?\d+(\.\d+)?$/i,
  /[\s_\-.]*vers[aã]o\s*\d+$/i,
  /\s*\(\d+\)$/,
  /[\s_\-.]*(c[oó]pia|copy)$/i,
  /\s*[_-]\s*(final|revisad[oa]|editad[oa])$/i,
];

export function limparTitulo(nomeDoArquivo: string): { numero: number | null; titulo: string } {
  let nome = nomeDoArquivo.normalize('NFC').trim().replace(EXTENSOES_DE_VIDEO, '');

  // Tira sufixos em sequência ("-v5 final" some inteiro).
  let anterior: string;
  do {
    anterior = nome;
    for (const sufixo of SUFIXOS_DE_TRABALHO) nome = nome.replace(sufixo, '');
  } while (nome !== anterior && nome.length > 0);

  nome = nome.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

  // "Episódio 1 - Título", "Ep. 01: Título", "E01 Título", "01 - Título".
  // Número sem prefixo exige separador: "10 exercícios" é título, não episódio 10.
  const partes =
    nome.match(/^(?:epis[oó]dio|ep\.?|e)\s*(\d{1,3})\s*[-–—:.]?\s*(.+)$/i) ??
    nome.match(/^(\d{1,3})\s*[-–—:.]\s*(.+)$/);
  if (partes) {
    return { numero: Number(partes[1]), titulo: capitalizar(partes[2].trim()) };
  }
  return { numero: null, titulo: capitalizar(nome) };
}

const capitalizar = (s: string) => (s ? s[0].toLocaleUpperCase('pt-BR') + s.slice(1) : s);

export function montarEpisodios(itens: ItemDaPasta[]): Episodio[] {
  return itens
    .filter((i) => i.tipo === 'video')
    .map((i) => ({ ...limparTitulo(i.nome), driveId: i.id, capa: i.capa }))
    .sort((a, b) => {
      // Numerados primeiro, na ordem; sem número vão pro fim, por título.
      if (a.numero !== null && b.numero !== null) return a.numero - b.numero;
      if (a.numero !== null) return -1;
      if (b.numero !== null) return 1;
      return a.titulo.localeCompare(b.titulo, 'pt-BR');
    });
}

export function tituloDaTemporada(nomeDaPasta: string): string {
  return nomeDaPasta.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Ordena temporadas pelo primeiro número do nome ("Temporada 2" antes de "Temporada 10"). */
export function ordenarTemporadas(temporadas: Temporada[]): Temporada[] {
  const numero = (t: Temporada) => {
    if (t.titulo === null) return -1; // raiz primeiro
    const n = t.titulo.match(/\d+/)?.[0];
    return n ? Number(n) : Number.MAX_SAFE_INTEGER;
  };
  return [...temporadas]
    .filter((t) => t.episodios.length > 0)
    .sort((a, b) => numero(a) - numero(b) || (a.titulo ?? '').localeCompare(b.titulo ?? '', 'pt-BR'));
}
