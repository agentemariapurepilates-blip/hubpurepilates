import { forwardRef } from 'react';
import { ZoneContent, type Zone } from './EditableCanvas';

// ============================================================================
// StaticCanvas
//
// Versão "burra" do canvas sem react-rnd nem CSS transforms — só divs com
// position: absolute em coordenadas nativas (1080×canvasH). Usado APENAS
// pra exportação via html2canvas, porque o react-rnd usa transform: translate3d
// que renderiza inconsistentemente entre browser e html2canvas.
//
// Renderiza idêntico ao EditableCanvas (mesmo ZoneContent), mas em tamanho
// nativo sem scale. CriacaoLayout monta esse componente OCULTO durante o
// export, captura, e remove.
// ============================================================================

interface StaticCanvasProps {
  zones: Zone[];
  photoDataUrl?: string;
  backgroundColor?: string;
  canvasW: number;
  canvasH: number;
}

const StaticCanvas = forwardRef<HTMLDivElement, StaticCanvasProps>(
  ({ zones, photoDataUrl, backgroundColor, canvasW, canvasH }, ref) => (
    <div
      ref={ref}
      style={{
        width: canvasW,
        height: canvasH,
        position: 'relative',
        background: backgroundColor ?? '#ffffff',
        overflow: 'hidden',
      }}
    >
      {photoDataUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${photoDataUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      {zones.map((zone) => (
        <div
          key={zone.id}
          style={{
            position: 'absolute',
            left: zone.x,
            top: zone.y,
            width: zone.w,
            height: zone.h,
          }}
        >
          <ZoneContent zone={zone} />
        </div>
      ))}
    </div>
  ),
);

StaticCanvas.displayName = 'StaticCanvas';
export default StaticCanvas;
