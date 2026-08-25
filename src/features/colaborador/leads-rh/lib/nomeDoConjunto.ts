/**
 * Lê o nome de um conjunto de anúncios do Meta e devolve o que ele significa.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE ISTO MORA DENTRO DO LEADS RH
 * ────────────────────────────────────────────────────────────────────────────
 * Este código veio de `midia-paga/lib/nomenclatura.ts`, que saiu do Hub em
 * 25/08/2026 junto com o resto da mídia paga. O Leads RH ficou como único
 * consumidor: cada candidato chega com o `adset_name` do Meta, e é daqui que
 * sai a unidade a que ele pertence.
 *
 * Só a leitura de CONJUNTO foi trazida. A de campanha e a classificação por
 * frente ficaram para o SmartAds, com o resto do manual — nada aqui precisa
 * delas, e trazer junto criaria um pedaço morto que ninguém saberia manter.
 *
 * Se um dia outro módulo do Hub precisar disto, o lugar dele é uma pasta
 * neutra. Enquanto for um consumidor só, fica ao lado de quem usa.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * TUDO SEM ACENTO E EM MINÚSCULAS
 * ────────────────────────────────────────────────────────────────────────────
 * A conta tem "são-bernardo-do-campo" e "sao-bernardo-do-campo" convivendo. Sem
 * normalizar, a mesma unidade viraria duas.
 */

const SEPARADOR = '|';

/** Sufixo que o gerenciador do Meta cola quando alguém duplica no braço. */
const MARCA_DE_COPIA = /\s*—\s*c[óo]pia\s*$/i;

export interface NomeDeConjunto {
  formato: 'conjunto-dco' | 'conjunto-unidade' | 'conjunto-produto' | null;
  /** A unidade, quando o nome carrega uma. */
  unidade: string | null;
  regiao: string | null;
  /** cargos, advantage, leads, venda, rmkt... conforme o formato. */
  segmento: string | null;
  publico: string | null;
  /** Terminava com "— Cópia". */
  copia: boolean;
  noPadrao: boolean;
}

/** Minúsculas, sem acento, sem espaço sobrando. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function partesDe(nome: string): string[] {
  return nome
    .split(SEPARADOR)
    .map((parte) => parte.trim())
    .filter((parte) => parte.length > 0);
}

/** Contextos que abrem um nome de conjunto de produto (sem unidade). */
const ABERTURAS_DE_PRODUTO = new Set([
  'always-on',
  'site',
  'venda',
  'unidades',
  'locais',
  'novos-locais',
  'motion',
]);

/** Segmentos que aparecem na terceira posição do formato por unidade. */
const SEGMENTOS_DE_UNIDADE = new Set(['cargos', 'advantage']);

export function interpretarConjunto(nome: string): NomeDeConjunto {
  const copia = MARCA_DE_COPIA.test(nome);
  const partes = partesDe(normalizar(nome.replace(MARCA_DE_COPIA, '')));

  const vazio: NomeDeConjunto = {
    formato: null,
    unidade: null,
    regiao: null,
    segmento: null,
    publico: null,
    copia,
    noPadrao: false,
  };

  if (partes.length === 0) return vazio;

  // dco | interesses | leads | sacoma
  if (partes[0] === 'dco' && partes.length === 4) {
    return {
      formato: 'conjunto-dco',
      // Em "venda" o destino é um estado, não uma unidade — tratar estado como
      // unidade faria o painel inventar 15 unidades chamadas "bahia".
      unidade: partes[2] === 'leads' ? partes[3] : null,
      regiao: partes[2] === 'venda' ? partes[3] : null,
      segmento: partes[2],
      publico: partes[1],
      copia,
      noPadrao: true,
    };
  }

  // penha | sao-paulo | cargos | instrutor-pilates
  if (partes.length === 4 && SEGMENTOS_DE_UNIDADE.has(partes[2])) {
    return {
      formato: 'conjunto-unidade',
      unidade: partes[0],
      regiao: partes[1],
      segmento: partes[2],
      publico: partes[3],
      copia,
      noPadrao: true,
    };
  }

  // always-on | pilates play | interesses  /  site | rmkt | venda | todas
  if (partes.length >= 3 && ABERTURAS_DE_PRODUTO.has(partes[0])) {
    return {
      formato: 'conjunto-produto',
      unidade: null,
      regiao: null,
      segmento: partes[1],
      publico: partes.slice(2).join(' | '),
      copia,
      noPadrao: true,
    };
  }

  // sao-paulo | advantage | aberto-21-a-40-anos — região no lugar da unidade.
  if (partes.length === 3 && SEGMENTOS_DE_UNIDADE.has(partes[1])) {
    return {
      formato: 'conjunto-unidade',
      unidade: null,
      regiao: partes[0],
      segmento: partes[1],
      publico: partes[2],
      copia,
      noPadrao: true,
    };
  }

  return vazio;
}
