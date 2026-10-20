// A arte do Pure GPT, composta — não gerada.
//
// POR QUE ASSIM (decisão de 19/10/2026): os modelos de imagem grátis erram onde
// mais dói numa peça de marca — acento no título, logotipo cortado, cor fora da
// paleta, rosto inventado no lugar do instrutor de verdade. Testamos quatro
// deles. Então o agente parou de desenhar e passou a MONTAR: ele escolhe fundo,
// escreve o texto, decide posição, peso e hierarquia, e o Hub renderiza. O que
// sai é exatamente o que foi pedido, porque é HTML, não alucinação.
//
// O AGENTE DEVOLVE JSON, NÃO HTML. HTML vindo de modelo entraria na página do
// Hub e qualquer coisa escondida nele rodaria junto. Com JSON, quem escreve o
// HTML é este arquivo, e só com o que está descrito aqui.
//
// As medidas são em POR CENTO da arte (0 a 100), não em pixels: o modelo acerta
// muito mais "o título começa a 8% da esquerda" do que "em 86px", e a mesma
// composição serve a qualquer formato.
//
// FORMAS, MOLDURAS E LOGO seguem o brand book (repo pure-pilates-mcp,
// content/layout/): formas-permitidas.md, formas-contorno-e-assets.md e
// 01-marca-e-logo.md. O que lá está em px para um elemento de ~500px, aqui está
// proporcional — e as armadilhas que o próprio brand book registra (o "ovo" do
// raio 50% num elemento alto, o logo positivo sobre fundo escuro) estão
// resolvidas no código, não deixadas a cargo do agente.

import logoCompleto from '@/assets/logo-pure-pilates.png';
import logoP from '@/assets/logo-symbol.png';

// Por ora só o 4:5, que é o formato do feed e o dos fundos que temos. Os
// outros entram quando houver fundo desenhado para eles: esticar um 4:5 num
// story deformaria os arcos da marca.
export type Proporcao = '4:5';

/** O tamanho real de cada formato, em pixels, na hora de exportar. */
export const TAMANHOS: Record<Proporcao, { largura: number; altura: number }> = {
  '4:5': { largura: 1080, altura: 1350 },
};

/**
 * A paleta, fechada: o agente escolhe entre estas, nunca inventa um hex.
 *
 * O vermelho é #C12030, o do brand book. Não confundir com #c10230, que circula
 * em material antigo com os dígitos trocados — o guia de cores cita esse erro
 * pelo nome para ninguém repetir.
 */
export const CORES = {
  vermelho: '#c12030',
  grafite: '#231f20',
  cinza: '#7d7c7c',
  // Secundária, no máximo uma por peça — e nunca nas formas da marca.
  laranja: '#db9828',
  branco: '#ffffff',
  'cinza-claro': '#f2f0ef',
} as const;
export type Cor = keyof typeof CORES;

export const corDe = (c: string) => CORES[c as Cor] ?? CORES.grafite;

/**
 * Os fundos que o agente pode escolher.
 *
 * SÃO LIMPOS DE PROPÓSITO: sem texto e sem pessoa gravados. Os fundos do Pure
 * Design não servem aqui — quase todos já trazem a frase da peça ("FELIZ
 * ANIVERSÁRIO", "AVISO!") e modelos fotografados, então um comunicado feito
 * sobre o fundo do aniversário sairia com a palavra errada escrita.
 *
 * `escuro` diz se o fundo é escuro: é dele que saem a cor do texto e a versão
 * do logotipo, sem o agente precisar decidir.
 *
 * `limpo` marca o fundo que não tem nenhum grafismo. É nele que as formas da
 * marca entram para dar ritmo à peça; sobre os arcos elas competiriam.
 */
export const FUNDOS = [
  {
    id: 'claro',
    nome: 'Claro com arcos',
    url: '/images/pure-gpt/fundos/claro-arcos.png',
    escuro: false,
    limpo: false,
  },
  {
    id: 'vermelho',
    nome: 'Vermelho da marca, com arcos',
    url: '/images/pure-gpt/fundos/vermelho-arcos.png',
    escuro: true,
    limpo: false,
  },
  {
    id: 'creme',
    nome: 'Creme liso',
    url: '/images/pure-gpt/fundos/creme-liso.png',
    escuro: false,
    limpo: true,
  },
];

