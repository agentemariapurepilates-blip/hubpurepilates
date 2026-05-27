import { useEffect, useMemo, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { HandDrawnUnderline, type UnderlineVariant } from './HandDrawnUnderline';

// ============================================================================
// EditableCanvas
//
// Renderiza a foto + zonas de texto editáveis (drag + resize via react-rnd).
// Mantém o canvas em coordenadas NATIVAS (ex: 1080x1350) e aplica scale CSS
// pra caber na tela. O react-rnd compensa o scale via prop `scale`.
// ============================================================================

export interface Zone {
  id: string;
  kind: 'headline' | 'apoio' | 'remate';
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontWeight: 800 | 500;
  italic: boolean;
  fontSize: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing?: number;
  // Sublinhado desenhado à mão (SVG Bézier). Aplicado opcionalmente a
  // qualquer zona — o LLM escolhe a zona de maior peso visual pra adicionar
  // esse adorno. widthRatio: comprimento do traço em relação à largura
  // natural do texto (0.4-1.0 ideal).
  underline?: {
    variant: UnderlineVariant;
    color: string;
    thickness: number;
    widthRatio: number;
    position: 'above' | 'below';
    gap: number;
  };
}

interface EditableCanvasProps {
  zones: Zone[];
  onZonesChange: (zones: Zone[]) => void;
  // Pra slides com foto: photoDataUrl é o background.
  // Pra slides HTML-only (carrossel slides 2+): backgroundColor é a cor sólida.
  photoDataUrl?: string;
  backgroundColor?: string;
  canvasW: number;
  canvasH: number;
  maxDisplayWidth?: number;
  exportRef?: React.RefObject<HTMLDivElement>;
  selectedId: string | null;
  onSelectChange: (id: string | null) => void;
}

const ZONE_LABEL: Record<Zone['kind'], string> = {
  headline: 'Headline',
  apoio: 'Apoio',
  remate: 'Remate',
};

export const ZoneContent = ({ zone }: { zone: Zone }) => {
  // Headline: NUNCA quebra automaticamente (só respeita \n explícitos no texto).
  // Outras zonas: quebram entre palavras conforme largura disponível.
  //
  // Motivo: html2canvas mede largura de texto com algoritmo aproximado próprio
  // (não o nativo do browser). Diferença de 1-2px com Montserrat ExtraBold +
  // letter-spacing negativo é suficiente pra wrap inesperado no PNG. Forçar
  // "pre" no headline evita essa quebra fantasma na exportação.
  const isHeadline = zone.kind === 'headline';
  const baseStyle: React.CSSProperties = {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: zone.fontWeight,
    fontStyle: zone.italic ? 'italic' : 'normal',
    fontSize: zone.fontSize,
    color: zone.color,
    textAlign: zone.textAlign,
    lineHeight: zone.lineHeight,
    letterSpacing: zone.letterSpacing ? `${zone.letterSpacing}px` : undefined,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      zone.textAlign === 'center' ? 'center' : zone.textAlign === 'right' ? 'flex-end' : 'flex-start',
    whiteSpace: isHeadline ? 'pre' : 'pre-wrap',
    wordBreak: 'normal',
    overflowWrap: 'normal',
    textRendering: 'geometricPrecision',
    boxSizing: 'border-box',
    userSelect: 'none',
    pointerEvents: 'none',
  };

  if (zone.underline) {
    const { variant, color, thickness, widthRatio, position, gap } = zone.underline;
    const underlineWidth = Math.max(20, Math.round(zone.w * widthRatio));
    const underlineAlign: React.CSSProperties =
      zone.textAlign === 'center'
        ? { marginLeft: 'auto', marginRight: 'auto' }
        : zone.textAlign === 'right'
          ? { marginLeft: 'auto' }
          : { marginRight: 'auto' };
    // Piso mínimo de gap pra acomodar descenders (p, g, j, q, y).
    // Em Montserrat ~25% do fontSize já fica seguro. html2canvas ignora `gap`
    // do flexbox em alguns casos — usamos `marginTop`/`marginBottom` explícito.
    const descenderClearance = Math.ceil(zone.fontSize * 0.25);
    const effectiveGap = Math.max(gap, descenderClearance);
    const underlineMargin =
      position === 'below'
        ? { marginTop: effectiveGap }
        : { marginBottom: effectiveGap };
    const underline = (
      <div style={{ flexShrink: 0, ...underlineAlign, ...underlineMargin }}>
        <HandDrawnUnderline
          variant={variant}
          width={underlineWidth}
          thickness={thickness}
          color={color}
        />
      </div>
    );
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        {position === 'above' && underline}
        <div style={{ ...baseStyle, height: 'auto', alignItems: 'center' }}>{zone.text}</div>
        {position === 'below' && underline}
      </div>
    );
  }

  return <div style={baseStyle}>{zone.text}</div>;
};

