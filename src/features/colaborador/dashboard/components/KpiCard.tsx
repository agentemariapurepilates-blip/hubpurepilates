// Port de "Dashboard Ads - Unidades"/src/app/dashboard/_components/kpi-card.tsx.
// Substituições: pure-dark → pure-black (hub usa essa nomenclatura).

import { Info } from 'lucide-react';

export function KpiCard({
  label,
  value,
  hint,
  info,
  accent = false,
  size = 'md',
}: {
  label: string;
  value: string;
  hint?: string;
  info?: string;
  accent?: boolean;
  size?: 'md' | 'sm';
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-4 ${accent ? 'border-t-[3px] border-t-pure-red' : ''}`}
    >
      <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-pure-gray">
        <span>{label}</span>
        {info && (
          <span className="relative inline-flex group" tabIndex={0}>
            <Info className="size-3.5 text-pure-gray/70 cursor-help" strokeWidth={2} />
            <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 hidden group-hover:block group-focus:block w-56 bg-pure-black text-white text-[11px] font-normal normal-case tracking-normal leading-snug rounded-md px-3 py-2 shadow-lg">
              {info}
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-pure-black rotate-45" />
            </span>
          </span>
        )}
      </div>
      <div
        className={`${size === 'md' ? 'text-3xl' : 'text-xl'} font-bold ${accent ? 'text-pure-red' : 'text-pure-black'} mt-1`}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-pure-gray mt-1">{hint}</div>}
    </div>
  );
}

export const fmtInt = (n: number) => n.toLocaleString('pt-BR');
export const fmtBrl = (n: number | null) =>
  n === null
    ? '—'
    : `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