export const fundoPorId = (id: string) => FUNDOS.find((f) => f.id === id);

/** Fundo escuro pede texto claro e logotipo branco. Cor chapada: só o vermelho e o grafite. */
const fundoEscuro = (id: string) =>
  fundoPorId(id)?.escuro ?? (id === 'vermelho' || id === 'grafite');

/* ── Formas da marca ────────────────────────────────────────────────────
   O repertório fechado do brand book. Todas saem de `border-radius`, então
   renderizam em qualquer lugar e nunca ficam serrilhadas.

   A PÉTALA é a forma-assinatura: três cantos bem redondos + UM canto reto. O
   canto reto não é defeito, é a marca — por isso toda forma assimétrica aqui
   mantém um.
   ────────────────────────────────────────────────────────────────────── */

export type NomeForma =
  | 'petala'       // a assinatura: 3 cantos redondos + 1 reto
  | 'circulo'
  | 'pilula'       // pontas totalmente arredondadas
  | 'arco'         // só os dois cantos de cima, tipo hero
  | 'meia-pilula'  // "D": arredondado de um lado só
  | 'banner'       // faixa com rabinho, para destacar uma frase
  | 'canto'        // retângulo com um único canto arredondado
  | 'linha'
  | 'retangulo';

/** Qual canto é o reto (ou de qual lado está o arco), nas formas assimétricas. */
export type Canto = 'inferior-direito' | 'inferior-esquerdo' | 'superior-esquerdo' | 'superior-direito';

const CANTOS: Canto[] = [
  'inferior-direito',
  'inferior-esquerdo',
  'superior-esquerdo',
  'superior-direito',
];

/** A ordem do `border-radius`: superior-esquerdo, superior-direito, inferior-direito, inferior-esquerdo. */
const ORDEM: Canto[] = [
  'superior-esquerdo',
  'superior-direito',
  'inferior-direito',
  'inferior-esquerdo',
];

/**
 * O raio da pétala, em cqh (1cqh = 1% da altura da arte).
 *
 * O brand book registra o erro a evitar: `50%` num elemento mais alto que largo
 * vira ovo, e raio pequeno com um canto reto faz o canto parecer defeito. A
 * receita que funciona é raio generoso, porém MENOR que a metade do lado curto —
 * sobra um trecho de borda reta entre as curvas, e o canto reto vira estilo.
 */
const raioPetala = (larguraCqh: number, alturaCqh: number) => {
  const curto = Math.min(larguraCqh, alturaCqh);
  const quadrado = larguraCqh / alturaCqh > 0.8 && larguraCqh / alturaCqh < 1.25;
  return quadrado ? curto / 2 : curto * 0.42;
};

/** O `border-radius` de cada forma, já no canto pedido. */
function raioDaForma(forma: NomeForma, canto: Canto, larguraCqh: number, alturaCqh: number): string {
  const curto = Math.min(larguraCqh, alturaCqh);
  const monta = (reto: Canto, raio: number) =>
    ORDEM.map((c) => (c === reto ? '0' : `${raio.toFixed(2)}cqh`)).join(' ');

  switch (forma) {
    case 'circulo':
      return '50%';
    case 'pilula':
      return '999px';
    case 'arco':
      // Topo arredondado: os dois cantos de cima (ou de baixo, se invertido).
      return canto.startsWith('superior') ? '0 0 999px 999px' : '999px 999px 0 0';
    case 'meia-pilula':
      return canto.endsWith('esquerdo') ? '999px 0 0 999px' : '0 999px 999px 0';
    case 'banner':
      // Faixa com rabinho: o canto reto fica na ponta de onde ela "sai".
      return monta(canto, curto * 0.7);
    case 'canto':
      // Um único canto arredondado, o oposto do reto das outras formas.
      return ORDEM.map((c) => (c === canto ? `${(curto * 0.8).toFixed(2)}cqh` : '0')).join(' ');
    case 'petala':
      return monta(canto, raioPetala(larguraCqh, alturaCqh));
    default:
      return '0';
  }
}

