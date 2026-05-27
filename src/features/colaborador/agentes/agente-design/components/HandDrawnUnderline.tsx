// ============================================================================
// HandDrawnUnderline
//
// SVG inline com path Bézier que parece um traço de caneta/marcador. 3 variantes:
//
//   - "wave":   curva ondulada sutil (estilo sublinhado fluido)
//   - "arch":   arco ascendente simples (igual ao exemplo "E relaxe!")
//   - "double": dois traços sobrepostos (mais rabiscado, mais peso)
//
// Renderiza idêntico no preview e no PNG exportado via html2canvas.
// ============================================================================

export type UnderlineVariant = 'wave' | 'arch' | 'double';

// Paths em viewBox 0 0 100 20. preserveAspectRatio="none" estica horizontal.
// Pequenas variações de bezier dão a sensação de traço manual.
const PATHS: Record<UnderlineVariant, string[]> = {
  wave: ['M2,12 Q25,4 50,11 T98,9'],
  arch: ['M3,16 Q30,4 60,7 T97,10'],
  double: [
    'M2,10 Q30,4 50,9 T97,8',
    'M4,15 Q35,11 55,13 T96,14',
  ],
};

interface HandDrawnUnderlineProps {
  variant: UnderlineVariant;
  width: number;
  thickness: number;
  color: string;
}

export const HandDrawnUnderline = ({ variant, width, thickness, color }: HandDrawnUnderlineProps) => {
  // Altura do SVG = ~4x thickness pra acomodar a curva vertical do path
  // sem clipar nas extremidades.
  const svgHeight = Math.max(thickness * 4, 16);
  const paths = PATHS[variant] ?? PATHS.wave;
  return (
    <svg
      width={width}
      height={svgHeight}
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
    </svg>
  );
};

HandDrawnUnderline.displayName = 'HandDrawnUnderline';
