// O modern-screenshot serializa o DOM pra um SVG (foreignObject). Fontes web
// carregadas via <link> do Google Fonts (cross-origin) NÃO são embutidas nesse
// SVG, então o PNG exportado sai com fonte de fallback (apesar do preview estar
// certo). A solução é injetar um @font-face com o Montserrat embutido como
// data-URI dentro do próprio nó capturado — aí o SVG fica auto-contido.
//
// Montserrat é a fonte oficial da marca e NUNCA pode ser trocada: por isso a
// família vai inteira (pesos 100 a 900, normal e itálico). Faltando um peso ou o
// itálico, o navegador "simula" a letra e o PNG sai diferente da prévia.
// Usamos os arquivos do @fontsource/montserrat (mesma origem, sem CORS).
import m100n from '@fontsource/montserrat/files/montserrat-latin-100-normal.woff2';
import m100i from '@fontsource/montserrat/files/montserrat-latin-100-italic.woff2';
import m200n from '@fontsource/montserrat/files/montserrat-latin-200-normal.woff2';
import m200i from '@fontsource/montserrat/files/montserrat-latin-200-italic.woff2';
import m300n from '@fontsource/montserrat/files/montserrat-latin-300-normal.woff2';
import m300i from '@fontsource/montserrat/files/montserrat-latin-300-italic.woff2';
import m400n from '@fontsource/montserrat/files/montserrat-latin-400-normal.woff2';
import m400i from '@fontsource/montserrat/files/montserrat-latin-400-italic.woff2';
import m500n from '@fontsource/montserrat/files/montserrat-latin-500-normal.woff2';
import m500i from '@fontsource/montserrat/files/montserrat-latin-500-italic.woff2';
import m600n from '@fontsource/montserrat/files/montserrat-latin-600-normal.woff2';
import m600i from '@fontsource/montserrat/files/montserrat-latin-600-italic.woff2';
import m700n from '@fontsource/montserrat/files/montserrat-latin-700-normal.woff2';
import m700i from '@fontsource/montserrat/files/montserrat-latin-700-italic.woff2';
import m800n from '@fontsource/montserrat/files/montserrat-latin-800-normal.woff2';
import m800i from '@fontsource/montserrat/files/montserrat-latin-800-italic.woff2';
import m900n from '@fontsource/montserrat/files/montserrat-latin-900-normal.woff2';
import m900i from '@fontsource/montserrat/files/montserrat-latin-900-italic.woff2';

const ARQUIVOS: [number, 'normal' | 'italic', string][] = [
  [100, 'normal', m100n],
  [100, 'italic', m100i],
  [200, 'normal', m200n],
  [200, 'italic', m200i],
  [300, 'normal', m300n],
  [300, 'italic', m300i],
  [400, 'normal', m400n],
  [400, 'italic', m400i],
  [500, 'normal', m500n],
  [500, 'italic', m500i],
  [600, 'normal', m600n],
  [600, 'italic', m600i],
  [700, 'normal', m700n],
  [700, 'italic', m700i],
  [800, 'normal', m800n],
  [800, 'italic', m800i],
  [900, 'normal', m900n],
  [900, 'italic', m900i],
];

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
 * CSS com @font-face da Montserrat inteira (100 a 900, normal e itálico) embutida
 * como data-URI. O resultado é cacheado: os woff2 só são baixados uma vez.
 */
export function getMontserratFontFaceCss(): Promise<string> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = (async () => {
      const faces = await Promise.all(
        ARQUIVOS.map(
          async ([peso, estilo, url]) =>
            `@font-face{font-family:'Montserrat';font-style:${estilo};font-weight:${peso};font-display:swap;src:url(data:font/woff2;base64,${await toBase64(url)}) format('woff2');}`,
        ),
      );
      cache = faces.join('');
      return cache;
    })();
  }
  return pending;
}
