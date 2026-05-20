// Combobox com busca. Lista vem de RLS — admin vê todas; usuário comum vê só as atribuídas.

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type UnitOption = {
  id: string;
  external_id: string;
  nome: string;
  bairro: string | null;
  cidade: string | null;
};

export function UnitPicker({
  units,
  selectedId,
  onSelect,
}: {
  units: UnitOption[];
  selectedId: string | null;
  onSelect: (unit: UnitOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = units.find((u) => u.id === selectedId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {selected ? (
            <span className="truncate">
              {selected.nome}
              {selected.bairro && <span className="text-muted-foreground"> · {selected.bairro}</span>}
            </span>
          ) : (
            <span className="text-muted-foreground">Selecione a unidade...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Buscar por nome ou bairro..." />
          <CommandList>
            <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
            <CommandGroup>
              {units.map((u) => (
                <CommandItem
                  key={u.id}
                  value={`${u.nome} ${u.bairro ?? ''} ${u.cidade ?? ''}`}
                  onSelect={() => {
                    onSelect(u);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', selectedId === u.id ? 'opacity-100' : 'opacity-0')} />
                  <span>{u.nome}</span>
                  {u.bairro && <span className="ml-2 text-xs text-muted-foreground">{u.bairro}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
