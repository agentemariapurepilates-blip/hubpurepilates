import type { Zone } from '../components/EditableCanvas';

// ============================================================================
// fitZones — pós-processa o JSON do edge function `layout-compose` reduzindo
// `fontSize` (e re-derivando `h`) até que o texto real caiba dentro de `w`.
//
// Motivo: o LLM dimensiona via heurística `qtd_letras * fontSize * 0.55`, que
// é grosseira pra Montserrat ExtraBold com letterSpacing negativo. Sem esse
// fit-pass, a headline (`whiteSpace: 'pre'`, não quebra) vaza pra fora do
// canvas.
// ============================================================================

const MIN_FONT_SIZE = 24;

const buildFontString = (fontWeight: number, italic: boolean, fontSize: number) =>
  `${italic ? 'italic ' : 'normal '}${fontWeight} ${fontSize}px "Montserrat", sans-serif`;

// measureText ignora letter-spacing — aproxima manualmente.
const measureWidth = (
  ctx: CanvasRenderingContext2D,
  text: string,
  fontWeight: number,
  italic: boolean,
  fontSize: number,
  letterSpacing: number,
): number => {
  ctx.font = buildFontString(fontWeight, italic, fontSize);
  const base = ctx.measureText(text).width;
  const tracking = Math.max(0, text.length - 1) * letterSpacing;
  return base + tracking;
};

// Headline tem `whiteSpace: 'pre'` (não quebra). A "peça mais longa" é a linha
// inteira (separada por \n explícito). Demais zonas usam `pre-wrap` → quebra
// entre palavras, então o limite é a palavra mais longa.
const longestUnbreakable = (zone: Zone): string => {
  const text = zone.text ?? '';
  if (zone.kind === 'headline') {
    const lines = text.split('\n');
    return lines.reduce((longest, line) => (line.length > longest.length ? line : longest), '');
  }
  const tokens = text.split(/\s+/).filter(Boolean);
  return tokens.reduce((longest, t) => (t.length > longest.length ? t : longest), '');
};

// Underline não ocupa padding horizontal — só fica abaixo/acima do texto.
const horizontalPadding = (_zone: Zone): number => 0;

// Underline (SVG hand-drawn) reserva espaço vertical: altura do SVG (~4x
// thickness, mínimo 16px) + gap efetivo (com clearance pra descenders).
// Tem que casar com o cálculo em ZoneContent.
const verticalPadding = (zone: Zone): number => {
  if (!zone.underline) return 0;
  const t = zone.underline.thickness ?? 0;
  const svgHeight = Math.max(t * 4, 16);
  const descenderClearance = Math.ceil(zone.fontSize * 0.25);
  const effectiveGap = Math.max(zone.underline.gap ?? 0, descenderClearance);
  return svgHeight + effectiveGap;
};

// Estima nº de linhas após quebra em `availableWidth` (só pra pre-wrap).
const estimateLineCount = (
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  availableWidth: number,
): number => {
  const text = (zone.text ?? '').trim();
  if (!text) return 1;
  if (zone.kind === 'headline') {
    return Math.max(1, text.split('\n').length);
  }
  const explicitLines = text.split('\n');
  let totalLines = 0;
  for (const line of explicitLines) {
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      totalLines += 1;
      continue;
    }
    let current = '';
    let lines = 1;
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      const width = measureWidth(
        ctx,
        candidate,
        zone.fontWeight,
        zone.italic,
        zone.fontSize,
        zone.letterSpacing ?? 0,
      );
      if (width > availableWidth && current) {
        lines += 1;
        current = word;
      } else {
        current = candidate;
      }
    }
    totalLines += lines;
  }
  return Math.max(1, totalLines);
};

interface FitOptions {
  canvasW: number;
  canvasH: number;
  margin?: number;
}

export function fitZones(zones: Zone[], { canvasW, canvasH, margin = 60 }: FitOptions): Zone[] {
  // Canvas só existe no browser; nos testes pode não existir.
  if (typeof document === 'undefined') return zones;
  const measureCanvas = document.createElement('canvas');
  const ctx = measureCanvas.getContext('2d');
  if (!ctx) return zones;

  return zones.map((zone) => {
    const original = { fontSize: zone.fontSize, w: zone.w, h: zone.h };

    // Limite horizontal: zona pode crescer até a margem direita do canvas,
    // mas não diminui abaixo do que o LLM pediu (preserva layout intencional).
    const maxAvailableW = Math.max(zone.w, canvasW - zone.x - margin);
    let workingW = Math.min(zone.w, maxAvailableW);

    const longest = longestUnbreakable(zone);
    let fontSize = zone.fontSize;
    const letterSpacing = zone.letterSpacing ?? 0;
    const padX = horizontalPadding(zone);

    if (longest) {
      let measured = measureWidth(ctx, longest, zone.fontWeight, zone.italic, fontSize, letterSpacing);
      let available = Math.max(1, workingW - padX);

      // 1) Se não cabe, primeiro tenta ampliar a zona até o canvas permitir.
      if (measured > available) {
        const desiredW = Math.ceil(measured + padX + 4);
        workingW = Math.min(desiredW, maxAvailableW);
        available = Math.max(1, workingW - padX);
      }

      // 2) Se ampliar não basta, encolhe fontSize iterativamente.
      let safety = 20;
      while (measured > available && fontSize > MIN_FONT_SIZE && safety > 0) {
        const ratio = available / measured;
        const next = Math.max(MIN_FONT_SIZE, Math.floor(fontSize * ratio));
        fontSize = next < fontSize ? next : fontSize - 2;
        measured = measureWidth(ctx, longest, zone.fontWeight, zone.italic, fontSize, letterSpacing);
        safety -= 1;
      }
    }

    // 3) Recalcula altura com fontSize/largura finais.
    const availableForWrap = Math.max(1, workingW - padX);
    const fittedZone: Zone = { ...zone, fontSize, w: workingW };
    const lineCount = estimateLineCount(ctx, fittedZone, availableForWrap);
    const computedH = Math.ceil(fontSize * zone.lineHeight * lineCount + verticalPadding(zone) + 4);
    fittedZone.h = computedH;

    // 4) Clamp final: garante que a zona inteira está dentro do canvas.
    if (fittedZone.x + fittedZone.w > canvasW - margin) {
      fittedZone.w = Math.max(1, canvasW - fittedZone.x - margin);
    }
    if (fittedZone.y + fittedZone.h > canvasH - margin) {
      fittedZone.h = Math.max(1, canvasH - fittedZone.y - margin);
    }

    if (
      import.meta.env?.DEV &&
      (fittedZone.fontSize !== original.fontSize || fittedZone.w !== original.w || fittedZone.h !== original.h)
    ) {
      // eslint-disable-next-line no-console
      console.debug(
        '[fitZones]',
        zone.kind,
        `fontSize ${original.fontSize}→${fittedZone.fontSize}`,
        `w ${original.w}→${fittedZone.w}`,
        `h ${original.h}→${fittedZone.h}`,
      );
    }

    return fittedZone;
  });
}
