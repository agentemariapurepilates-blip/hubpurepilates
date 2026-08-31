import { jsPDF } from 'jspdf';
import logoUrl from '@/assets/logo-pure-pilates.png';

import {
  HORIZONTES,
  NOME_DA_PLATAFORMA,
  PLATAFORMAS,
  avaliarMes,
  avaliarMesTotal,
  avaliarSemanas,
  cargasDesalinhadas,
  detalheDoMeta,
  horizonteComum,
  situacao,
  ultimoDiaDe,
  type Avaliacao,
  type Comparacao,
  type Plataforma,
  type Situacao,
} from './avaliacao';

/**
 * O relatório da avaliação de mídia, em PDF.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE AS RESSALVAS VÊM NA PRIMEIRA PÁGINA
 * ────────────────────────────────────────────────────────────────────────────
 * Um PDF é feito para viajar. Ele vai para o WhatsApp, para o e-mail da
 * diretoria, para uma reunião com a agência — e chega lá sem a tela por perto.
 * Tudo o que a tela explica ao lado do número (que o Google parou de carregar,
 * que o total para no horizonte comum, que o GA4 está fora) some no caminho se
 * não estiver impresso.
 *
 * Por isso as ressalvas não são rodapé: elas ficam no topo, antes das tabelas,
 * do mesmo jeito que ficam na tela. Um relatório que se apresenta completo
 * usando parte do dado leva à decisão errada com a confiança de quem viu tudo.
 */

type RGB = [number, number, number];

/**
 * As cores saem do token da marca, e não copiadas de outro PDF do projeto.
 *
 * `--primary: 350 72% 45%` em `index.css` é hsl(350,72%,45%) = rgb(197,32,60),
 * e o fim do gradiente, hsl(350,72%,35%) = rgb(154,25,46). O catálogo da Pure
 * Store usa um vermelho ligeiramente diferente por ser mais antigo que o
 * token; copiar de lá deixaria o relatório fora do tom da tela que o gerou.
 */
const VERMELHO: RGB = [197, 32, 60];
const VERMELHO_ESCURO: RGB = [154, 25, 46];
const GRAFITE: RGB = [35, 31, 32];
const CINZA: RGB = [120, 120, 120];
const CINZA_CLARO: RGB = [232, 232, 232];

/** As cores das faixas de atingimento, iguais às da tela. */
const COR_DA_SITUACAO: Record<Situacao, RGB> = {
  acima: [180, 120, 10],
  'no-alvo': [21, 128, 61],
  abaixo: [180, 120, 10],
  'muito-abaixo': [190, 30, 45],
};

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const rotuloDoMes = (mes: string) => {
  const [ano, numero] = mes.split('-').map(Number);
  return `${MESES[numero - 1]} de ${ano}`;
};

const diaCurto = (data: string) => {
  const [, mes, dia] = data.split('-');
  return `${dia}/${mes}`;
};

const reais = (n: number) =>
  `R$ ${Math.round(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
const inteiro = (n: number) => Math.round(n).toLocaleString('pt-BR');

const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n)}%`);

const valorDe = (c: Pick<Comparacao, 'dinheiro'>, n: number) => (c.dinheiro ? reais(n) : inteiro(n));

/**
 * Quanto se espera pelo logo antes de gerar o relatório sem ele.
 *
 * Existe porque `onerror` nem sempre dispara: num ambiente sem decodificador
 * de imagem — jsdom, um navegador com o asset bloqueado, um cache offline que
 * falhou — a imagem não carrega E não avisa. Sem o prazo, a promessa nunca
 * resolveria e o botão ficaria em "Gerando…" para sempre, sem erro nenhum para
 * a pessoa clicar em cima.
 *
 * O relatório vale mais que o logo: passado o prazo, ele sai sem a marca.
 */
const PRAZO_DO_LOGO = 3000;

/** Carrega o logo e converte para JPEG, que é o que o jsPDF embute melhor. */
function carregarLogo(): Promise<{ dataUrl: string; w: number; h: number } | null> {
  return new Promise((resolve) => {
    let respondido = false;
    const responder = (valor: { dataUrl: string; w: number; h: number } | null) => {
      if (respondido) return;
      respondido = true;
      clearTimeout(prazo);
      resolve(valor);
    };

    const prazo = setTimeout(() => responder(null), PRAZO_DO_LOGO);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return responder(null);
      // Fundo branco: o logo é PNG com transparência, e sem isto o JPEG
      // resultante fica com o fundo preto.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      try {
        responder({ dataUrl: canvas.toDataURL('image/jpeg', 0.9), w: img.width, h: img.height });
      } catch {
        responder(null);
      }
    };
    img.onerror = () => responder(null);
    img.src = logoUrl;
  });
}

