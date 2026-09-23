// Peças comuns dos PDFs da Pure Store: identidade da marca, logo e rodapé.
//
// Texto nativo do jsPDF (Helvetica), como nos contratos do Academy: o PDF fica
// leve, o texto dá para selecionar e copiar, e não depende de fonte embutida.

import type { jsPDF } from 'jspdf';

const LOGO = '/images/pure-design/pure-pilates-logo-trim.png';

// Cores da marca (as mesmas dos templates do Pure Design).
export const VERMELHO: [number, number, number] = [193, 32, 48];
export const ESCURO: [number, number, number] = [35, 31, 32];
export const CINZA: [number, number, number] = [130, 130, 130];
export const LINHA: [number, number, number] = [225, 219, 211];

export const MARGEM = 18;
export const RODAPE_Y = 282;

export const dataCurta = (d: Date) => d.toLocaleDateString('pt-BR');

/** "2026-09-23" vira "23/09/2026" sem passar por Date: assim o fuso não muda o dia. */
export const diaBR = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

export const dinheiro = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Sem a logo o PDF ainda sai — só que sem ela. Não vale travar o download por isso. */
async function carregarLogo(): Promise<{ dataUrl: string; proporcao: number } | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = LOGO;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return { dataUrl: canvas.toDataURL('image/png'), proporcao: img.naturalWidth / img.naturalHeight };
  } catch {
    return null;
  }
}

/** Logo à esquerda, título e data à direita, faixa vermelha embaixo. Devolve o y livre. */
export async function cabecalhoDaMarca(
  doc: jsPDF,
  { titulo, subtitulo }: { titulo: string; subtitulo: string },
) {
  const largura = doc.internal.pageSize.getWidth();
  const logo = await carregarLogo();
  if (logo) {
    const altura = 13;
    doc.addImage(logo.dataUrl, 'PNG', MARGEM, 16, altura * logo.proporcao, altura);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...ESCURO);
  doc.text(titulo, largura - MARGEM, 23, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...CINZA);
  doc.text(subtitulo, largura - MARGEM, 29, { align: 'right' });

  doc.setFillColor(...VERMELHO);
  doc.rect(MARGEM, 36, largura - MARGEM * 2, 1.2, 'F');

  return 47;
}

export function rodape(doc: jsPDF, criadoEm: Date) {
  const largura = doc.internal.pageSize.getWidth();
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...CINZA);
    doc.text('Pure Pilates · Pure Store', MARGEM, RODAPE_Y);
    doc.text(
      `Gerado em ${dataCurta(criadoEm)}${paginas > 1 ? `  ·  Página ${p} de ${paginas}` : ''}`,
      largura - MARGEM,
      RODAPE_Y,
      { align: 'right' },
    );
  }
}

/** Tira acento e espaço do nome do arquivo. */
export const nomeLimpo = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