export interface TextoEl {
  tipo: 'texto';
  texto: string;
  /** Canto superior esquerdo da caixa, em % da arte. */
  x: number;
  y: number;
  /** Largura da caixa em %, que é onde o texto quebra. */
  largura: number;
  /**
   * Altura da caixa em %. O texto NÃO sai dela: se não couber no tamanho
   * pedido, ele encolhe até caber.
   */
  altura: number;
  /** Altura da letra em % da altura da arte: 3 é apoio, 12 é manchete. */
  tamanho: number;
  /** 400, 700 ou 800 — os pesos de Montserrat que o PNG exportado embute. */
  peso: 400 | 700 | 800;
  cor: Cor;
  alinhamento?: 'left' | 'center' | 'right';
  italico?: boolean;
  maiusculas?: boolean;
  /** Espaço entre letras, em % do tamanho. Útil em títulos curtos. */
  espacamento?: number;
}

/**
 * As fotos que a pessoa subiu, dentro das formas da marca.
 *
 * O agente dá a ÁREA e diz quais fotos entram; quem divide em uma, duas ou três
 * molduras é este arquivo. É de propósito: o número de molduras é uma função do
 * número de fotos, e deixar o agente calcular posição de cada uma só rendia
 * sobreposição.
 */
export interface MolduraEl {
  tipo: 'moldura';
  /** Índices das fotos enviadas, na ordem. De 1 a 3. */
  fotos: number[];
  /** A área que as molduras ocupam, em % da arte. */
  x: number;
  y: number;
  largura: number;
  altura: number;
  /** A forma de cada moldura. A pétala é a da marca e é o padrão. */
  forma?: NomeForma;
  /** Contorno em volta de cada moldura. */
  borda?: Cor;
}

export interface LogoEl {
  tipo: 'logo';
  /** `completo` é o padrão; `p` é só o símbolo, quando a marca inteira não cabe. */
  variante?: 'completo' | 'p';
  x: number;
  y: number;
  largura: number;
}

export interface FormaEl {
  tipo: 'forma';
  forma: NomeForma;
  x: number;
  y: number;
  largura: number;
  altura: number;
  cor: Cor;
  /** Cheia ou só a linha do contorno. O contorno dá leveza sobre fundo colorido. */
  preenchimento?: 'cheia' | 'contorno';
  canto?: Canto;
  opacidade?: number;
}

export type Elemento = TextoEl | MolduraEl | LogoEl | FormaEl;

export interface Composicao {
  proporcao: Proporcao;
  /** Id de um fundo de FUNDOS, ou uma cor da paleta. */
  fundo: string;
  elementos: Elemento[];
}

const escapar = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const limitar = (v: unknown, min: number, max: number, padrao: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : padrao;
};

/**
 * Quantas linhas o texto deve ocupar, e qual tamanho de letra cabe na caixa.
 *
 * POR QUE EXISTE: a primeira prova visual (19/10/2026) saiu com "FELIZ
 * ANIVERSÁRIO" por cima de "Kleber" e com uma manchete de duas linhas virando
 * quatro — porque o agente escolhe o y achando que o texto cabe numa linha, e
 * ele quebra em três. Pedir ao agente que "calcule" não resolve: ele não tem
 * como medir Montserrat.
 *
 * Então a caixa manda. A conta de quantos caracteres cabem por linha é uma
 * estimativa (Montserrat tem largura média conhecida por caixa), e a estimativa
 * é repetida algumas vezes porque encolher a letra também faz caber mais
 * caracteres por linha. Errar por pouco só deixa a letra um pouco menor do que
 * precisava; o que não acontece mais é um texto invadir o outro.
 */
