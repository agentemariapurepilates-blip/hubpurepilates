/**
 * Lê os nomes de campanha e de conjunto e devolve o que eles significam.
 *
 * Os formatos reconhecidos aqui são exatamente os declarados em
 * `dados/cerebro.ts` (FORMATOS). Nome que não casa com nenhum deles não é um
 * erro do parser: é o sinal de que alguém nomeou fora do padrão, e o
 * diagnóstico mostra isso na regra `nome-fora-do-padrao`.
 *
 * Toda a leitura é feita sem acento e em minúsculas, porque a conta tem nomes
 * como "são-bernardo-do-campo" e "sao-bernardo-do-campo" convivendo.
 */

import { FRENTES } from '../dados/cerebro';

const SEPARADOR = '|';

/** Sufixo que o gerenciador do Meta cola quando alguém duplica no braço. */
const MARCA_DE_COPIA = /\s*—\s*c[óo]pia\s*$/i;

export interface NomeDeCampanha {
  /** A marca entre colchetes, quando existe. Ex.: "Rise". */
  marca: string | null;
  /** Formato de compra: dco, lead-ad, lead-site, venda, pure-pass, black-friday. */
  tipo: string | null;
  /** always-on, vendas, unidades. */
  contexto: string | null;
  /** A frente atendida, como escrita no nome. Ex.: apartadas, rh-instrutor. */
  publico: string | null;
  /** O nome bate com o formato `[marca] tipo | contexto | público`? */
  noPadrao: boolean;
  /** Bate no conteúdo mas erra o espaçamento em volta do "|". */
  espacamentoTorto: boolean;
}

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

export function interpretarCampanha(nome: string): NomeDeCampanha {
  const bruto = nome.trim();
  const comMarca = /^\[([^\]]+)\]\s*(.*)$/.exec(bruto);
  const marca = comMarca ? comMarca[1].trim() : null;
  const resto = comMarca ? comMarca[2] : bruto;

  const partes = partesDe(normalizar(resto));

  // O PÚBLICO É SEMPRE A ÚLTIMA PARTE, tenha o nome três partes ou duas.
  //
  // O padrão é `tipo | contexto | público`, mas em agosto/26 a agência
  // renomeou "[Rise] dco | always-on | apartadas" para "[Rise] always-on |
  // apartadas" — o tipo saiu, sobraram duas partes. Lendo por posição fixa, o
  // público virava null, a campanha caía no marcador do conjunto (que só diz
  // "interesses | leads | recife/casa-forte") e as apartadas inteiras
  // desapareciam do manual: R$ 4.400 classificados como "fora do manual" sem
  // nada ter mudado na operação, só no nome.
  //
  // `noPadrao` continua exigindo as três partes — o nome de duas ESTÁ fora da
  // convenção, e a regra que avisa isso deve seguir disparando. O que não pode
  // é a verba sumir do eixo por causa disso.
  const publico = partes.length >= 2 ? partes[partes.length - 1] : null;
  const [tipo, contexto] =
    partes.length >= 3 ? [partes[0], partes[1]] : [null, partes[0] ?? null];

  // Espaçamento: o padrão é " | ". "venda| always-on" tem o mesmo conteúdo e
  // ainda assim está fora do padrão — vale a pena avisar sem tratar como erro
  // grave, porque não quebra agrupamento nenhum.
  const separadoresTortos = (resto.match(/\S\||\|\S/g) ?? []).length > 0;

  return {
    marca,
    tipo,
    contexto,
    publico,
    noPadrao: partes.length === 3 && !separadoresTortos,
    espacamentoTorto: partes.length === 3 && separadoresTortos,
  };
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

/* ------------------------------------------------------------------------- */
/* De qual frente do manual isto é                                           */
/* ------------------------------------------------------------------------- */

/**
 * O público escrito no nome da campanha é quem manda.
 *
 * Um conjunto "dco | interesses | leads | sacoma" dentro da campanha
 * "[Rise] dco | always-on | apartadas" é APARTADAS, não DCO: o DCO ali é o
 * formato de compra, e a frente é para onde a verba foi. Ler pelo conjunto
 * classificaria toda a verba apartada como DCO genérico.
 */
const PUBLICO_PARA_FRENTE: Record<string, string> = {
  // Ainda não existe campanha com este público na conta. A chave fica declarada
  // para que a frente seja reconhecida no dia em que a agência criar a campanha,
  // em vez de aparecer como "fora do manual".
  agendamento: 'agendamento-de-aula',
  apartadas: 'apartadas',
  remarketing: 'remarketing',
  'rh-instrutor': 'rh',
  academy: 'academy',
  'academy-workshop': 'academy',
  'pilates play': 'pilates-play',
  'pilates-play': 'pilates-play',

  // Públicos do Google Ads. As duas campanhas de busca levam ao mesmo lugar
  // que o DCO do Meta — o agendamento da aula experimental —, e é assim que o
  // PDM as trata: as duas têm "Lead" como KPI e agendamento como resultado.
  // "institucional" é a busca por marca; "pilates", o termo genérico.
  institucional: 'agendamento-de-aula',
  pilates: 'agendamento-de-aula',
};

