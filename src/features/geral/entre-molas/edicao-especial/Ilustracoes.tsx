import type { CSSProperties } from 'react';

// Ilustrações feitas em código para a Edição especial (nada aqui é documento ou
// dado real): a NFS-e de exemplo, o calendário de novembro e a semana do arbitramento.

const VINHO = '#a9293b';

/** NFS-e de exemplo, com dados genéricos (sem número, CNPJ ou CPF de verdade). */
export const NotaFiscal = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <div
    aria-hidden="true"
    className={`em-sans overflow-hidden rounded-[6px] bg-white text-[#231f20] shadow-[0_24px_50px_-18px_rgba(0,0,0,0.55)] ${className ?? ''}`}
    style={style}
  >
    <div className="flex items-center justify-between px-[18px] py-[12px] text-white" style={{ background: VINHO }}>
      <div>
        <div className="text-[22px] font-extrabold leading-none tracking-[0.04em]">NFS-e</div>
        <div className="mt-[3px] text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-85">Nota Fiscal de Serviço eletrônica</div>
      </div>
      <div className="rounded-[3px] border border-white/60 px-[8px] py-[4px] text-[9px] font-bold uppercase tracking-[0.12em]">Emissor Nacional</div>
    </div>
    <div className="space-y-[9px] px-[18px] py-[14px] text-[10.5px] leading-[1.3]">
      <div className="grid grid-cols-2 gap-[10px]">
        <Campo r="Competência" v="11/2026" />
        <Campo r="Emissão" v="Mês de competência" />
      </div>
      <Campo r="Prestador" v="Pure Pilates · Unidade" />
      <Campo r="Tomador" v="Aluno(a) · CPF •••.•••.•••-••" />
      <Campo r="Serviço" v="Mensalidade de Pilates" />
      <div className="grid grid-cols-3 gap-[10px] border-t border-dashed border-[#231f20]/25 pt-[9px]">
        <Campo r="Valor" v="R$ •••,••" />
        <Campo r="IBS" v="preenchido" destaque />
        <Campo r="CBS" v="preenchido" destaque />
      </div>
      <div className="flex items-end justify-between pt-[4px]">
        <div className="space-y-[4px]">
          {[150, 120, 135].map((w, i) => (
            <div key={i} className="h-[5px] rounded-full bg-[#231f20]/12" style={{ width: w }} />
          ))}
        </div>
        <QrFalso />
      </div>
    </div>
  </div>
);

const Campo = ({ r, v, destaque }: { r: string; v: string; destaque?: boolean }) => (
  <div>
    <div className="text-[8.5px] font-bold uppercase tracking-[0.14em] opacity-55">{r}</div>
    <div className="font-semibold" style={destaque ? { color: VINHO } : undefined}>
      {v}
    </div>
  </div>
);

/** Quadradinho que lembra um QR code (padrão fixo, não lê nada). */
const QrFalso = () => {
  const n = 9;
  const cel: boolean[] = Array.from({ length: n * n }, (_, i) => ((i * 7 + (i % 5) * 3) % 11) < 5);
  const canto = (x: number, y: number) => (x < 3 && y < 3) || (x > n - 4 && y < 3) || (x < 3 && y > n - 4);
  return (
    <svg width="54" height="54" viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges">
      {cel.map((on, i) => {
        const x = i % n;
        const y = Math.floor(i / n);
        const c = canto(x, y) || on;
        return c ? <rect key={i} x={x} y={y} width="1" height="1" fill="#231f20" /> : null;
      })}
    </svg>
  );
};

