// Apresentação "Novidades do Pure System" — reunião Updates de 23/07/2026.
// Slides estáticos servidos de /public/avisos/novidades-puresystem/slide-NN.png
// (renderizados a partir de apresentacao-rede-visual-2026.pdf).

export const NOVIDADES_PURESYSTEM = {
  id: "novidades-puresystem-2026-07-23",
  title: "Novidades do Pure System",
  subtitle: "Updates · 23 de julho de 2026",
  meeting: "Reunião Updates",
  date: "2026-07-23",
  totalSlides: 25,
  basePath: "/avisos/novidades-puresystem",
} as const;

export interface PresentationSlide {
  src: string;
  alt: string;
}

export const NOVIDADES_SLIDES: PresentationSlide[] = Array.from(
  { length: NOVIDADES_PURESYSTEM.totalSlides },
  (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      src: `${NOVIDADES_PURESYSTEM.basePath}/slide-${n}.png`,
      alt: `${NOVIDADES_PURESYSTEM.title} — slide ${i + 1} de ${NOVIDADES_PURESYSTEM.totalSlides}`,
    };
  },
);
