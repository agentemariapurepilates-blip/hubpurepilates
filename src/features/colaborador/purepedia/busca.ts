import type { ArtigoPurePedia } from './artigos';

/**
 * Busca da PurePedia.
 *
 * Fica separada da tela pra poder ser testada sozinha — a precisão dela é o que
 * faz a página valer, já que quem chega normalmente já sabe o termo que quer
 * ("retroativo", "royalties", "no-show").
 */

/** Tira acento e caixa, pra "divergencia" achar "divergência". */
export const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export interface Resultado {
  artigo: ArtigoPurePedia;
  score: number;
  /** Onde os termos bateram — vira a etiqueta "encontrado em". */
  origens: string[];
}

/**
 * Casa TODOS os termos digitados (AND) e pontua por onde bateu: título pesa mais
 * que palavra-chave, que pesa mais que o corpo do artigo. Um termo que não
 * aparece em lugar nenhum descarta o artigo — é isso que evita resultado solto.
 * Consulta vazia devolve tudo, na ordem original.
 */
export function buscar(artigos: readonly ArtigoPurePedia[], consulta: string): Resultado[] {
  const termos = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (termos.length === 0) return artigos.map((artigo) => ({ artigo, score: 0, origens: [] }));

  const resultados: Resultado[] = [];

  for (const artigo of artigos) {
    const titulo = normalizar(artigo.title);
    const descricao = normalizar(artigo.description);
    const chaves = artigo.keywords.map(normalizar);
    const corpo = normalizar(artigo.conteudo);

    let score = 0;
    const origens = new Set<string>();
    let casouTudo = true;

    for (const termo of termos) {
      let achou = false;

      if (titulo.includes(termo)) {
        // Título que começa com o termo vale mais que menção no meio.
        score += titulo.startsWith(termo) ? 120 : 80;
        origens.add('título');
        achou = true;
      }
      if (chaves.some((k) => k === termo)) {
        score += 60;
        origens.add('palavra-chave');
        achou = true;
      } else if (chaves.some((k) => k.includes(termo))) {
        score += 35;
        origens.add('palavra-chave');
        achou = true;
      }
      if (descricao.includes(termo)) {
        score += 25;
        origens.add('descrição');
        achou = true;
      }
      if (corpo.includes(termo)) {
        score += 10;
        origens.add('conteúdo');
        achou = true;
      }

      if (!achou) {
        casouTudo = false;
        break;
      }
    }

    if (casouTudo) resultados.push({ artigo, score, origens: [...origens] });
  }

  return resultados.sort((a, b) => b.score - a.score);
}
