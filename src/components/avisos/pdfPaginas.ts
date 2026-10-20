// Desenhar páginas de PDF, num lugar só: os slides do aviso, a capa gerada no
// upload e a capa de reserva do card usam isto.

import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Abre um PDF — pela URL pública ou pelos bytes do arquivo que a pessoa acabou
 * de escolher, antes de subir.
 *
 * O pdf.js e o worker dele são carregados só aqui, sob demanda: são 1,3 MB, e
 * quem nunca abre um aviso com apresentação nunca baixa isso.
 */
export async function abrirPdf(origem: string | ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await import('pdfjs-dist');
  // O worker vem do próprio pacote, empacotado pelo Vite: sem apontar para ele,
  // o pdf.js busca na raiz do site, a reescrita do SPA devolve o index.html e a
  // falha que aparece não explica nada.
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs.getDocument(typeof origem === 'string' ? origem : { data: origem }).promise;
}

/** Uma página desenhada num canvas, `largura` pixels de largura. */
export async function desenharPagina(
  documento: PDFDocumentProxy,
  numero: number,
  largura: number,
): Promise<HTMLCanvasElement> {
  const pagina = await documento.getPage(numero);
  const natural = pagina.getViewport({ scale: 1 });
  const vista = pagina.getViewport({ scale: largura / natural.width });
  const tela = document.createElement('canvas');
  tela.width = Math.round(vista.width);
  tela.height = Math.round(vista.height);
  const contexto = tela.getContext('2d');
  if (!contexto) throw new Error('canvas indisponível');
  // Fundo branco antes de desenhar: página de PDF sem fundo declarado sairia
  // transparente, e no JPG da capa o transparente vira preto.
  contexto.fillStyle = '#ffffff';
  contexto.fillRect(0, 0, tela.width, tela.height);
  await pagina.render({ canvasContext: contexto, viewport: vista }).promise;
  return tela;
}

/** A primeira página como JPG, pronta para subir como capa. */
export async function capaDoPdf(origem: string | ArrayBuffer, largura = 1200): Promise<Blob> {
  const documento = await abrirPdf(origem);
  const tela = await desenharPagina(documento, 1, largura);
  return new Promise((ok, falhou) =>
    tela.toBlob((blob) => (blob ? ok(blob) : falhou(new Error('sem capa'))), 'image/jpeg', 0.86),
  );
}
