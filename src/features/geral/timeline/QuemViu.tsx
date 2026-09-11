import { Eye } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface Visualizador {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface QuemViuProps {
  /** Rótulo do mês ("setembro 2026"), usado nos textos. */
  mes: string;
  /** Quem viu, do mais recente para o mais antigo. */
  pessoas: Visualizador[];
  /** Franqueado continua vendo o número, mas não a lista de nomes. */
  podeVerLista: boolean;
}

const Contador = ({ total }: { total: number }) => (
  <>
    <Eye className="h-3 w-3" />
    {total}
  </>
);

/** Olhinho com o número de visualizações. Para colaboradores, o clique abre quem viu. */
const QuemViu = ({ mes, pessoas, podeVerLista }: QuemViuProps) => {
  if (!podeVerLista) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 text-xs opacity-70">
        <Contador total={pessoas.length} />
      </span>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Ver quem viu a timeline de ${mes}`}
          title="Ver quem viu"
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-xs opacity-70 transition-opacity hover:opacity-100"
        >
          <Contador total={pessoas.length} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <p className="border-b px-3 py-2 text-xs font-semibold">
          {pessoas.length === 1 ? '1 pessoa viu' : `${pessoas.length} pessoas viram`} {mes}
        </p>
        <ul className="max-h-64 overflow-y-auto py-1">
          {pessoas.map((p) => (
            <li key={p.user_id} className="flex items-center gap-2 px-3 py-1.5">
              <Avatar className="h-6 w-6">
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">{p.full_name?.[0] ?? 'U'}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-sm">{p.full_name ?? 'Usuário'}</span>
              {p.created_at && (
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {formatDistanceToNowStrict(new Date(p.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              )}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};

export default QuemViu;
