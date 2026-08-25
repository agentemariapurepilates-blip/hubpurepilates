/**
 * O que os anúncios estão DIZENDO — os textos que foram ao ar.
 *
 * O Cérebro descreve o que cada campanha existe para fazer; isto mostra o que
 * ela de fato fala. São coisas diferentes, e a distância entre as duas é onde
 * mora o problema: uma campanha de RH cujo texto não menciona a vaga, ou uma de
 * aula experimental prometendo desconto que a unidade não conhece.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ONDE O META GUARDA O TEXTO — TRÊS LUGARES, NÃO UM
 * ────────────────────────────────────────────────────────────────────────────
 * Ler só um deles perde a maior parte dos anúncios:
 *
 *   1. `creative.body` / `creative.title` — anúncio simples, criado à mão.
 *   2. `object_story_spec.link_data` (ou `video_data`) — o formato mais comum,
 *      onde `message` é o texto e `name` é o título.
 *   3. `asset_feed_spec` — DCO. Aqui os textos são LISTAS de variações, e o
 *      Meta combina automaticamente. Um anúncio pode ter cinco textos.
 *
 * Em 24/08/2026 a conta tinha 264 anúncios, 55 ativos, e os três formatos
 * conviviam.
 */

/** Um anúncio como a Graph API devolve, com o criativo expandido. */
export interface AnuncioBruto {
  id: string;
  name?: string | null;
  effective_status?: string | null;
  adset?: { name?: string | null } | null;
  campaign?: { name?: string | null } | null;
  creative?: {
    body?: string | null;
    title?: string | null;
    call_to_action_type?: string | null;
    object_story_spec?: {
      link_data?: CorpoDoAnuncio | null;
      video_data?: CorpoDoAnuncio | null;
    } | null;
    asset_feed_spec?: {
      bodies?: Array<{ text?: string | null }> | null;
      titles?: Array<{ text?: string | null }> | null;
      descriptions?: Array<{ text?: string | null }> | null;
      call_to_action_types?: string[] | null;
    } | null;
  } | null;
}

interface CorpoDoAnuncio {
  message?: string | null;
  name?: string | null;
  description?: string | null;
  link?: string | null;
  call_to_action?: { type?: string | null; value?: { link?: string | null } | null } | null;
}

export interface Criativo {
  anuncioId: string;
  anuncio: string;
  conjunto: string | null;
  campanha: string | null;
  ativo: boolean;
  /** Todas as variações de texto, sem repetir. */
  textos: string[];
  titulos: string[];
  descricoes: string[];
  cta: string | null;
  link: string | null;
}

const semRepetir = (valores: Array<string | null | undefined>): string[] => [
  ...new Set(valores.filter((v): v is string => Boolean(v && v.trim())).map((v) => v.trim())),
];

export function lerCriativo(bruto: AnuncioBruto): Criativo {
  const criativo = bruto.creative ?? {};
  const historia = criativo.object_story_spec ?? {};
  // `link_data` e `video_data` nunca vêm juntos: é imagem/carrossel ou vídeo.
  const corpo = historia.link_data ?? historia.video_data ?? {};
  const feed = criativo.asset_feed_spec ?? {};

  const cta =
    corpo.call_to_action?.type ??
    criativo.call_to_action_type ??
    (feed.call_to_action_types ?? [])[0] ??
    null;

  return {
    anuncioId: bruto.id,
    anuncio: bruto.name ?? '(sem nome)',
    conjunto: bruto.adset?.name ?? null,
    campanha: bruto.campaign?.name ?? null,
    ativo: bruto.effective_status === 'ACTIVE',
    textos: semRepetir([
      criativo.body,
      corpo.message,
      ...(feed.bodies ?? []).map((b) => b?.text),
    ]),
    titulos: semRepetir([
      criativo.title,
      corpo.name,
      ...(feed.titles ?? []).map((t) => t?.text),
    ]),
    descricoes: semRepetir([
      corpo.description,
      ...(feed.descriptions ?? []).map((d) => d?.text),
    ]),
    cta,
    link: corpo.call_to_action?.value?.link ?? corpo.link ?? null,
  };
}

/**
 * Só o que é inequivocamente errado.
 *
 * Texto repetido entre anúncios FICOU DE FORA de propósito. Parecia o achado
 * mais forte — 21 grupos de anúncios ativos com texto idêntico —, mas olhar os
 * nomes desfaz a suspeita: quase todos são o par `motion` e `post` do mesmo
 * conjunto, ou três versões de vídeo da mesma campanha. Manter o texto e variar
 * a arte é justamente como se testa criativo. Alertar isso encheria a tela de
 * 21 alarmes falsos e ensinaria a ignorar a lista inteira — inclusive as duas
 * linhas que importam. Quantos anúncios usam cada texto continua visível no
 * resumo da campanha, como informação, sem virar acusação.
 */
export type TipoDeDefeito = 'caractere-invisivel' | 'espaco-duplicado' | 'sem-texto' | 'sem-cta';

export interface Defeito {
  tipo: TipoDeDefeito;
  anuncioId: string;
  anuncio: string;
  campanha: string | null;
  /** O que está errado, com o trecho quando dá para mostrar. */
  detalhe: string;
}

