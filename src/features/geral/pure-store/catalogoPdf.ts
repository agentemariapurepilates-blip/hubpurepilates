import { jsPDF } from 'jspdf';
import logoUrl from '@/assets/logo-pure-pilates.png';
import { catalogoProdutos, type CatalogoProduto } from '@/data/pureStoreCatalogo';

// Gera o catálogo da Pure Store em PDF (foto + preço de cada produto), com o
// nome e o WhatsApp da unidade (clicável). Snapshot do momento — para pegar
// novidades, é só gerar de novo.

type RGB = [number, number, number];
const RED: RGB = [193, 32, 48];
const DARK: RGB = [35, 31, 32];
const GRAY: RGB = [120, 120, 120];
const GREEN: RGB = [37, 211, 102];

const brl = (n: number) => 'R$ ' + n.toFixed(2).replace('.', ',');

const fmtWhats = (d: string) => {
  const s = d.replace(/\D/g, '').replace(/^55/, '');
  if (s.length === 11) return `(${s.slice(0, 2)}) ${s.slice(2, 7)}-${s.slice(7)}`;
  if (s.length === 10) return `(${s.slice(0, 2)}) ${s.slice(2, 6)}-${s.slice(6)}`;
  return d;
};

type Img = { dataUrl: string; w: number; h: number };

// Carrega uma imagem (CDN da loja libera CORS) e converte pra JPEG via canvas.
function loadImg(url: string, maxPx = 520): Promise<Img | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.72), w, h });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function pool<T>(items: T[], n: number, fn: (t: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i;
        i += 1;
        await fn(items[idx]);
      }
    }),
  );
}

const SECTION_ORDER = ['Acessórios', 'Moletons', 'Lançamentos', 'Camisetas', 'Cropped', 'Legging', 'Meias', 'Outros'];

export interface GerarCatalogoOpts {
  unidade: string;
  whats: string;
  onProgress?: (done: number, total: number) => void;
}

export async function gerarCatalogoPdf({ unidade, whats, onProgress }: GerarCatalogoOpts): Promise<Blob> {
  const produtos = catalogoProdutos;
  const total = produtos.length;

  // Pré-carrega as fotos (concorrência limitada) + o logo.
  const imgMap = new Map<string, Img | null>();
  let done = 0;
  await pool(produtos, 6, async (p) => {
    imgMap.set(p.url, await loadImg(p.foto, 520));
    done += 1;
    onProgress?.(done, total);
  });
  const logo = await loadImg(logoUrl, 320);

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const W = 210;
  const H = 297;
  const M = 12;
  const HEADER_H = 34;
  const FOOTER_H = 12;
  const contentTop = HEADER_H + 2;
  const contentBottom = H - FOOTER_H - 2;

  const whatsDigits = whats.replace(/\D/g, '');
  const waUrl = whatsDigits ? `https://wa.me/${whatsDigits}` : '';
  const waDisp = fmtWhats(whats);

  const drawHeader = () => {
    if (logo) {
      const lw = 26;
      const lh = (lw * logo.h) / logo.w;
      doc.addImage(logo.dataUrl, 'JPEG', M, 8, lw, Math.min(lh, 16));
    }
    doc.setTextColor(...RED);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CATÁLOGO PURE STORE', W - M, 12, { align: 'right' });
    doc.setTextColor(...DARK);
    doc.setFontSize(14);
    doc.text(unidade, W - M, 18.5, { align: 'right' });

    // Botão WhatsApp em destaque (verde) — clicável.
    if (waDisp) {
      const label = `PEDIDOS NO WHATSAPP: ${waDisp}`;
      const bh = 9;
      const by = 22;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      const bw = Math.min(W - 2 * M, doc.getTextWidth(label) + 14);
      const bx = W - M - bw;
      doc.setFillColor(...GREEN);
      doc.roundedRect(bx, by, bw, bh, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(label, bx + bw / 2, by + bh / 2 + 1.4, { align: 'center' });
      if (waUrl) doc.link(bx, by, bw, bh, { url: waUrl });
    }

    doc.setDrawColor(...RED);
    doc.setLineWidth(0.6);
    doc.line(M, HEADER_H, W - M, HEADER_H);
  };

  const drawFooter = (page: number) => {
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(M, H - FOOTER_H, W - M, H - FOOTER_H);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (waDisp) {
      doc.setTextColor(...GREEN);
      doc.textWithLink(`Faça seu pedido no WhatsApp: ${waDisp}`, M, H - 5.5, { url: waUrl });
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`Pág. ${page}`, W - M, H - 5.5, { align: 'right' });
  };

  const cols = 3;
  const gap = 5;
  const colW = (W - 2 * M - (cols - 1) * gap) / cols;
  const imgS = colW;
  const rowH = imgS + 6 + 8 + 6;

  let page = 1;
  let y = contentTop;
  let col = 0;
  drawHeader();

  const newPage = () => {
    drawFooter(page);
    doc.addPage();
    page += 1;
    drawHeader();
    y = contentTop;
    col = 0;
  };

  const grupos: { sec: string; itens: CatalogoProduto[] }[] = [];
  for (const sec of SECTION_ORDER) {
    const itens = produtos.filter((p) => p.categoria === sec);
    if (itens.length) grupos.push({ sec, itens });
  }
  const conhecidas = new Set(SECTION_ORDER);
  for (const sec of [...new Set(produtos.map((p) => p.categoria))].filter((c) => !conhecidas.has(c))) {
    grupos.push({ sec, itens: produtos.filter((p) => p.categoria === sec) });
  }

  for (const g of grupos) {
    if (col !== 0) {
      col = 0;
      y += rowH;
    }
    if (y + 11 + rowH > contentBottom) newPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...RED);
    doc.text(g.sec, M, y + 4);
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.3);
    doc.line(M, y + 6, W - M, y + 6);
    y += 11;
    col = 0;

    for (const p of g.itens) {
      if (col === 0 && y + rowH > contentBottom) newPage();
      const cx = M + col * (colW + gap);
      const img = imgMap.get(p.url);
      if (img) {
        doc.addImage(img.dataUrl, 'JPEG', cx, y, imgS, imgS);
      } else {
        doc.setFillColor(238, 238, 238);
        doc.rect(cx, y, imgS, imgS, 'F');
      }
      if (p.esgotado) {
        doc.setFillColor(...DARK);
        doc.roundedRect(cx + 2, y + 2, 18, 5, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text('ESGOTADO', cx + 3.5, y + 5.6);
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...RED);
      doc.text(brl(p.preco), cx, y + imgS + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(doc.splitTextToSize(p.nome, colW).slice(0, 2), cx, y + imgS + 11);
      col += 1;
      if (col === cols) {
        col = 0;
        y += rowH;
      }
    }
  }

  drawFooter(page);
  return doc.output('blob');
}