const M = 14;
const LARGURA = 210;
const ALTURA = 297;
const UTIL = LARGURA - M * 2;

interface Cursor {
  y: number;
  pagina: number;
}

function novaPagina(doc: jsPDF, cursor: Cursor) {
  doc.addPage();
  cursor.pagina += 1;
  cursor.y = M + 6;
}

/** Abre página nova quando o que vem a seguir não cabe. */
function garantirEspaco(doc: jsPDF, cursor: Cursor, altura: number) {
  if (cursor.y + altura > ALTURA - 18) novaPagina(doc, cursor);
}

function titulo(doc: jsPDF, cursor: Cursor, texto: string, subtitulo?: string) {
  garantirEspaco(doc, cursor, subtitulo ? 16 : 12);
  doc.setTextColor(...GRAFITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(texto, M, cursor.y);
  cursor.y += 5;

  if (subtitulo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...CINZA);
    for (const linha of doc.splitTextToSize(subtitulo, UTIL) as string[]) {
      doc.text(linha, M, cursor.y);
      cursor.y += 3.6;
    }
  }
  cursor.y += 2;
}

/* ------------------------------------------------------------------------- */
/* Tabela                                                                    */
/* ------------------------------------------------------------------------- */

interface Coluna {
  titulo: string;
  largura: number;
  alinhar?: 'esquerda' | 'direita';
}

interface Celula {
  texto: string;
  cor?: RGB;
  negrito?: boolean;
}

function tabela(doc: jsPDF, cursor: Cursor, colunas: Coluna[], linhas: Celula[][]) {
  const alturaDaLinha = 6;

  const cabecalho = () => {
    doc.setFillColor(...VERMELHO);
    doc.rect(M, cursor.y, UTIL, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);

    let x = M + 2;
    for (const coluna of colunas) {
      const alinhado = coluna.alinhar === 'direita';
      doc.text(coluna.titulo, alinhado ? x + coluna.largura - 4 : x, cursor.y + 4.8, {
        align: alinhado ? 'right' : 'left',
      });
      x += coluna.largura;
    }
    cursor.y += 7;
  };

  garantirEspaco(doc, cursor, 7 + alturaDaLinha * 3);
  cabecalho();

  linhas.forEach((linha, i) => {
    if (cursor.y + alturaDaLinha > ALTURA - 18) {
      novaPagina(doc, cursor);
      cabecalho();
    }

    if (i % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(M, cursor.y, UTIL, alturaDaLinha, 'F');
    }

    let x = M + 2;
    doc.setFontSize(7.5);
    colunas.forEach((coluna, j) => {
      const celula = linha[j] ?? { texto: '' };
      doc.setTextColor(...(celula.cor ?? GRAFITE));
      doc.setFont('helvetica', celula.negrito ? 'bold' : 'normal');
      const alinhado = coluna.alinhar === 'direita';
      doc.text(
        celula.texto,
        alinhado ? x + coluna.largura - 4 : x,
        cursor.y + alturaDaLinha - 1.9,
        { align: alinhado ? 'right' : 'left', maxWidth: coluna.largura - 4 },
      );
      x += coluna.largura;
    });

    cursor.y += alturaDaLinha;
  });

  doc.setDrawColor(...CINZA_CLARO);
  doc.line(M, cursor.y, LARGURA - M, cursor.y);
  cursor.y += 6;
}

/** Três células de comparação: realizado, meta e o atingimento colorido. */
function celulasDe(a: Avaliacao, chave: Comparacao['chave']): Celula[] {
  const c = a.comparacoes.find((x) => x.chave === chave)!;
  const s = situacao(c.atingimento);

  return [
    { texto: valorDe(c, c.realizado) },
    { texto: valorDe(c, c.planejado), cor: CINZA },
    { texto: pct(c.atingimento), cor: s ? COR_DA_SITUACAO[s] : CINZA, negrito: true },
  ];
}

/* ------------------------------------------------------------------------- */

export interface OpcoesDoRelatorio {
  /** O mês detalhado nas seções de destaque e na avaliação semanal. */
  mes: string;
  meses: string[];
}