/**
 * Tab, espaço rígido e espaço de largura zero: invisíveis para quem escreveu
 * o texto, visíveis para quem lê o anúncio.
 *
 * Escritos como escape, e não como o caractere de verdade. Um espaço rígido
 * literal aqui seria indistinguível de um espaço comum para quem abrisse o
 * arquivo, e qualquer formatador poderia trocá-lo por um espaço normal sem que
 * ninguém percebesse — desligando esta verificação em silêncio.
 */
const INVISIVEIS = /[\t\u00a0\u200b]/;

/** Duas ou mais palavras separadas por mais de um espaço. */
const ESPACO_DUPLO = /\S {2,}\S/;

function trecho(texto: string, regex: RegExp): string {
  const achado = regex.exec(texto);
  if (!achado) return '';
  const inicio = Math.max(0, achado.index - 25);
  return `…${texto.slice(inicio, achado.index + achado[0].length + 25).replace(/\t/g, '⇥').replace(/\u00a0/g, '␣')}…`;
}

/**
 * Os defeitos dos anúncios QUE ESTÃO NO AR.
 *
 * Anúncio pausado não incomoda ninguém — listá-lo afogaria o que importa numa
 * lista de coisas que já não rodam.
 */
export function defeitosDosCriativos(criativos: Criativo[]): Defeito[] {
  const ativos = criativos.filter((c) => c.ativo);
  const defeitos: Defeito[] = [];

  const anotar = (c: Criativo, tipo: TipoDeDefeito, detalhe: string) =>
    defeitos.push({
      tipo,
      anuncioId: c.anuncioId,
      anuncio: c.anuncio,
      campanha: c.campanha,
      detalhe,
    });

  for (const criativo of ativos) {
    const todos = [...criativo.textos, ...criativo.titulos, ...criativo.descricoes];

    if (todos.length === 0) {
      anotar(criativo, 'sem-texto', 'A API não devolveu nenhum texto para este anúncio.');
    }

    if (!criativo.cta) {
      anotar(criativo, 'sem-cta', 'Sem botão de ação definido no criativo.');
    }

    for (const texto of todos) {
      if (INVISIVEIS.test(texto)) {
        anotar(
          criativo,
          'caractere-invisivel',
          `Tem tabulação ou espaço rígido no meio da frase, que sai como espaço torto no anúncio: ${trecho(texto, INVISIVEIS)}`,
        );
        break;
      }
    }

    for (const texto of todos) {
      if (ESPACO_DUPLO.test(texto.replace(/\n/g, ''))) {
        anotar(
          criativo,
          'espaco-duplicado',
          `Espaço duplicado no meio da frase: ${trecho(texto.replace(/\n/g, ' '), ESPACO_DUPLO)}`,
        );
        break;
      }
    }
  }

  return defeitos;
}

/** Um texto e em quantos anúncios no ar ele aparece. */
export interface Uso {
  texto: string;
  anuncios: number;
}

export interface ResumoDaCampanha {
  campanha: string;
  ativos: number;
  total: number;
  /** Textos distintos entre os anúncios no ar, do mais usado ao menos usado. */
  textos: Uso[];
  titulos: Uso[];
  descricoes: Uso[];
  ctas: string[];
}

/**
 * Conta em quantos ANÚNCIOS cada texto aparece.
 *
 * Um anúncio DCO pode listar o mesmo texto duas vezes; contar ocorrências em
 * vez de anúncios inflaria o número e diria menos.
 */
function contarUsos(anuncios: Criativo[], campo: (c: Criativo) => string[]): Uso[] {
  const contagem = new Map<string, number>();
  for (const anuncio of anuncios) {
    for (const texto of new Set(campo(anuncio))) {
      contagem.set(texto, (contagem.get(texto) ?? 0) + 1);
    }
  }

  return [...contagem.entries()]
    .map(([texto, anuncios]) => ({ texto, anuncios }))
    .sort((a, b) => b.anuncios - a.anuncios || a.texto.localeCompare(b.texto));
}

/** Um resumo por campanha, do que mais tem anúncio no ar para o que menos tem. */
export function agruparPorCampanha(criativos: Criativo[]): ResumoDaCampanha[] {
  const mapa = new Map<string, Criativo[]>();
  for (const criativo of criativos) {
    const campanha = criativo.campanha ?? '(sem campanha)';
    mapa.set(campanha, [...(mapa.get(campanha) ?? []), criativo]);
  }

  return [...mapa.entries()]
    .map(([campanha, lista]) => {
      const ativos = lista.filter((c) => c.ativo);
      return {
        campanha,
        ativos: ativos.length,
        total: lista.length,
        textos: contarUsos(ativos, (c) => c.textos),
        titulos: contarUsos(ativos, (c) => c.titulos),
        descricoes: contarUsos(ativos, (c) => c.descricoes),
        ctas: semRepetir(ativos.map((c) => c.cta)),
      };
    })
    .sort((a, b) => b.ativos - a.ativos || a.campanha.localeCompare(b.campanha));
}