/** Calendário de novembro de 2026 com o dia 1º marcado (começa num domingo). */
export const CalendarioNovembro = ({ className }: { className?: string }) => (
  <div aria-hidden="true" className={`em-sans rounded-[8px] border border-white/15 bg-white/[0.05] p-[16px] ${className ?? ''}`}>
    <div className="flex items-baseline justify-between">
      <span className="em-display text-[26px] font-extrabold uppercase leading-none">Novembro</span>
      <span className="text-[13px] font-semibold opacity-70">2026</span>
    </div>
    <div className="mt-[10px] grid grid-cols-7 gap-[4px] text-center text-[11px]">
      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
        <span key={i} className="pb-[2px] font-bold opacity-55">
          {d}
        </span>
      ))}
      {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
        <span
          key={d}
          className={`flex h-[24px] items-center justify-center rounded-full ${d === 1 ? 'font-extrabold text-white' : 'opacity-75'}`}
          style={d === 1 ? { background: '#e0566b', boxShadow: '0 0 0 4px rgba(224,86,107,0.25)' } : undefined}
        >
          {d}
        </span>
      ))}
    </div>
  </div>
);

/** Uma semana com três dias alternados marcados (o arbitramento). */
export const SemanaAlternada = ({ className }: { className?: string }) => (
  <div aria-hidden="true" className={`em-sans grid grid-cols-7 gap-[10px] ${className ?? ''}`}>
    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d, i) => {
      const marcado = i === 0 || i === 2 || i === 4;
      return (
        <div
          key={d}
          className="flex h-[92px] flex-col items-center justify-center rounded-[8px] border-2"
          style={{ borderColor: marcado ? VINHO : 'rgba(34,22,19,0.15)', background: marcado ? VINHO : 'transparent', color: marcado ? '#f7ecdc' : undefined }}
        >
          <span className="text-[12px] font-bold uppercase tracking-[0.14em] opacity-80">{d}</span>
          <span className="em-display mt-[2px] text-[34px] font-extrabold leading-none">{marcado ? '✓' : '·'}</span>
        </div>
      );
    })}
  </div>
);

// ── Abstratas (no lugar das fotos), cada uma ligada ao texto da página ─────────

/** Bolhas de conversa riscadas (os boatos) e um documento firme (a lei). */
export const BoatoLei = ({ className }: { className?: string }) => (
  <div aria-hidden="true" className={`em-sans relative overflow-hidden rounded-[10px] bg-[#1d1413] ${className ?? ''}`}>
    {[
      [28, 26, 210, 0.55],
      [150, 92, 260, 0.4],
      [40, 160, 190, 0.3],
      [250, 210, 170, 0.22],
    ].map(([x, y, w, o], i) => (
      <div key={i} className="absolute flex h-[46px] items-center gap-[8px] rounded-[18px] rounded-bl-[4px] bg-white/10 px-[14px]" style={{ left: x, top: y, width: w, opacity: o + 0.3 }}>
        <span className="font-bold text-[#e0566b]">✕</span>
        <span className="h-[6px] flex-1 rounded-full bg-white/35" />
      </div>
    ))}
    <div className="absolute bottom-[26px] right-[30px] w-[170px] rotate-[3deg] rounded-[6px] bg-[#f7ecdc] p-[14px] shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
      <div className="h-[8px] w-[70px] rounded-full" style={{ background: VINHO }} />
      {[120, 140, 100, 130].map((w, i) => (
        <div key={i} className="mt-[8px] h-[5px] rounded-full bg-[#231f20]/25" style={{ width: w }} />
      ))}
      <div className="mt-[12px] flex h-[34px] w-[34px] items-center justify-center rounded-full text-[20px] font-extrabold text-white" style={{ background: '#3f7d4e' }}>
        ✓
      </div>
    </div>
  </div>
);

/** Leque de notas: uma NFS-e por aluno, por mês. */
export const LequeDeNotas = ({ className }: { className?: string }) => (
  <div aria-hidden="true" className={className ?? 'relative'}>
    {[-14, -5, 4, 13].map((g, i) => (
      <div key={g} className="absolute bottom-0 left-1/2 w-[205px] origin-bottom" style={{ transform: `translateX(-50%) rotate(${g}deg)`, zIndex: i }}>
        <NotaFiscal />
      </div>
    ))}
  </div>
);
