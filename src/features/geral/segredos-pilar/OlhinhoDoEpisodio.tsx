import { Eye } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { QuemViuEpisodio } from './useVisualizacoes';

// Olhinho com o número de visualizações de um episódio — mesmo desenho do
// QuemViu da Timeline (components/timeline/../QuemViu.tsx), adaptado porque
// aqui o número vem separado da lista: o franqueado recebe só a contagem
// (função segredos_pilar_contagem) e nunca os nomes.
//
// Conta PESSOAS, não aberturas: reabrir o episódio não soma de novo.

const OlhinhoDoEpisodio = ({
  total,
  detalhe,
  podeVerLista,
  rotulo,
}: {
  total: number;
  /** Só chega para colaborador/admin. */
  detalhe?: QuemViuEpisodio;
  podeVerLista: boolean;
  /** "Episódio 2 · R de Recepcionar", usado nos textos. */
  rotulo: string;
}) => {
  const pessoas = detalhe?.pessoas ?? [];

  if (!podeVerLista || pessoas.length === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        title={`${total} ${total === 1 ? 'pessoa viu' : 'pessoas viram'}`}
      >
        <Eye className="h-3.5 w-3.5" />
        {total}
      </span>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Ver quem assistiu ${rotulo}`}
          title="Ver quem assistiu"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-full text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Eye className="h-3.5 w-3.5" />
          {total}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0" onClick={(e) => e.stopPropagation()}>
        <p className="border-b px-3 py-2 text-xs font-semibold">
          {pessoas.length === 1 ? '1 pessoa assistiu' : `${pessoas.length} pessoas assistiram`}
        </p>
        <ul className="max-h-64 overflow-y-auto py-1">
          {pessoas.map((p) => (
            <li key={p.user_id} className="flex items-center gap-2 px-3 py-1.5">
              <Avatar className="h-6 w-6">
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">{p.nome[0] ?? 'U'}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-sm">{p.nome}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatDistanceToNowStrict(new Date(p.visto_em), { addSuffix: true, locale: ptBR })}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};

export default OlhinhoDoEpisodio;
