import { CalendarCheck, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Áreas de atuação exibidas como quadros, na ordem da tela. */
export const BOARD_AREAS = [
  'Marketing',
  'Consultoras',
  'Implantação',
  'Tecnologia',
  'Expansão',
  'Estúdios',
  'Academy',
  'Franchising',
  'Pure Store',
  'RH',
  'Gravações',
];

/** Valor da lateral para a Minha área de trabalho. Não é setor: junta as tarefas da pessoa de todos eles. */
export const MINHA_AREA = '__minha_area__';

interface DemandBoardSidebarProps {
  selected: string;
  onSelect: (area: string) => void;
  counts: Record<string, number>;
  /** Áreas com demanda que não estão em BOARD_AREAS. Aparecem no fim, para nenhuma demanda sumir. */
  extraAreas: string[];
  /** Tarefas em aberto em que a pessoa é responsável. */
  minhaAreaCount: number;
}

const DemandBoardSidebar = ({ selected, onSelect, counts, extraAreas, minhaAreaCount }: DemandBoardSidebarProps) => {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const itens = [
    ...[...BOARD_AREAS, ...extraAreas].map((area) => ({ value: area, label: area, count: counts[area] ?? 0 })),
    // Por último: a visão geral não é um setor, é o atalho para todos eles.
    { value: 'all', label: 'Ver todos os setores', count: total },
  ];
  const minhaAreaAtiva = selected === MINHA_AREA;

  return (
    <>
      {/* Computador: coluna fixa à esquerda com os setores */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-4 rounded-xl border bg-card p-2">
          {/* No topo, como o "Meu trabalho" do Monday */}
          <button
            type="button"
            onClick={() => onSelect(MINHA_AREA)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors',
              minhaAreaAtiva ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted',
            )}
          >
            <CalendarCheck className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate text-left">Minha área de trabalho</span>
            {minhaAreaCount > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">{minhaAreaCount}</span>
            )}
          </button>

          <div className="mx-2 my-2 border-t" />

          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Setores
          </p>
          <nav className="space-y-0.5">
            {itens.map((item) => {
              const ativo = selected === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onSelect(item.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    ativo ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground/80 hover:bg-muted',
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  {item.count > 0 && (
                    <span className="text-xs tabular-nums text-muted-foreground">{item.count}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Celular: não cabe coluna lateral, vira faixa horizontal */}
      <div className="lg:hidden -mx-2 overflow-x-auto px-2">
        <div className="flex gap-2 pb-1">
          <button
            type="button"
            onClick={() => onSelect(MINHA_AREA)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              minhaAreaAtiva ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
            )}
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            Minha área de trabalho
            {minhaAreaCount > 0 && (
              <span className={cn('text-xs tabular-nums', minhaAreaAtiva ? 'opacity-80' : 'text-muted-foreground')}>
                {minhaAreaCount}
              </span>
            )}
          </button>
          {itens.map((item) => {
            const ativo = selected === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onSelect(item.value)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors',
                  ativo ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
                )}
              >
                {item.label}
                {item.count > 0 && (
                  <span className={cn('text-xs tabular-nums', ativo ? 'opacity-80' : 'text-muted-foreground')}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default DemandBoardSidebar;