function tamanhoQueCabe(el: TextoEl, larguraPx: number, alturaPx: number): number {
  const pedido = limitar(el.tamanho, 1.2, 20, 5);
  const caixaPx = limitar(el.altura, 1.5, 100, 12) * (alturaPx / 100);
  const blocoPx = limitar(el.largura, 5, 100, 80) * (larguraPx / 100);
  const texto = String(el.texto ?? '');
  if (!texto.trim()) return pedido;

  // Largura média de caractere em Montserrat, em frações da altura da letra.
  // Caixa alta é mais larga, e o espaçamento entre letras entra por fora.
  const medio = (el.maiusculas ? 0.7 : 0.56) + limitar(el.espacamento, 0, 40, 0) / 100;

  let tamanho = pedido;
  for (let volta = 0; volta < 4; volta += 1) {
    const letraPx = tamanho * (alturaPx / 100);
    const porLinha = Math.max(1, Math.floor(blocoPx / (letraPx * medio)));
    const linhas = texto
      .split('\n')
      .reduce((total, linha) => total + Math.max(1, Math.ceil(linha.length / porLinha)), 0);
    // 1.12 é o line-height. A folga de 5% só entra quando o texto quebra: é ali
    // que a estimativa pode errar uma linha. Numa linha só, a conta é exata e
    // tirar 5% do tamanho à toa estragaria a manchete.
    const precisaPx = linhas * 1.12 * letraPx * (linhas > 1 ? 1.05 : 1);
    if (precisaPx <= caixaPx) break;
    tamanho = Math.max(1.2, tamanho * (caixaPx / precisaPx));
  }
  return tamanho;
}

/**
 * Onde fica cada moldura dentro da área, em % DA ÁREA.
 *
 * Uma foto ocupa tudo. Duas se dividem no sentido mais folgado da área. Três
 * viram fila quando a área é larga e, quando não é, uma maior em cima com duas
 * embaixo — que é como a peça respira num 4:5.
 */
function vagas(quantas: number, proporcaoArea: number): { x: number; y: number; w: number; h: number }[] {
  const vao = 4; // respiro entre as molduras, em % da área
  if (quantas <= 1) return [{ x: 0, y: 0, w: 100, h: 100 }];

  if (quantas === 2) {
    const lado = (100 - vao) / 2;
    return proporcaoArea >= 1
      ? [{ x: 0, y: 0, w: lado, h: 100 }, { x: lado + vao, y: 0, w: lado, h: 100 }]
      : [{ x: 0, y: 0, w: 100, h: lado }, { x: 0, y: lado + vao, w: 100, h: lado }];
  }

  if (proporcaoArea >= 1.6) {
    const col = (100 - vao * 2) / 3;
    return [0, 1, 2].map((i) => ({ x: i * (col + vao), y: 0, w: col, h: 100 }));
  }

  const alta = 58;
  const baixa = 100 - alta - vao;
  const meia = (100 - vao) / 2;
  return [
    { x: 0, y: 0, w: 100, h: alta },
    { x: 0, y: alta + vao, w: meia, h: baixa },
    { x: meia + vao, y: alta + vao, w: meia, h: baixa },
  ];
}

/**
 * A composição vira HTML. Cada elemento é posicionado em % sobre a arte, então
 * o mesmo HTML serve para a prévia na tela e para a exportação em tamanho real.
 */