export async function gerarRelatorioDaAvaliacao({
  mes,
  meses,
}: OpcoesDoRelatorio): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logo = await carregarLogo();
  const cursor: Cursor = { y: 0, pagina: 1 };

  /* --- faixa da marca --------------------------------------------------- */
  doc.setFillColor(...VERMELHO);
  doc.rect(0, 0, LARGURA, 30, 'F');
  // Um segundo retângulo mais escuro à direita imita o gradiente da tela sem
  // precisar rasterizar imagem nenhuma.
  doc.setFillColor(...VERMELHO_ESCURO);
  doc.rect(LARGURA * 0.62, 0, LARGURA * 0.38, 30, 'F');

  if (logo) {
    const largura = 30;
    const altura = (largura * logo.h) / logo.w;
    doc.addImage(logo.dataUrl, 'JPEG', M, 7, largura, Math.min(altura, 15));
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Avaliação de mídia', M, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const geradoEm = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Gerado em ${geradoEm}`, LARGURA - M, 25, { align: 'right' });

  cursor.y = 38;

  /* --- o mês em destaque ------------------------------------------------ */
  const total = avaliarMesTotal(mes);
  const porPlataforma = PLATAFORMAS.map((p) => avaliarMes(mes, p)).filter(
    (a): a is Avaliacao => a !== null,
  );

  if (!total) {
    doc.setTextColor(...GRAFITE);
    doc.text('Sem PDM para o mês escolhido.', M, cursor.y);
    return doc.output('blob');
  }

  const verba = total.comparacoes.find((c) => c.chave === 'verba')!;
  const conversoes = total.comparacoes.find((c) => c.chave === 'conversoes')!;

  titulo(
    doc,
    cursor,
    rotuloDoMes(mes),
    total.emCurso
      ? `Mês em curso: ${total.diasCorridos} de ${total.diasNoMes} dias. As metas são a fatia do plano correspondente aos dias já corridos.`
      : `Mês fechado, ${total.diasNoMes} dias.`,
  );

  // Os três números que respondem "como foi o mês" antes de qualquer tabela.
  const destaques: Array<[string, string, string, Situacao | null]> = [
    ['Verba', reais(verba.realizado), `meta ${reais(verba.planejado)}`, situacao(verba.atingimento)],
    [
      'Conversões',
      inteiro(conversoes.realizado),
      `meta ${inteiro(conversoes.planejado)}`,
      situacao(conversoes.atingimento),
    ],
    [
      'Atingimento',
      pct(verba.atingimento),
      'da verba planejada',
      situacao(verba.atingimento),
    ],
  ];

  garantirEspaco(doc, cursor, 22);
  const largura = (UTIL - 8) / 3;
  destaques.forEach(([rotulo, valor, nota, s], i) => {
    const x = M + i * (largura + 4);
    doc.setDrawColor(...CINZA_CLARO);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, cursor.y, largura, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...CINZA);
    doc.text(rotulo.toUpperCase(), x + 3, cursor.y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...(s ? COR_DA_SITUACAO[s] : GRAFITE));
    doc.text(valor, x + 3, cursor.y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...CINZA);
    doc.text(nota, x + 3, cursor.y + 15.8);
  });
  cursor.y += 24;

  /* --- ressalvas, antes das tabelas ------------------------------------- */
  const ressalvas: string[] = [
    'A avaliação compara a fatia de cada plataforma no PDM com o que ela entregou. ' +
      'O plano cobre Meta e Google; o Google Analytics está FORA da análise porque a coleta ' +
      'caiu depois de abril/26 — menos de cem sessões por mês, com as conversões zeradas.',
  ];

  if (cargasDesalinhadas()) {
    ressalvas.push(
      `As cargas estão em datas diferentes: ${PLATAFORMAS.map(
        (p) => `${NOME_DA_PLATAFORMA[p]} até ${diaCurto(ultimoDiaDe(p))}`,
      ).join(', ')}. Cada plataforma é avaliada até onde o dado dela vai, e o TOTAL do mês ` +
        `para em ${diaCurto(horizonteComum())} — somar períodos diferentes daria um total que ` +
        'não é de mês nenhum.',
    );
  }

  ressalvas.push(
    'O PDM planeja o mês, não a semana. A meta de cada semana é a fatia proporcional aos dias ' +
      'dela que caem dentro do mês.',
  );

  garantirEspaco(doc, cursor, 10 + ressalvas.length * 8);
  doc.setDrawColor(...VERMELHO);
  doc.setFillColor(253, 246, 247);
  const alturaDaCaixa =
    5 +
    ressalvas.reduce(
      (soma, r) => soma + (doc.splitTextToSize(r, UTIL - 10) as string[]).length * 3.4 + 2,
      0,
    );
  doc.roundedRect(M, cursor.y, UTIL, alturaDaCaixa, 1.5, 1.5, 'FD');

  let yTexto = cursor.y + 5;
  doc.setFontSize(7);
  for (const ressalva of ressalvas) {
    doc.setTextColor(...VERMELHO_ESCURO);
    doc.setFont('helvetica', 'bold');
    doc.text('•', M + 3, yTexto);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAFITE);
    for (const linha of doc.splitTextToSize(ressalva, UTIL - 10) as string[]) {
      doc.text(linha, M + 6, yTexto);
      yTexto += 3.4;
    }
    yTexto += 2;
  }
  cursor.y += alturaDaCaixa + 8;

  /* --- avaliação mensal -------------------------------------------------- */
  titulo(
    doc,
    cursor,
    'Avaliação mensal',
    'Cada plataforma contra a sua fatia do PDM, do mês mais recente para o mais antigo.',
  );

  // A coluna da plataforma leva 30mm porque precisa caber "Google Ads (11/08)"
  // numa linha só: com 26 o texto quebrava em duas e desalinhava a linha
  // inteira. As oito somam exatamente os 182mm úteis da página.
  const colunasMensal: Coluna[] = [
    { titulo: 'Mês', largura: 28 },
    { titulo: 'Plataforma', largura: 30 },
    { titulo: 'Verba', largura: 24, alinhar: 'direita' },
    { titulo: 'Meta', largura: 23, alinhar: 'direita' },
    { titulo: '%', largura: 14, alinhar: 'direita' },
    { titulo: 'Conversões', largura: 24, alinhar: 'direita' },
    { titulo: 'Meta', largura: 23, alinhar: 'direita' },
    { titulo: '%', largura: 16, alinhar: 'direita' },
  ];

  const linhasMensal: Celula[][] = [];
  for (const m of meses) {
    const doMes = PLATAFORMAS.map((p) => avaliarMes(m, p)).filter(
      (a): a is Avaliacao => a !== null,
    );
    const totalDoMes = avaliarMesTotal(m);

    doMes.forEach((a, i) => {
      linhasMensal.push([
        { texto: i === 0 ? rotuloDoMes(m) : '', negrito: i === 0 },
        {
          texto: `${NOME_DA_PLATAFORMA[a.plataforma!]}${a.emCurso ? ` (${diaCurto(a.ate)})` : ''}`,
          cor: CINZA,
        },
        ...celulasDe(a, 'verba'),
        ...celulasDe(a, 'conversoes'),
      ]);
    });

    if (totalDoMes) {
      linhasMensal.push([
        { texto: '' },
        {
          texto: `Total${totalDoMes.emCurso ? ` (${diaCurto(totalDoMes.ate)})` : ''}`,
          negrito: true,
        },
        ...celulasDe(totalDoMes, 'verba').map((c) => ({ ...c, negrito: true })),
        ...celulasDe(totalDoMes, 'conversoes').map((c) => ({ ...c, negrito: true })),
      ]);
    }
  }

  tabela(doc, cursor, colunasMensal, linhasMensal);

  /* --- por plataforma, no mês em destaque -------------------------------- */
  titulo(doc, cursor, `Detalhe de ${rotuloDoMes(mes)}`);

  for (const a of porPlataforma) {
    garantirEspaco(doc, cursor, 26);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...VERMELHO_ESCURO);
    doc.text(NOME_DA_PLATAFORMA[a.plataforma!], M, cursor.y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...CINZA);
    doc.text(
      `${a.diasCorridos} de ${a.diasNoMes} dias` + (a.emCurso ? `, até ${diaCurto(a.ate)}` : ''),
      LARGURA - M,
      cursor.y,
      { align: 'right' },
    );
    cursor.y += 4;

    const colunasIndicador: Coluna[] = [
      { titulo: 'Indicador', largura: 46 },
      { titulo: 'Realizado', largura: 34, alinhar: 'direita' },
      { titulo: 'Meta', largura: 34, alinhar: 'direita' },
      { titulo: 'Atingimento', largura: 68, alinhar: 'direita' },
    ];

    tabela(
      doc,
      cursor,
      colunasIndicador,
      a.comparacoes.map((c) => {
        const s = situacao(c.atingimento);
        return [
          { texto: c.nome },
          { texto: valorDe(c, c.realizado) },
          { texto: valorDe(c, c.planejado), cor: CINZA },
          { texto: pct(c.atingimento), cor: s ? COR_DA_SITUACAO[s] : CINZA, negrito: true },
        ];
      }),
    );

    // A quebra que só o Meta tem, e a ausência dela que só o Google tem: as
    // duas precisam estar escritas, senão o leitor supõe que o Google também
    // separa agendamento de lead.
    const nota =
      a.plataforma === 'meta'
        ? (() => {
            const d = detalheDoMeta(`${mes}-01`, a.ate);
            return `Das conversões do Meta, ${inteiro(d.agendamentos)} são agendamentos de aula e ${inteiro(d.leads)} são leads de formulário (RH, Academy, franquias).`;
          })()
        : 'O Google devolve a conversão como um número só, sem separar agendamento de lead. A quebra não existe no dado.';

    doc.setFontSize(6.5);
    doc.setTextColor(...CINZA);
    for (const linha of doc.splitTextToSize(nota, UTIL) as string[]) {
      doc.text(linha, M, cursor.y);
      cursor.y += 3.2;
    }
    cursor.y += 5;
  }

  /* --- avaliação semanal ------------------------------------------------- */
  for (const plataforma of PLATAFORMAS) {
    const semanas = avaliarSemanas(mes, plataforma as Plataforma);
    if (semanas.length === 0) continue;

    titulo(
      doc,
      cursor,
      `Avaliação semanal · ${NOME_DA_PLATAFORMA[plataforma]}`,
      'Semanas de segunda a domingo, contando só os dias que caem dentro do mês.',
    );

    tabela(
      doc,
      cursor,
      [
        { titulo: 'Semana', largura: 36 },
        { titulo: 'Dias', largura: 16, alinhar: 'direita' },
        { titulo: 'Verba', largura: 26, alinhar: 'direita' },
        { titulo: 'Meta', largura: 26, alinhar: 'direita' },
        { titulo: '%', largura: 16, alinhar: 'direita' },
        { titulo: 'Conversões', largura: 26, alinhar: 'direita' },
        { titulo: 'Meta', largura: 22, alinhar: 'direita' },
        { titulo: '%', largura: 14, alinhar: 'direita' },
      ],
      semanas.map((s) => {
        const v = s.comparacoes.find((c) => c.chave === 'verba')!;
        const c = s.comparacoes.find((x) => x.chave === 'conversoes')!;
        const sv = situacao(v.atingimento);
        const sc = situacao(c.atingimento);

        return [
          { texto: `${diaCurto(s.de)} a ${diaCurto(s.ate)}` },
          { texto: `${s.diasNoMes}${s.completa ? '' : '*'}`, cor: CINZA },
          { texto: reais(v.realizado) },
          { texto: reais(v.planejado), cor: CINZA },
          { texto: pct(v.atingimento), cor: sv ? COR_DA_SITUACAO[sv] : CINZA, negrito: true },
          { texto: inteiro(c.realizado) },
          { texto: inteiro(c.planejado), cor: CINZA },
          { texto: pct(c.atingimento), cor: sc ? COR_DA_SITUACAO[sc] : CINZA, negrito: true },
        ];
      }),
    );

    if (semanas.some((s) => !s.completa)) {
      doc.setFontSize(6.5);
      doc.setTextColor(...CINZA);
      doc.text('* semana ainda em andamento', M, cursor.y);
      cursor.y += 5;
    }
  }

  /* --- rodapé em todas as páginas ---------------------------------------- */
  const totalDePaginas = doc.getNumberOfPages();
  for (let p = 1; p <= totalDePaginas; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(...CINZA_CLARO);
    doc.line(M, ALTURA - 12, LARGURA - M, ALTURA - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...CINZA);
    doc.text(
      'Plano: RISE_PURE-PILATES_PDM_BRANDPERFORMANCE_Q425Q126_11319 · Realizado: Meta e Google via SmartAds',
      M,
      ALTURA - 8,
    );
    doc.text(`${p} de ${totalDePaginas}`, LARGURA - M, ALTURA - 8, { align: 'right' });
  }

  return doc.output('blob');
}

/** O nome do arquivo, sem caractere que o Windows recuse. */
export function nomeDoArquivo(mes: string): string {
  return `avaliacao-de-midia-${mes}-pure-pilates.pdf`;
}

export const RESUMO_DAS_COBERTURAS = HORIZONTES;
