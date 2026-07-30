import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Unit } from '../types';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnitFilterProps {
  selectedUnit: number | null;
  onUnitChange: (unitId: number | null) => void;
  units: Unit[] | undefined;
  /** Usuário de unidade não escolhe: vê o nome da própria unidade, sem seletor. */
  readOnly?: boolean;
  unitName?: string;
}

/**
 * Seletor de unidade, compartilhado pelas páginas do painel.
 * `null` significa "todas as unidades".
 */
export function UnitFilter({
  selectedUnit,
  onUnitChange,
  units,
  readOnly = false,
  unitName,
}: UnitFilterProps) {
  const [open, setOpen] = useState(false);

  if (readOnly) {
    if (!unitName) return null;
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{unitName}</span>
      </div>
    );
  }

  const selectedUnitName = selectedUnit
    ? units?.find((u) => u.id === selectedUnit)?.name
    : 'Todas as unidades';

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[250px] justify-between font-normal"
          >
            <span className="truncate">{selectedUnitName}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Buscar unidade..." />
            <CommandList>
              <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onUnitChange(null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedUnit === null ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  Todas as unidades
                </CommandItem>
                {units?.map((unit) => (
                  <CommandItem
                    key={unit.id}
                    value={unit.name}
                    onSelect={() => {
                      onUnitChange(unit.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedUnit === unit.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {unit.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

