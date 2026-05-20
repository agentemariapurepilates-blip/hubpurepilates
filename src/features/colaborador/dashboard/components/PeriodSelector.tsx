// Port de "Dashboard Ads - Unidades"/src/app/dashboard/_components/period-selector.tsx.
// Adaptado pra React Router (Vite): next/navigation → react-router-dom.

import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

const presets = [
  { id: 'ontem', label: 'Ontem' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
  { id: '180d', label: '180d' },
] as const;

export function PeriodSelector({ active }: { active: string }) {
  const [sp, setSp] = useSearchParams();
  const [open, setOpen] = useState(false);
  const isCustom = sp.has('from') && sp.has('to');

  function pick(id: string) {
    const next = new URLSearchParams(sp);
    next.delete('from');
    next.delete('to');
    next.set('range', id);
    setSp(next);
  }

  return (
    <div className="flex gap-1 bg-white p-1 border border-gray-200 rounded-lg">
      {presets.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => pick(p.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
            active === p.id && !isCustom ? 'bg-pure-red text-white' : 'text-pure-gray hover:text-pure-black'
          }`}
        >
          {p.label}
        </button>
      ))}
      <div className="w-px bg-gray-200 mx-1" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 ${
              isCustom ? 'bg-pure-red text-white' : 'text-pure-black'
            }`}
          >
            <CalendarIcon className="size-3.5" />
            {isCustom ? `${sp.get('from')} → ${sp.get('to')}` : 'Personalizado'}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          <CustomRange
            onApply={(from, to) => {
              const next = new URLSearchParams(sp);
              next.delete('range');
              next.set('from', from);
              next.set('to', to);
              setSp(next);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function CustomRange({ onApply }: { onApply: (from: string, to: string) => void }) {
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({});
  return (
    <div className="p-2 space-y-2">
      <Calendar mode="range" selected={range as never} onSelect={setRange as never} numberOfMonths={2} />
      <p className="text-xs text-pure-gray bg-pure-red/5 px-3 py-2 rounded">
        Janela máxima: 180 dias. Datas futuras ou anteriores a 180 dias atrás são ajustadas.
      </p>
      <Button
        className="w-full bg-pure-red hover:bg-pure-red/90"
        disabled={!range.from || !range.to}
        onClick={() =>
          range.from && range.to && onApply(
            range.from.toISOString().slice(0, 10),
            range.to.toISOString().slice(0, 10),
          )
        }
      >
        Aplicar
      </Button>
    </div>
  );
}
