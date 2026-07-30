import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Unit } from '../types';
import { Calendar } from 'lucide-react';
import { getRecentMonths } from '../lib/periods';
import { UnitFilter } from './UnitFilter';

interface FiltersProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  selectedUnit: number | null;
  onUnitChange: (unitId: number | null) => void;
  units: Unit[] | undefined;
  hideUnitFilter?: boolean;
  unitName?: string;
}

export function Filters({
  selectedMonth,
  onMonthChange,
  selectedUnit,
  onUnitChange,
  units,
  hideUnitFilter = false,
  unitName,
}: FiltersProps) {
  const months = getRecentMonths(12);

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecione o mês" />
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

