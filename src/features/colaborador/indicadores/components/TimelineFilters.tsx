import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Unit } from '../types';
import { CalendarDays, CalendarRange } from 'lucide-react';
import { getRecentMonths } from '../lib/periods';
import { Granularity } from '../hooks/useTimelineData';
import { UnitFilter } from './UnitFilter';

interface TimelineFiltersProps {
  granularity: Granularity;
  onGranularityChange: (granularity: Granularity) => void;
  fromMonth: string;
  toMonth: string;
  onRangeChange: (from: string, to: string) => void;
  selectedUnit: number | null;
  onUnitChange: (unitId: number | null) => void;
  units: Unit[] | undefined;
  hideUnitFilter?: boolean;
  unitName?: string;
  /**
   * Esconde o seletor Por dia / Por mês. Para telas cuja regra é mensal por
   * definição (Clusters de Matriculados): deixar o botão visível prometeria
   * uma visão diária que a tela não tem.
   */
  hideGranularity?: boolean;
}

export function TimelineFilters({
  granularity,
  onGranularityChange,
  fromMonth,
  toMonth,
  onRangeChange,
  selectedUnit,
  onUnitChange,
  units,
  hideUnitFilter = false,
  unitName,
  hideGranularity = false,
}: TimelineFiltersProps) {
  const months = getRecentMonths(12);

  // Um intervalo invertido não mostra nada, então a outra ponta acompanha.
  const handleFromChange = (value: string) => {
    onRangeChange(value, value > toMonth ? value : toMonth);
  };

  const handleToChange = (value: string) => {
    onRangeChange(value < fromMonth ? value : fromMonth, value);
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center">
      {!hideGranularity && (
        <Tabs value={granularity} onValueChange={(v) => onGranularityChange(v as Granularity)}>
          <TabsList>
            <TabsTrigger value="day" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Por dia
            </TabsTrigger>
            <TabsTrigger value="month" className="gap-2">
              <CalendarRange className="h-4 w-4" />
              Por mês
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="flex items-center gap-2">
        <label htmlFor="timeline-from" className="text-sm text-muted-foreground">
          De
        </label>
        <Select value={fromMonth} onValueChange={handleFromChange}>
          <SelectTrigger id="timeline-from" className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label htmlFor="timeline-to" className="text-sm text-muted-foreground">
          até
        </label>
        <Select value={toMonth} onValueChange={handleToChange}>
          <SelectTrigger id="timeline-to" className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <UnitFilter
        selectedUnit={selectedUnit}
        onUnitChange={onUnitChange}
        units={units}
        readOnly={hideUnitFilter}
        unitName={unitName}
      />
    </div>
  );
}