const EditableCanvas = ({
  zones,
  onZonesChange,
  photoDataUrl,
  backgroundColor,
  canvasW,
  canvasH,
  maxDisplayWidth = 600,
  exportRef,
  selectedId,
  onSelectChange,
}: EditableCanvasProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const internalExportRef = useRef<HTMLDivElement>(null);
  const innerRef = exportRef ?? internalExportRef;

  const scale = useMemo(() => Math.min(maxDisplayWidth / canvasW, 1), [maxDisplayWidth, canvasW]);
  const displayW = canvasW * scale;
  const displayH = canvasH * scale;

  // ESC desseleciona — clique fora NÃO desseleciona (pra não brigar com o
  // painel de propriedades externo). Pra desselecionar via mouse, clique no
  // fundo da foto (área sem zona).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSelectChange(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSelectChange]);

  const updateZone = (id: string, patch: Partial<Zone>) => {
    onZonesChange(zones.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        width: displayW,
        height: displayH,
        position: 'relative',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#f5f5f5',
      }}
    >
      <div
        style={{
          width: canvasW,
          height: canvasH,
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div
          ref={innerRef}
          style={{
            width: canvasW,
            height: canvasH,
            position: 'relative',
            background: backgroundColor ?? '#ffffff',
            overflow: 'hidden',
          }}
        >
        {/* Foto como background-image (quando o slide tem foto). Slides
            HTML-only (carrossel 2+) usam só backgroundColor. */}
        {photoDataUrl && (
          <div
            aria-label="foto base"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("${photoDataUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )}
        {/* Camada invisível pra capturar cliques no fundo (desseleciona) */}
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onSelectChange(null);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'transparent',
            cursor: 'default',
          }}
        />
        {zones.map((zone) => {
          const isSelected = selectedId === zone.id;
          return (
            <Rnd
              key={zone.id}
              scale={scale}
              size={{ width: zone.w, height: zone.h }}
              position={{ x: zone.x, y: zone.y }}
              bounds="parent"
              onDragStop={(_, d) => updateZone(zone.id, { x: d.x, y: d.y })}
              onResizeStop={(_, __, ref, ___, position) =>
                updateZone(zone.id, {
                  w: parseFloat(ref.style.width),
                  h: parseFloat(ref.style.height),
                  x: position.x,
                  y: position.y,
                })
              }
              onMouseDown={() => onSelectChange(zone.id)}
              style={{
                outline: isSelected ? `2px dashed #a62436` : '2px dashed transparent',
                outlineOffset: 4,
                cursor: 'move',
              }}
              enableResizing={{
                top: isSelected,
                right: isSelected,
                bottom: isSelected,
                left: isSelected,
                topRight: isSelected,
                bottomRight: isSelected,
                bottomLeft: isSelected,
                topLeft: isSelected,
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <ZoneContent zone={zone} />
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -36,
                      left: 0,
                      background: '#a62436',
                      color: '#fff',
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      transform: `scale(${1 / scale})`,
                      transformOrigin: 'bottom left',
                    }}
                  >
                    {ZONE_LABEL[zone.kind]}
                  </div>
                )}
              </div>
            </Rnd>
          );
        })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Painel de propriedades (font-size, cor, alinhamento) da zona selecionada
// ============================================================================

interface ZonePanelProps {
  zone: Zone | null;
  onChange: (patch: Partial<Zone>) => void;
  onDelete: () => void;
}

export const ZonePropertyPanel = ({ zone, onChange, onDelete }: ZonePanelProps) => {
  if (!zone) {
    return (
      <div className="text-xs text-muted-foreground italic">
        Clique numa zona pra editar texto, cor, tamanho.
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
          {ZONE_LABEL[zone.kind]}
        </p>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-destructive hover:underline"
        >
          Remover
        </button>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-1">
          Texto
        </label>
        <textarea
          value={zone.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="w-full min-h-[60px] rounded-md border bg-background px-2 py-1.5 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-1">
            Tamanho (px)
          </label>
          <input
            type="number"
            value={zone.fontSize}
            onChange={(e) => onChange({ fontSize: parseInt(e.target.value, 10) || 0 })}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            min={8}
            max={400}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-1">
            Cor
          </label>
          <div className="flex gap-1">
            <input
              type="color"
              value={zone.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="h-9 w-12 rounded-md border bg-background cursor-pointer"
            />
            <input
              type="text"
              value={zone.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="flex-1 min-w-0 rounded-md border bg-background px-2 py-1.5 text-xs font-mono"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-1">
            Peso
          </label>
          <select
            value={zone.fontWeight}
            onChange={(e) => onChange({ fontWeight: parseInt(e.target.value, 10) as 500 | 800 })}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value={500}>Medium</option>
            <option value={800}>ExtraBold</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-1">
            Itálico
          </label>
          <select
            value={zone.italic ? 'yes' : 'no'}
            onChange={(e) => onChange({ italic: e.target.value === 'yes' })}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="no">Não</option>
            <option value="yes">Sim</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-1">
            Alinh.
          </label>
          <select
            value={zone.textAlign}
            onChange={(e) => onChange({ textAlign: e.target.value as Zone['textAlign'] })}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="left">Esq</option>
            <option value="center">Centro</option>
            <option value="right">Dir</option>
          </select>
        </div>
      </div>

      {zone.underline && (
        <div className="rounded-md border border-foreground/10 p-2 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            Sublinhado manuscrito
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Estilo</label>
              <select
                value={zone.underline.variant}
                onChange={(e) =>
                  onChange({
                    underline: { ...zone.underline!, variant: e.target.value as UnderlineVariant },
                  })
                }
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
              >
                <option value="wave">Onda suave</option>
                <option value="arch">Arco</option>
                <option value="double">Duplo (rabiscado)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Posição</label>
              <select
                value={zone.underline.position}
                onChange={(e) =>
                  onChange({
                    underline: { ...zone.underline!, position: e.target.value as 'above' | 'below' },
                  })
                }
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
              >
                <option value="below">Abaixo</option>
                <option value="above">Acima</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Cor</label>
              <input
                type="color"
                value={zone.underline.color}
                onChange={(e) =>
                  onChange({ underline: { ...zone.underline!, color: e.target.value } })
                }
                className="h-8 w-full rounded-md border bg-background cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Espessura (px)</label>
              <input
                type="number"
                value={zone.underline.thickness}
                onChange={(e) =>
                  onChange({
                    underline: { ...zone.underline!, thickness: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
                step={0.5}
                min={0}
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-muted-foreground block mb-1">
                Comprimento ({Math.round(zone.underline.widthRatio * 100)}% da zona)
              </label>
              <input
                type="range"
                value={zone.underline.widthRatio}
                onChange={(e) =>
                  onChange({
                    underline: { ...zone.underline!, widthRatio: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full"
                step={0.05}
                min={0.2}
                max={1}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

EditableCanvas.displayName = 'EditableCanvas';
export default EditableCanvas;
export { ZONE_LABEL };

// Helper export pra integração com o hook de seleção do CriacaoLayout
export const findZone = (zones: Zone[], id: string | null): Zone | null =>
  id ? zones.find((z) => z.id === id) ?? null : null;