/** Só entra em ação quando o público é genérico ("todas"). */
const TIPO_PARA_FRENTE: Record<string, string> = {
  dco: 'dco',
};

export interface Classificacao {
  frenteId: string | null;
  /** Como a frente foi decidida — aparece na tela para a conta poder ser conferida. */
  origem: 'publico-da-campanha' | 'tipo-da-campanha' | 'marcador-no-conjunto' | 'nenhuma';
}

/**
 * O Google Ads usa outra convenção, e ela precisa ser lida também.
 *
 * O manual é de Meta E Google, mas o leitor só sabia ler o padrão do Meta
 * (`[Rise] tipo | contexto | público`). Os nomes do Google não têm marca entre
 * colchetes nem barras — são `rise_ao_search_cpa_institucional`, separados por
 * underscore. Sem este leitor, TODA a verba de Google caía como "fora do
 * manual": R$ 42.665 em agosto/26, 39% do investimento do mês.
 *
 * O que os segmentos dizem, do começo para o fim:
 *   `rise`         — a agência
 *   `ao` / `flight`— always-on ou campanha com data para acabar
 *   `search`/`video`— o formato
 *   `cpa` / `cpm`  — o modelo de compra
 *   `institucional`— o PÚBLICO, e é ele que decide a frente
 *
 * Como no Meta, o público é o ÚLTIMO segmento. É a única parte que precisa ser
 * lida para achar a frente; o resto fica aqui documentado porque quem for
 * conferir um nome torto vai precisar saber o que cada posição significa.
 */
export function interpretarCampanhaDoGoogle(nome: string): NomeDeCampanha {
  const partes = nome
    .trim()
    .toLowerCase()
    .split('_')
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    marca: partes[0] ?? null,
    tipo: partes[2] ?? null,
    contexto: partes[1] ?? null,
    publico: partes.length >= 2 ? normalizar(partes[partes.length - 1]) : null,
    // Cinco segmentos é o padrão observado na conta.
    noPadrao: partes.length === 5,
    espacamentoTorto: false,
  };
}

/**
 * De qual plataforma é este nome de campanha.
 *
 * Decidido pelo formato do próprio nome, e não por um parâmetro que os
 * chamadores teriam de passar: barra vertical é Meta, underscore é Google. Um
 * parâmetro seria mais uma coisa para alguém esquecer de atualizar, e o
 * esquecimento voltaria a jogar a verba do Google para fora do manual em
 * silêncio.
 */
export function plataformaDoNome(nomeCampanha: string): 'meta' | 'google' {
  return nomeCampanha.includes('|') || /^\s*\[/.test(nomeCampanha) ? 'meta' : 'google';
}

export function classificarFrente(nomeCampanha: string, nomeConjunto: string): Classificacao {
  const campanha =
    plataformaDoNome(nomeCampanha) === 'google'
      ? interpretarCampanhaDoGoogle(nomeCampanha)
      : interpretarCampanha(nomeCampanha);

  if (campanha.publico && PUBLICO_PARA_FRENTE[campanha.publico]) {
    return { frenteId: PUBLICO_PARA_FRENTE[campanha.publico], origem: 'publico-da-campanha' };
  }

  if (campanha.publico === 'todas' && campanha.tipo && TIPO_PARA_FRENTE[campanha.tipo]) {
    return { frenteId: TIPO_PARA_FRENTE[campanha.tipo], origem: 'tipo-da-campanha' };
  }

  // Se a campanha DECLAROU um público e ele não está no manual, para por aqui.
  //
  // Sem esta parada, "[Rise] venda | always-on | store" com o conjunto
  // "always-on | store | rmkt" cairia em Remarketing pelo marcador "rmkt" — e
  // remarketing, no manual, é uma frente de aula experimental. A verba da loja
  // entraria no eixo errado, com aparência de número certo. Público declarado e
  // não mapeado é uma decisão pendente (incluir "store" no manual ou não), não
  // um caso a ser adivinhado.
  if (campanha.publico) return { frenteId: null, origem: 'nenhuma' };

  // Último recurso, só quando o nome da campanha não diz nada: procurar os
  // marcadores da frente no nome do conjunto. A ordem das frentes no manual
  // decide o empate, então frente mais específica deve vir antes da mais
  // genérica em `dados/cerebro.ts`.
  const alvo = normalizar(nomeConjunto);
  for (const frente of FRENTES) {
    if (frente.marcadores.some((marcador) => alvo.includes(normalizar(marcador)))) {
      return { frenteId: frente.id, origem: 'marcador-no-conjunto' };
    }
  }

  return { frenteId: null, origem: 'nenhuma' };
}
