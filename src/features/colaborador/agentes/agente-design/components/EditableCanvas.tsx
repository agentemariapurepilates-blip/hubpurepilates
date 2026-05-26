import { useEffect, useMemo, useRef } from 'react';
import { Rnd } from 'react-rnd';

// ============================================================================
// EditableCanvas
//
// Renderiza a foto + zonas de texto editáveis (drag + resize via react-rnd).
// Mantém o canvas em coordenadas NATIVAS (ex: 1080x1350) e aplica scale CSS
// pra caber na tela. O react-rnd compensa o scale via prop `scale`.
// ============================================================================

export interface Zone {
  id: string;
  kind: 'headline' | 'apoio' | 'pill' | 'remate';
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
  pill?: {
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    paddingX: number;
    paddingY: number;
  };
}

interface EditableCanvasProps {
  zones: Zone[];
  onZonesChange: (zones: Zone[]) => void;
  photoDataUrl: string;
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
  pill: 'Pill',
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

  if (zone.pill) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          border: `${zone.pill.borderWidth}px solid ${zone.pill.borderColor}`,
          borderRadius: zone.pill.borderRadius,
          paddingLeft: zone.pill.paddingX,
          paddingRight: zone.pill.paddingX,
          paddingTop: zone.pill.paddingY,
          paddingBottom: zone.pill.paddingY,
          background: 'transparent',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ ...baseStyle, height: 'auto', alignItems: 'center' }}>{zone.text}</div>
      </div>
    );
  }

  return <div style={baseStyle}>{zone.text}</div>;
};

const EditableCanvas = ({
  zones,
  onZonesChange,
  photoDataUrl,
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
            background: '#ffffff',
            overflow: 'hidden',
          }}
        >
        {/* Foto como background-image — html2canvas tem suporte ruim
            a `object-fit: cover` em <img>. Background-image renderiza
            identicamente entre preview e export. */}
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

      {zone.pill && (
        <div className="rounded-md border border-foreground/10 p-2 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            Pill (cápsula)
          </p>
          <div className="flex gap-2 items-center">
            <label className="text-xs text-muted-foreground">Borda:</label>
            <input
              type="color"
              value={zone.pill.borderColor}
              onChange={(e) =>
                onChange({ pill: { ...zone.pill!, borderColor: e.target.value } })
              }
              className="h-8 w-10 rounded-md border bg-background cursor-pointer"
            />
            <input
              type="number"
              value={zone.pill.borderWidth}
              onChange={(e) =>
                onChange({
                  pill: { ...zone.pill!, borderWidth: parseFloat(e.target.value) || 0 },
                })
              }
              className="w-16 rounded-md border bg-background px-2 py-1 text-xs"
              step={0.5}
              min={0}
            />
            <span className="text-xs text-muted-foreground">px</span>
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
