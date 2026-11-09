import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { dataMedia, diasEntre, hojeEmBrasilia, somarDias } from './projetos';

// Linha do tempo (Gantt), como a do ClickUp: cada linha vira uma barra do início
// à entrega. Arrastar a barra move as duas datas; puxar uma ponta muda só ela.
// Linha sem datas: um clique no dia cria a barra (3 dias). Faixas de fundo e
// marcos mostram as etapas do projeto; a linha vermelha é hoje.

export interface LinhaGantt {
  id: string;
  rotulo: string;
  detalhe?: React.ReactNode;
  recuo?: boolean;
  cor: string;
  de: string | null;
  ate: string | null;
  feito?: boolean;
  /** Pedaços coloridos dentro da barra (as etapas de um projeto). */
  partes?: { de: string; ate: string; cor: string; nome: string }[];
}

export interface FaixaGantt {
  de: string;
  ate: string;
  cor: string;
  nome: string;
}

const LARGURA_DIA = 34;
const ALTURA_LINHA = 40;
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type Arraste = { id: string; modo: 'mover' | 'inicio' | 'fim'; x0: number; de: string; ate: string; delta: number };

export function LinhaDoTempo({
  linhas,
  faixas = [],
  onMudarDatas,
  onAbrir,
  vazio,
}: {
  linhas: LinhaGantt[];
  faixas?: FaixaGantt[];
  onMudarDatas?: (id: string, de: string, ate: string) => void;
  onAbrir?: (id: string) => void;
  vazio?: React.ReactNode;
}) {
  const hoje = hojeEmBrasilia();
  const [arraste, setArraste] = useState<Arraste | null>(null);
  const rolagem = useRef<HTMLDivElement>(null);

  // O período: das datas mais antigas às mais novas, com folga, nunca menos de 6 semanas.
  const { inicio, dias } = useMemo(() => {
    const datas = [hoje, ...linhas.flatMap((l) => [l.de, l.ate]), ...faixas.flatMap((f) => [f.de, f.ate])].filter(Boolean) as string[];
    const min = datas.reduce((a, b) => (a < b ? a : b));
    const max = datas.reduce((a, b) => (a > b ? a : b));
    const ini = somarDias(min, -5);
    return { inicio: ini, dias: Math.max(42, diasEntre(ini, max) + 14) };
  }, [linhas, faixas, hoje]);

  const x = (d: string) => diasEntre(inicio, d) * LARGURA_DIA;
  const listaDias = Array.from({ length: dias }, (_, i) => somarDias(inicio, i));
  const meses = listaDias.reduce<{ nome: string; de: number; n: number }[]>((acc, d, i) => {
    const nome = `${MESES[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;
    if (acc.length && acc[acc.length - 1].nome === nome) acc[acc.length - 1].n += 1;
    else acc.push({ nome, de: i, n: 1 });
    return acc;
  }, []);

  // As datas de uma linha considerando o arraste em curso.
  const datasDe = (l: LinhaGantt) => {
    if (!arraste || arraste.id !== l.id || !l.de || !l.ate) return { de: l.de, ate: l.ate };
    const { modo, delta, de, ate } = arraste;
    if (modo === 'mover') return { de: somarDias(de, delta), ate: somarDias(ate, delta) };
    if (modo === 'inicio') {
      const novo = somarDias(de, delta);
      return { de: novo > ate ? ate : novo, ate };
    }
    const novo = somarDias(ate, delta);
    return { de, ate: novo < de ? de : novo };
  };

  const comecar = (e: React.PointerEvent, l: LinhaGantt, modo: Arraste['modo']) => {
    if (!onMudarDatas || !l.de || !l.ate) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setArraste({ id: l.id, modo, x0: e.clientX, de: l.de, ate: l.ate, delta: 0 });
  };
  const mover = (e: React.PointerEvent) => {
    if (!arraste) return;
    const delta = Math.round((e.clientX - arraste.x0) / LARGURA_DIA);
    if (delta !== arraste.delta) setArraste({ ...arraste, delta });
  };
  const soltar = (l: LinhaGantt) => {
    if (!arraste) return;
    const { de, ate } = datasDe(l);
    const clique = arraste.delta === 0;
    setArraste(null);
    if (clique) return onAbrir?.(l.id);
    if (de && ate) onMudarDatas?.(l.id, de, ate);
  };

  if (linhas.length === 0) return <>{vazio}</>;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex">
        {/* Nomes */}
        <div className="w-[300px] shrink-0 border-r border-border">
          <div className="flex h-[52px] items-end border-b border-border px-4 pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Nome</div>
          {linhas.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onAbrir?.(l.id)}
              className="flex w-full items-center gap-2 border-b border-border/60 px-4 text-left text-sm hover:bg-muted/50"
              style={{ height: ALTURA_LINHA }}
            >
              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-sm', l.recuo && 'ml-5')} style={{ background: l.cor }} />
              <span className={cn('min-w-0 flex-1 truncate', l.feito && 'text-muted-foreground line-through')}>{l.rotulo}</span>
              {l.detalhe}
            </button>
          ))}
        </div>

        {/* Grade */}
        <div ref={rolagem} className="min-w-0 flex-1 overflow-x-auto">
          <div className="relative" style={{ width: dias * LARGURA_DIA }}>
            {/* Cabeçalho: meses e dias */}
            <div className="sticky top-0 z-10 border-b border-border bg-card">
              <div className="flex h-6">
                {meses.map((m) => (
                  <div key={m.nome} className="truncate border-r border-border/60 px-2 text-[11px] font-semibold leading-6" style={{ width: m.n * LARGURA_DIA }}>
                    {m.nome}
                  </div>
                ))}
              </div>
              <div className="flex h-[26px]">
                {listaDias.map((d) => {
                  const dow = new Date(`${d}T12:00:00Z`).getUTCDay();
                  return (
                    <div
                      key={d}
                      className={cn(
                        'flex flex-col items-center justify-center text-[10px] leading-none',
                        d === hoje ? 'font-bold text-red-600' : 'text-muted-foreground',
                        (dow === 0 || dow === 6) && 'bg-muted/50',
                      )}
                      style={{ width: LARGURA_DIA }}
                    >
                      <span>{DIAS_SEMANA[dow]}</span>
                      <span>{+d.slice(8, 10)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fundo: fins de semana e faixas das etapas */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[52px]">
              {listaDias.map((d, i) => {
                const dow = new Date(`${d}T12:00:00Z`).getUTCDay();
                return dow === 0 || dow === 6 ? <div key={d} className="absolute bottom-0 top-0 bg-muted/40" style={{ left: i * LARGURA_DIA, width: LARGURA_DIA }} /> : null;
              })}
              {faixas.map((f) => (
                <div key={f.nome} className="absolute bottom-0 top-0" style={{ left: x(f.de), width: (diasEntre(f.de, f.ate) + 1) * LARGURA_DIA, background: `${f.cor}14` }}>
                  <div className="h-full border-r-2 border-dashed" style={{ borderColor: `${f.cor}80` }} />
                </div>
              ))}
              <div className="absolute bottom-0 top-0 w-0.5 bg-red-500" style={{ left: x(hoje) + LARGURA_DIA / 2 }} />
            </div>

            {/* Nome das etapas no topo das faixas */}
            {faixas.length > 0 && (
              <div className="pointer-events-none absolute left-0 top-[52px] z-[1] h-0">
                {faixas.map((f) => (
                  <span
                    key={f.nome}
                    className="absolute top-1 truncate rounded px-1.5 text-[10px] font-semibold text-white"
                    style={{ left: x(f.de) + 4, maxWidth: (diasEntre(f.de, f.ate) + 1) * LARGURA_DIA - 8, background: f.cor }}
                  >
                    {f.nome} · {dataMedia(f.ate)}
                  </span>
                ))}
              </div>
            )}

            {/* Barras */}
            <div className={cn('relative', faixas.length > 0 && 'pt-0')}>
              {linhas.map((l) => {
                const { de, ate } = datasDe(l);
                return (
                  <div
                    key={l.id}
                    className="relative border-b border-border/60"
                    style={{ height: ALTURA_LINHA }}
                    onClick={(e) => {
                      // Linha sem datas: o clique no dia cria a barra.
                      if (de || !onMudarDatas) return;
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const dia = somarDias(inicio, Math.floor((e.clientX - rect.left) / LARGURA_DIA));
                      onMudarDatas(l.id, dia, somarDias(dia, 2));
                    }}
                  >
                    {de && ate ? (
                      <div
                        onPointerDown={(e) => comecar(e, l, 'mover')}
                        onPointerMove={mover}
                        onPointerUp={() => soltar(l)}
                        className={cn(
                          'group absolute top-[7px] flex h-[26px] items-center overflow-hidden rounded-md text-[11px] font-medium text-white shadow-sm',
                          onMudarDatas ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                          l.feito && 'opacity-60',
                        )}
                        style={{ left: x(de) + 2, width: (diasEntre(de, ate) + 1) * LARGURA_DIA - 4, background: l.partes ? '#e2e8f0' : l.cor }}
                        title={`${l.rotulo}: ${dataMedia(de)} → ${dataMedia(ate)}`}
                      >
                        {l.partes?.map((p) => (
                          <span
                            key={p.nome}
                            className="absolute bottom-0 top-0"
                            style={{ left: diasEntre(de, p.de) * LARGURA_DIA, width: (diasEntre(p.de, p.ate) + 1) * LARGURA_DIA, background: p.cor }}
                            title={`${p.nome} até ${dataMedia(p.ate)}`}
                          />
                        ))}
                        <span className="relative truncate px-2 drop-shadow-sm">{l.rotulo}</span>
                        {onMudarDatas && (
                          <>
                            <span onPointerDown={(e) => comecar(e, l, 'inicio')} className="absolute bottom-0 left-0 top-0 w-2 cursor-ew-resize bg-black/0 group-hover:bg-black/20" />
                            <span onPointerDown={(e) => comecar(e, l, 'fim')} className="absolute bottom-0 right-0 top-0 w-2 cursor-ew-resize bg-black/0 group-hover:bg-black/20" />
                          </>
                        )}
                      </div>
                    ) : (
                      onMudarDatas && <span className="absolute left-3 top-[11px] text-[11px] text-muted-foreground/70">Sem datas: clique no dia para criar a barra</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
