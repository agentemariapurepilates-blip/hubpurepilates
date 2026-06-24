// O modern-screenshot serializa o DOM pra um SVG (foreignObject). Fontes web
// carregadas via <link> do Google Fonts (cross-origin) NÃO são embutidas nesse
// SVG, então o PNG exportado sai com fonte de fallback (apesar do preview estar
// certo). A solução é injetar um @font-face com o Montserrat embutido como
// data-URI dentro do próprio nó capturado — aí o SVG fica auto-contido.
//
// Usamos os arquivos do @fontsource/montserrat (mesma origem, sem CORS).
import url400 from '@fontsource/montserrat/files/montserrat-latin-400-normal.woff2';
import url700 from '@fontsource/montserrat/files/montserrat-latin-700-normal.woff2';

let cache: string | null = null;
let pending: Promise<string> | null = null;

async function toBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * CSS com @font-face do Montserrat (regular + bold) embutido como data-URI.
 * Resultado é cacheado — os woff2 só são baixados/convertidos uma vez.
 */
export function getMontserratFontFaceCss(): Promise<string> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = (async () => {
      const [b400, b700] = await Promise.all([toBase64(url400), toBase64(url700)]);
      cache =
        `@font-face{font-family:'Montserrat';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,${b400}) format('woff2');}` +
        `@font-face{font-family:'Montserrat';font-style:normal;font-weight:700;font-display:swap;src:url(data:font/woff2;base64,${b700}) format('woff2');}`;
      return cache;
    })();
  }
  return pending;
}
