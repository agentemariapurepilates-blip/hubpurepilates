// Gera o PNG de uma arte do Pure Design a partir do HTML montado — o mesmo que
// a prévia mostra. Usado pelo chat ("Baixar PNG" direto, sem abrir o editor).
//
// Como no editor: a arte é desenhada num nó fora da tela, com a Montserrat
// embutida (fonte de <link> cross-origin não entra no PNG do modern-screenshot),
// e só é capturada depois de todas as imagens carregarem.

import { domToBlob } from 'modern-screenshot';
import { getMontserratFontFaceCss } from '@/features/colaborador/academy/montserratEmbed';
import type { PureDesignTemplate } from '@/data/pureDesignTemplates';

function corpo(html: string): string {
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return m ? m[1] : html;
}

/** Campos de foto obrigatória que ainda estão com a imagem padrão (sem foto da pessoa). */
export function fotosObrigatoriasFaltando(t: PureDesignTemplate, valores: Record<string, string>): string[] {
  return t.fields
    .filter((f) => f.inputType === 'image' && f.obrigatoria && (!valores[f.id] || valores[f.id] === f.defaultValue))
    .map((f) => f.label);
}

export async function baixarPng(html: string, largura: number, altura: number, nomeArquivo: string): Promise<void> {
  const fonte = await getMontserratFontFaceCss().catch(() => '');
  const palco = document.createElement('div');
  palco.style.cssText = `position:fixed;left:-99999px;top:0;width:${largura}px;height:${altura}px;overflow:hidden;font-family:Montserrat,sans-serif;`;
  palco.innerHTML = `<style>${fonte}</style>${corpo(html)}`;
  document.body.appendChild(palco);
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all(
      Array.from(palco.querySelectorAll('img')).map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((ok) => {
              img.addEventListener('load', () => ok(), { once: true });
              img.addEventListener('error', () => ok(), { once: true });
            }),
      ),
    );
    const blob = await domToBlob(palco, { type: 'image/png', scale: 1, backgroundColor: null });
    if (!blob) throw new Error('não consegui gerar o arquivo');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } finally {
    palco.remove();
  }
}