export function renderizar(c: Composicao, fotos: string[] = []): string {
  const fundo = fundoPorId(c.fundo);
  const fundoCss = fundo
    ? `background-image:url('${fundo.url}');background-size:cover;background-position:center`
    : `background:${corDe(c.fundo)}`;
  const escuro = fundoEscuro(c.fundo);

  // Para converter largura (% da arte) em cqh (% da ALTURA da arte), que é a
  // unidade dos raios: num 4:5, 100% de largura valem 80cqh.
  const { largura: lp, altura: ap } = TAMANHOS[c.proporcao] ?? TAMANHOS['4:5'];
  const emCqh = lp / ap;

  const partes = (c.elementos ?? []).map((el) => {
    const x = limitar((el as TextoEl).x, -10, 100, 0);
    const y = limitar((el as TextoEl).y, -10, 100, 0);

    if (el.tipo === 'texto') {
      const tamanho = tamanhoQueCabe(el, lp, ap);
      return `<div style="position:absolute;left:${x}%;top:${y}%;width:${limitar(el.largura, 5, 100, 80)}%;
        font-size:${tamanho.toFixed(2)}cqh;font-weight:${[400, 700, 800].includes(el.peso) ? el.peso : 700};
        color:${corDe(el.cor)};text-align:${el.alinhamento ?? 'left'};line-height:1.12;
        ${el.italico ? 'font-style:italic;' : ''}${el.maiusculas ? 'text-transform:uppercase;' : ''}
        ${el.espacamento ? `letter-spacing:${limitar(el.espacamento, 0, 40, 0) / 100}em;` : ''}
        white-space:pre-wrap;">${escapar(el.texto ?? '')}</div>`;
    }

    if (el.tipo === 'moldura') {
      const largura = limitar(el.largura, 10, 100, 60);
      const altura = limitar(el.altura, 10, 100, 40);
      const escolhidas = (Array.isArray(el.fotos) ? el.fotos : [])
        .map((i) => fotos[limitar(i, 0, 9, 0)])
        .filter(Boolean)
        .slice(0, 3);
      if (!escolhidas.length) return '';

      const forma = el.forma ?? 'petala';
      const lugares = vagas(escolhidas.length, (largura * emCqh) / altura);

      const molduras = escolhidas.map((src, i) => {
        const v = lugares[i];
        // O canto reto muda de moldura para moldura: é o ritmo visual que o
        // brand book pede quando a forma-assinatura se repete na peça.
        const canto = CANTOS[i % CANTOS.length];
        const raio = raioDaForma(forma, canto, (v.w / 100) * largura * emCqh, (v.h / 100) * altura);
        return `<div style="position:absolute;left:${v.x}%;top:${v.y}%;width:${v.w}%;height:${v.h}%;
          border-radius:${raio};overflow:hidden;
          ${el.borda ? `border:0.55cqh solid ${corDe(el.borda)};box-sizing:border-box;` : ''}">
          <img src="${src}" style="width:100%;height:100%;object-fit:cover;display:block"/></div>`;
      });

      return `<div style="position:absolute;left:${x}%;top:${y}%;width:${largura}%;height:${altura}%;">
        ${molduras.join('')}</div>`;
    }

    if (el.tipo === 'logo') {
      const src = el.variante === 'p' ? logoP : logoCompleto;
      // A versão segue o fundo, não o agente: positiva no claro, branca no
      // escuro. O brand book proíbe a positiva sobre fundo escuro, e o asset
      // negativo preferencial (Pure vermelho + PILATES branco) ainda não existe
      // no Hub — a branca 100% é a alternativa que ele próprio autoriza.
      const branca = escuro ? 'filter:brightness(0) invert(1);' : '';
      return `<img src="${src}" style="position:absolute;left:${x}%;top:${y}%;
        width:${limitar(el.largura, 8, 40, 18)}%;height:auto;display:block;${branca}"/>`;
    }

    const largura = limitar(el.largura, 0.2, 100, 20);
    const altura = el.forma === 'linha' ? 0.4 : limitar(el.altura, 0.2, 100, 10);
    const canto = CANTOS.includes(el.canto as Canto) ? (el.canto as Canto) : 'inferior-direito';
    const raio = raioDaForma(el.forma, canto, largura * emCqh, altura);
    const cor = corDe(el.cor);
    const pintura =
      el.preenchimento === 'contorno'
        ? `border:0.45cqh solid ${cor};box-sizing:border-box;`
        : `background:${cor};`;
    return `<div style="position:absolute;left:${x}%;top:${y}%;width:${largura}%;height:${altura}%;
      ${pintura}border-radius:${raio};opacity:${limitar(el.opacidade, 0.05, 1, 1)}"></div>`;
  });

  // container-type para o texto poder ser medido em cqh (altura da arte): é o
  // que faz a mesma composição sair igual na prévia pequena e no PNG grande.
  return `<div style="position:relative;width:100%;height:100%;container-type:size;overflow:hidden;
    font-family:Montserrat,system-ui,sans-serif;${fundoCss}">${partes.join('')}</div>`;
}
