import { useLayoutEffect, useRef } from 'react';
import {
  BASE_W,
  BASE_H,
  CERT_BG,
  FIXED_PX,
  VALUE_PX,
  TEXT_COLOR,
  formatDate,
  type CertRow,
} from './certificado';

interface CertificadoCanvasProps {
  row: CertRow;
  /** Escala de exibição. 1 = tamanho nativo (usado na captura). */
  scale?: number;
  /** Desenha a caixa de cada linha, pra ajudar a calibrar. */
  showGuides?: boolean;
  /** Ref pro elemento raiz em tamanho nativo (usado pelo modern-screenshot). */
  rootRef?: React.Ref<HTMLDivElement>;
  /** @font-face do Montserrat embutido (data-URI) — garante a fonte no PNG exportado. */
  fontFaceCss?: string;
}

// Margens horizontais do corpo (em %), medidas no certificado original.
const LEFT = 11.4;
const RIGHT = 89;
const AVAIL_PX = ((RIGHT - LEFT) / 100) * BASE_W;

type Seg = { t: 'label'; text: string } | { t: 'value'; field: keyof CertRow };

interface Line {
  top: number; // centro vertical em %
  segs: Seg[];
}

// O corpo do certificado, linha a linha. Rótulos = Montserrat regular (fixo);
// valores = Montserrat bold + sublinhado (editável, vêm da planilha).
// Linhas distribuídas verticalmente de forma uniforme (gap ~8,1%).
const LINES: Line[] = [
  { top: 38.0, segs: [{ t: 'label', text: 'Nome: ' }, { t: 'value', field: 'nome' }] },
  { top: 46.1, segs: [{ t: 'label', text: 'registrado (a) no CPF: ' }, { t: 'value', field: 'cpf' }] },
  { top: 54.2, segs: [{ t: 'label', text: 'concluiu com êxito o ' }, { t: 'value', field: 'curso' }, { t: 'label', text: ', com' }] },
  {
    top: 62.3,
    segs: [
      { t: 'label', text: 'carga horária de ' },
      { t: 'value', field: 'cargaHoraria' },
      { t: 'label', text: ' horas, iniciado em ' },
      { t: 'value', field: 'inicio' },
    ],
  },
  { top: 70.4, segs: [{ t: 'label', text: 'e concluído em ' }, { t: 'value', field: 'conclusao' }, { t: 'label', text: '.' }] },
];

function valueText(field: keyof CertRow, row: CertRow): string {
  if (field === 'inicio' || field === 'conclusao') return formatDate(row[field]);
  return row[field] ?? '';
}

function LineRow({ line, row, showGuides }: { line: Line; row: CertRow; showGuides?: boolean }) {
  const innerRef = useRef<HTMLSpanElement>(null);

  // Encolhe a linha inteira (uniforme) se o texto não couber na largura.
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const fit = () => {
      el.style.transform = 'scale(1)';
      const natural = el.scrollWidth;
      if (natural > AVAIL_PX) {
        el.style.transform = `scale(${AVAIL_PX / natural})`;
      }
    };
    fit();
    if (document.fonts?.ready) document.fonts.ready.then(fit);
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: `${LEFT}%`,
        top: `${line.top}%`,
        transform: 'translateY(-50%)',
        width: `${RIGHT - LEFT}%`,
        outline: showGuides ? '2px solid rgba(196,18,48,0.4)' : 'none',
      }}
    >
      <span
        ref={innerRef}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          transformOrigin: 'left center',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: `${FIXED_PX}px`,
          fontWeight: 400,
          color: TEXT_COLOR,
          lineHeight: 1.1,
        }}
      >
        {line.segs.map((seg, i) =>
          seg.t === 'label' ? (
            <span key={i} style={{ whiteSpace: 'pre' }}>{seg.text}</span>
          ) : (
            <span
              key={i}
              style={{
                fontSize: `${VALUE_PX}px`,
                fontWeight: 700,
                textDecoration: 'underline',
                textUnderlineOffset: '0.16em',
                textDecorationThickness: '0.045em',
              }}
            >
              {valueText(seg.field, row)}
            </span>
          ),
        )}
      </span>
    </div>
  );
}

/**
 * Renderiza o certificado em tamanho nativo (3508×2480) e aplica `scale` via CSS
 * transform pra exibição. Na captura, `scale` fica em 1 e o modern-screenshot gera
 * o PNG pixel-perfect. Fundo = só gráficos; todo o corpo é texto HTML.
 */
const CertificadoCanvas = ({ row, scale = 1, showGuides, rootRef, fontFaceCss }: CertificadoCanvasProps) => {
  return (
    <div style={{ width: BASE_W * scale, height: BASE_H * scale, overflow: 'hidden' }}>
      <div
        ref={rootRef}
        style={{
          position: 'relative',
          width: BASE_W,
          height: BASE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          background: '#ffffff',
        }}
      >
        {fontFaceCss && <style dangerouslySetInnerHTML={{ __html: fontFaceCss }} />}
        <img
          src={CERT_BG}
          alt=""
          crossOrigin="anonymous"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        />
        {LINES.map((line) => (
          <LineRow key={line.top} line={line} row={row} showGuides={showGuides} />
        ))}
      </div>
    </div>
  );
};

export default CertificadoCanvas;
