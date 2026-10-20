// Apresentação "Updates de Marketing" — live de 20/10/2026 (Entrada de leads + Black Friday).
// Slides estáticos servidos de /public/avisos/updates-mkt-2026-10-20/slide-NN.jpg
// (renderizados a partir de "UPDATES MKT 20-10-2026.pdf"; NN = página do PDF).
//
// Depois do slide `video.aposSlide` entra um slide com vídeo, liberado só para
// quem passou desse slide e que cada pessoa assiste até `video.limiteVezes` vezes.

import type { PresentationSlide } from "./novidadesPureSystem";

// Páginas 31–33 do PDF (filmes com link para o Drive) saíram a pedido da
// usuária em 20/10/2026 — o filme agora toca no próprio Hub.
const PAGINAS_PDF = Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => n < 31 || n > 33);

export const UPDATES_MKT_OUT = {
  id: "updates-mkt-2026-10-20",
  title: "Updates de Marketing",
  subtitle: "Live · 20 de outubro de 2026",
  meeting: "Live Updates",
  date: "2026-10-20",
  basePath: "/avisos/updates-mkt-2026-10-20",
  video: {
    id: "updates-mkt-2026-10-20",
    // "FILME 1 - AMIGAS - 120_H.mov" (ProRes 4K) convertido para MP4 1080p H.264.
    // Vazio = o slide mostra "em breve".
    src: "/avisos/updates-mkt-2026-10-20/filme-1-amigas.mp4",
    capa: "/avisos/updates-mkt-2026-10-20/filme-1-amigas-capa.jpg",
    aposSlide: 30,
    limiteVezes: 3,
  },
} as const;

export const UPDATES_MKT_SLIDES: PresentationSlide[] = PAGINAS_PDF.map((pagina, i) => ({
  src: `${UPDATES_MKT_OUT.basePath}/slide-${String(pagina).padStart(2, "0")}.jpg`,
  alt: `${UPDATES_MKT_OUT.title} — slide ${i + 1}`,
}));
