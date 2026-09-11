import { Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { Colaborador } from '@/hooks/useColaboradores';

/** Minúsculas e sem acento: "jose" acha "José", "conceicao" acha "Conceição". */
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

interface ColaboradorPickerProps {
  colaboradores: Colaborador[];
  isSelected: (userId: string) => boolean;
  onToggle: (colaborador: Colaborador) => void;
  disabled?: boolean;
  className?: string;
  /** Altura máxima da lista rolável. */
  listClassName?: string;
}

/**
 * Lista de colaboradores com busca por nome, usada para escolher responsáveis
 * de uma demanda (criar, editar e no detalhe).
 */
export function ColaboradorPicker({
  colaboradores,
  isSelected,
  onToggle,
  disabled,
  className,
  listClassName,
}: ColaboradorPickerProps) {
  return (
    <Command
      // O filtro padrão do cmdk não ignora acento. Aqui cada palavra digitada
      // precisa aparecer em algum ponto do nome, sem acento e em qualquer ordem.
      filter={(_value, search, keywords) => {
        const nome = normalizar((keywords ?? []).join(' '));
        return normalizar(search).split(/\s+/).every((termo) => nome.includes(termo)) ? 1 : 0;
      }}
      className={className}
    >
      <CommandInput placeholder="Buscar pelo nome..." />
      <CommandList className={cn('max-h-48', listClassName)}>
        <CommandEmpty>Ninguém encontrado.</CommandEmpty>
        {colaboradores.map((colaborador) => {
          const selecionado = isSelected(colaborador.user_id);
          return (
            <CommandItem
              key={colaborador.user_id}
              // O id garante valor único mesmo com nomes repetidos; a busca
              // olha só o nome, passado em `keywords`.
              value={colaborador.user_id}
              keywords={[colaborador.full_name ?? '']}
              disabled={disabled}
              onSelect={() => onToggle(colaborador)}
              className={cn('gap-2 cursor-pointer', selecionado && 'bg-primary/10')}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={colaborador.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{colaborador.full_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate">{colaborador.full_name || 'Usuário'}</span>
              {selecionado && <Check className="h-4 w-4 text-primary" />}
            </CommandItem>
          );
        })}
      </CommandList>
    </Command>
  );
}
