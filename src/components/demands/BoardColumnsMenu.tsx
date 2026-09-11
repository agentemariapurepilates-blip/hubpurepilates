import { Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { flagsFor, useDemandLabels } from './demandLabels';

/** O "+" do fim do cabeçalho da tabela: liga e desliga as colunas de etiqueta do setor. */
export function BoardColumnsMenu({ department }: { department: string }) {
  const api = useDemandLabels();
  const flags = flagsFor(api.settings, department);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Colunas de ${department}`}
          title="Colunas do setor"
          className="flex h-full w-full items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Colunas de {department}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={flags.show_status_labels}
          onCheckedChange={(v) => api.alternar(department, 'show_status_labels', Boolean(v))}
        >
          Status por etiqueta
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={flags.show_frente}
          onCheckedChange={(v) => api.alternar(department, 'show_frente', Boolean(v))}
        >
          Frente de negócio
        </DropdownMenuCheckboxItem>
        <p className="px-2 pb-1.5 pt-2 text-[11px] leading-snug text-muted-foreground">
          Os grupos continuam valendo. As etiquetas entram como colunas a mais, só neste setor.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
