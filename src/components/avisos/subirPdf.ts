// O envio da apresentação em PDF do aviso, usado por criar e por editar.

import { supabase } from '@/integrations/supabase/client';
import { capaDoPdf } from './pdfPaginas';

/**
 * Apresentação de reunião passa fácil dos 5 MB que a imagem de capa aceita —
 * slide com foto pesa. 50 MB cobre um deck grande sem deixar alguém subir um
 * vídeo renomeado para .pdf.
 */
export const PDF_MAXIMO_MB = 50;

export class PdfRecusado extends Error {}

export interface PdfEnviado {
  url: string;
  /** O nome como veio do computador de quem enviou. */
  nome: string;
  /**
   * O primeiro slide como imagem, que vira a capa do card. Fica em `image_url`
   * do aviso. Pode faltar: se a capa não sair, o PDF sobe assim mesmo e o card
   * desenha a capa na hora.
   */
  capa: string | null;
}

export async function subirPdf(arquivo: File, userId: string): Promise<PdfEnviado> {
  // Confere a extensão além do tipo: há navegador que manda PDF como
  // application/octet-stream, e o tipo sozinho recusaria um arquivo bom.
  const ehPdf = arquivo.type === 'application/pdf' || arquivo.name.toLowerCase().endsWith('.pdf');
  if (!ehPdf) throw new PdfRecusado('Só dá para enviar apresentação em PDF.');
  if (arquivo.size > PDF_MAXIMO_MB * 1024 * 1024) {
    throw new PdfRecusado(`O PDF deve ter no máximo ${PDF_MAXIMO_MB} MB.`);
  }

  const carimbo = Date.now();
  const caminho = `avisos/${userId}/${carimbo}.pdf`;
  const { error } = await supabase.storage
    .from('post-images')
    .upload(caminho, arquivo, { contentType: 'application/pdf' });
  if (error) throw error;
  const { data } = supabase.storage.from('post-images').getPublicUrl(caminho);

  // A capa é desenhada AQUI, uma vez, a partir do arquivo que já está na mão.
  // Se cada card desenhasse a sua, a lista baixaria o PDF inteiro de cada aviso
  // só para mostrar uma miniatura — no celular, a lista travaria.
  let capa: string | null = null;
  try {
    const imagem = await capaDoPdf(await arquivo.arrayBuffer());
    const caminhoCapa = `avisos/${userId}/${carimbo}-capa.jpg`;
    const { error: erroCapa } = await supabase.storage
      .from('post-images')
      .upload(caminhoCapa, imagem, { contentType: 'image/jpeg' });
    if (!erroCapa) capa = supabase.storage.from('post-images').getPublicUrl(caminhoCapa).data.publicUrl;
  } catch (erro) {
    // Sem capa o aviso funciona igual: o card desenha a primeira página na hora.
    console.error('[aviso] não consegui gerar a capa do PDF:', erro);
  }

  return { url: data.publicUrl, nome: arquivo.name, capa };
}
