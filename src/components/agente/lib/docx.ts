import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from 'docx';
import { format, parseISO } from 'date-fns';
import { GeneratedContent, sceneCena, sceneNarracao } from '../types';

// ============================================================================
// Gera DOCX no estilo do template HTML da Pure (cabecalho vermelho + tabela
// Cena | Narracao). Pura: nao tem efeitos colaterais alem do download.
// O caller gerencia loading state se quiser.
// ============================================================================

const PURE_RED = 'C10230';
const LIGHT_GREY = 'FAFAFA';
const BORDER_GREY = 'EEEEEE';

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
} as const;

const greyBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GREY },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GREY },
  left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GREY },
  right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GREY },
} as const;

const headerItem = (label: string, value: string) => [
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: label.toUpperCase(), color: 'FFFFFF', size: 14 })] }),
  new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: value, color: 'FFFFFF', bold: true, size: 22 })] }),
];

function buildHeaderTable(post: GeneratedContent): Table {
  const safeFileTitle = post.title
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .slice(0, 40);
  const nomeArquivo = `[Redes sociais]_Estudio_${safeFileTitle || 'Roteiro'}_VH`;

  const headerLeftCell = new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: PURE_RED, color: 'auto' },
    margins: { top: 200, bottom: 200, left: 200, right: 200 },
    borders: noBorders,
    children: [
      ...headerItem('Campanha', 'CLIENTE: Estúdio'),
      ...headerItem('Observação', 'Vertical e horizontal'),
      ...headerItem('Produtora', 'BONIARTE'),
      ...headerItem('Direção', 'ANDRÉ ÂNGELO'),
    ],
  });

  const headerRightCell = new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: PURE_RED, color: 'auto' },
    margins: { top: 200, bottom: 200, left: 200, right: 200 },
    borders: noBorders,
    children: [
      ...headerItem('Nome do Arquivo', nomeArquivo),
      ...headerItem('Referência', post.description?.slice(0, 200) || post.title),
      ...headerItem('Apresentação', 'Professor(a) / Porta voz Pure Pilates'),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnSpan: 2,
            shading: { type: ShadingType.CLEAR, fill: PURE_RED, color: 'auto' },
            margins: { top: 400, bottom: 200, left: 400, right: 400 },
            borders: noBorders,
            children: [new Paragraph({ children: [new TextRun({ text: 'ROTEIROS', bold: true, color: 'FFFFFF', size: 36 })] })],
          }),
        ],
      }),
      new TableRow({ children: [headerLeftCell, headerRightCell] }),
    ],
  });
}

function buildRoteiroTable(post: GeneratedContent): Table {
  const cenas = Array.isArray(post.cenas) ? post.cenas : [];

  const roteiroHeader = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: PURE_RED, color: 'auto' },
        margins: { top: 200, bottom: 200, left: 200, right: 200 },
        children: [new Paragraph({ children: [new TextRun({ text: 'Cena', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: PURE_RED, color: 'auto' },
        margins: { top: 200, bottom: 200, left: 200, right: 200 },
        children: [new Paragraph({ children: [new TextRun({ text: 'Narração', bold: true, color: 'FFFFFF' })] })],
      }),
    ],
  });

  const cenaRows = cenas.map((c, idx) => {
    const shade = idx % 2 === 1
      ? { type: ShadingType.CLEAR, fill: LIGHT_GREY, color: 'auto' as const }
      : undefined;
    const cellOpts = {
      margins: { top: 240, bottom: 240, left: 200, right: 200 },
      borders: greyBorders,
      shading: shade,
    };
    return new TableRow({
      children: [
        new TableCell({ ...cellOpts, children: [new Paragraph({ children: [new TextRun(sceneCena(c) || '-')] })] }),
        new TableCell({ ...cellOpts, children: [new Paragraph({ children: [new TextRun(sceneNarracao(c) || '-')] })] }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [roteiroHeader, ...cenaRows],
  });
}

export async function downloadRoteiroDocx(post: GeneratedContent): Promise<void> {
  const cenas = Array.isArray(post.cenas) ? post.cenas : [];
  const fallbackRoteiro = post.versao_editada?.roteiro ?? post.roteiro ?? '';
  if (cenas.length === 0 && !fallbackRoteiro) {
    throw new Error('Esse conteúdo ainda não tem roteiro.');
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
    sections: [
      {
        properties: {},
        children: [
          buildHeaderTable(post),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun('')] }),
          buildRoteiroTable(post),
          ...(cenas.length === 0 && fallbackRoteiro
            ? [
                new Paragraph({ spacing: { before: 360 }, children: [new TextRun({ text: 'Roteiro (texto livre):', bold: true })] }),
                ...fallbackRoteiro.split('\n').map((line) => new Paragraph({ children: [new TextRun(line)] })),
              ]
            : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const safeTitle = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 50);
  const a = document.createElement('a');
  a.href = url;
  a.download = `roteiro-${format(parseISO(post.date), 'yyyy-MM-dd')}-${safeTitle}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Alignment exportado para outros usos do docx (caso necessario)
export { AlignmentType };
