import { useState } from 'react';
import { Calendar as IconeCalendario, Check, Flag, UserPlus, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  COR_DO_SINAL,
  PRIORIDADES,
  STATUS,
  dataMedia,
  sinalDoPrazo,
  statusDe,
  type PessoaMarketing,
  type Prioridade,
  type StatusItem,
} from './projetos';

// Peças pequenas dos Projetos, no espírito do ClickUp: tudo clica e abre um
// seletor no lugar, sem formulário.

const iniciais = (nome: string | null) =>
  (nome ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export function Avatarzinho({ pessoa, tamanho = 24 }: { pessoa: PessoaMarketing | undefined; tamanho?: number }) {
  return (
    <Avatar className="ring-2 ring-background" style={{ width: tamanho, height: tamanho }} title={pessoa?.full_name ?? ''}>
      <AvatarImage src={pessoa?.avatar_url || undefined} />
      <AvatarFallback className="bg-primary/15 text-primary font-semibold" style={{ fontSize: tamanho * 0.4 }}>
        {iniciais(pessoa?.full_name ?? null)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Avatares empilhados, como no ClickUp. */
export function Avatares({ ids, equipe, max = 3, tamanho = 24 }: { ids: string[]; equipe: PessoaMarketing[]; max?: number; tamanho?: number }) {
  const pessoas = ids.map((id) => equipe.find((p) => p.user_id === id)).filter(Boolean) as PessoaMarketing[];
  if (pessoas.length === 0) return null;
  return (
    <span className="flex -space-x-1.5">
      {pessoas.slice(0, max).map((p) => (
        <Avatarzinho key={p.user_id} pessoa={p} tamanho={tamanho} />
      ))}
      {pessoas.length > max && (
        <span
          className="flex items-center justify-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-background"
          style={{ width: tamanho, height: tamanho }}
        >
          +{pessoas.length - max}
        </span>
      )}
    </span>
  );
}

/** Escolhe um ou vários responsáveis do time. */
export function SeletorDePessoas({
  equipe,
  valor,
  onMudar,
  unico,
  children,
}: {
  equipe: PessoaMarketing[];
  valor: string[];
  onMudar: (ids: string[]) => void;
  unico?: boolean;
  children?: React.ReactNode;
}) {
  const [busca, setBusca] = useState('');
  const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const lista = equipe.filter((p) => normal(p.full_name ?? '').includes(normal(busca)));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center rounded-md px-1 py-0.5 hover:bg-muted" onClick={(e) => e.stopPropagation()}>
          {children ??
            (valor.length ? (
              <Avatares ids={valor} equipe={equipe} />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground">
                <UserPlus className="h-3 w-3" />
              </span>
            ))}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start" onClick={(e) => e.stopPropagation()}>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar pessoa..."
          className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
        <div className="max-h-64 overflow-y-auto">
          {lista.map((p) => {
            const marcado = valor.includes(p.user_id);
            return (
              <button
                key={p.user_id}
                type="button"
                onClick={() => onMudar(unico ? (marcado ? [] : [p.user_id]) : marcado ? valor.filter((x) => x !== p.user_id) : [...valor, p.user_id])}
                className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted', marcado && 'bg-primary/5')}
              >
                <Avatarzinho pessoa={p} />
                <span className="flex-1 truncate">{p.full_name}</span>
                {marcado && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Pílula de status, como no ClickUp: clica e troca. */
export function PilulaStatus({ valor, onMudar, grande }: { valor: StatusItem; onMudar: (s: StatusItem) => void; grande?: boolean }) {
  const s = statusDe(valor);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'inline-flex items-center gap-1.5 rounded font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90',
            grande ? 'px-3 py-1.5 text-xs' : 'px-2 py-0.5 text-[10px]',
          )}
          style={{ background: s.cor }}
        >
          {s.nome}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        {STATUS.map((x) => (
          <button
            key={x.chave}
            type="button"
            onClick={() => onMudar(x.chave)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
          >
            <span className="h-3 w-3 rounded-sm" style={{ background: x.cor }} />
            <span className="flex-1 text-left">{x.nome}</span>
            {x.chave === valor && <Check className="h-4 w-4 text-primary" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** Bandeirinha de prioridade. */
export function BandeiraPrioridade({ valor, onMudar, comNome }: { valor: Prioridade | null; onMudar: (p: Prioridade | null) => void; comNome?: boolean }) {
  const p = PRIORIDADES.find((x) => x.chave === valor);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-sm hover:bg-muted">
          <Flag className="h-4 w-4" style={{ color: p?.cor ?? '#cbd5e1' }} fill={p ? p.cor : 'none'} />
          {comNome && <span className={cn(!p && 'text-muted-foreground')}>{p?.nome ?? 'Sem prioridade'}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        {PRIORIDADES.map((x) => (
          <button key={x.chave} type="button" onClick={() => onMudar(x.chave)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
            <Flag className="h-4 w-4" style={{ color: x.cor }} fill={x.cor} />
            {x.nome}
          </button>
        ))}
        <button type="button" onClick={() => onMudar(null)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
          Limpar
        </button>
      </PopoverContent>
    </Popover>
  );
}

/** Uma data clicável ("9 nov"), vermelha se atrasada. */
export function CampoData({
  valor,
  onMudar,
  concluido,
  placeholder = 'Data',
  semSinal,
}: {
  valor: string | null;
  onMudar: (d: string | null) => void;
  concluido?: boolean;
  placeholder?: string;
  semSinal?: boolean;
}) {
  const sinal = semSinal ? null : sinalDoPrazo(valor, !!concluido);
  return (
    <label className="relative inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-sm hover:bg-muted" onClick={(e) => e.stopPropagation()}>
      {!valor && <IconeCalendario className="h-3.5 w-3.5 text-muted-foreground" />}
      <span className={cn('tabular-nums', valor ? (sinal ? COR_DO_SINAL[sinal] : '') : 'text-muted-foreground', sinal === 'atrasado' && 'font-medium')}>
        {valor ? dataMedia(valor) : placeholder}
      </span>
      <input
        type="date"
        value={valor ?? ''}
        onChange={(e) => onMudar(e.target.value || null)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={placeholder}
      />
    </label>
  );
}

/** Barrinha de progresso fina. */
export function BarraProgresso({ pct, cor = '#10b981' }: { pct: number; cor?: string }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <span className="block h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cor }} />
    </span>
  );
}
