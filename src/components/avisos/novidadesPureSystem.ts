// Apresentação "Novidades do Pure System" — reunião Updates de 23/07/2026.
// Slides estáticos servidos de /public/avisos/novidades-puresystem/slide-NN.png
// (renderizados a partir de apresentacao-rede-visual-2026.pdf).

import type { ReactNode } from "react";

export const NOVIDADES_PURESYSTEM = {
  id: "novidades-puresystem-2026-07-23",
  title: "Novidades do Pure System",
  subtitle: "Updates · 23 de julho de 2026",
  meeting: "Reunião Updates",
  date: "2026-07-23",
  totalSlides: 25,
  basePath: "/avisos/novidades-puresystem",
} as const;

export interface SlideEstado {
  /** O slide é o que está na tela agora. */
  ativo: boolean;
  /** Maior posição (1-based) que a pessoa já alcançou desde que abriu a apresentação. */
  maiorSlideVisto: number;
}

export interface PresentationSlide {
  src: string;
  alt: string;
  /** Botão sobre o slide — ex.: o "Assistir" que no PDF abria o vídeo no Drive. */
  link?: { href: string; label: string };
  /** Slide especial (ex.: vídeo): é desenhado no lugar da imagem. */
  render?: (estado: SlideEstado) => ReactNode;
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
