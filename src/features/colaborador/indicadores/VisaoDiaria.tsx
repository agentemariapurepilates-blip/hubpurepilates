import { useState, useMemo } from 'react';
import { format, getDaysInMonth, getDay } from 'date-fns';
import MainLayout from '@/components/layout/MainLayout';
import { Filters } from './components/Filters';
import { useUnits } from './hooks/useUnits';
import { useAggregatedData } from './hooks/useAggregatedData';
import { useDailyGoals } from './hooks/useDailyGoals';
import { useDailyIndicators } from './hooks/useIndicatorMapping';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function VisaoDiaria() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);

  const { isAdmin, profileLoading: adminLoading } = useAuth();
  const { data: units, isLoading: unitsLoading } = useUnits();

  // No Hub não existe recorte por unidade: só administradores e colaboradores
  // da sede acessam estas telas, e todos enxergam todas as unidades.
  const effectiveUnitId = isAdmin ? selectedUnit : null;

  // Usa RPC para buscar dados já agregados por dia (resolve limite de 1000 registros)
  const { data: rawData, isLoading: rawLoading } = useAggregatedData(effectiveUnitId, selectedMonth);
  const { data: goals } = useDailyGoals(effectiveUnitId, selectedMonth);
  const { data: mappings } = useDailyIndicators();

  // Monta todos os dias do mês selecionado com o dia da semana
  const weekdayAbbr = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const totalDays = getDaysInMonth(new Date(year, month - 1));
    return Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const dateObj = new Date(year, month - 1, day);
      const weekday = getDay(dateObj);
      return {
        date: `${selectedMonth}-${day.toString().padStart(2, '0')}`,
        display: day.toString().padStart(2, '0'),
        weekday: weekdayAbbr[weekday],
      };
    });
  }, [selectedMonth]);

  // Calcula os valores diários de cada indicador junto com as metas.
  // Os dados já vêm agregados por dia da RPC, então mapeamos diretamente
  const tableData = useMemo(() => {
    if (!rawData || rawData.length === 0 || !mappings) return [];

    // Dados já vêm agregados por dia da função RPC - apenas converte para Map
    const dataByDate = new Map<string, Record<string, number>>();

    for (const row of rawData) {
      const record: Record<string, number> = {};
      for (const key of Object.keys(row)) {
        if (key !== 'date' && key !== 'unit_id' && key !== 'id' && key !== 'created_at' && key !== 'dt_calculo') {
          record[key] = Number((row as any)[key]) || 0;
        }
      }
      dataByDate.set(row.date, record);
    }

    // Ordena as datas
    const sortedDates = Array.from(dataByDate.keys()).sort();

    return mappings.map(mapping => {
      const columnName = mapping.raw_column_name;
      const dailyValues: Record<string, number> = {};
      const dailyGoals: Record<string, number> = {};
      let mtd = 0;

      // Calcula os valores diários a partir dos dados acumulados (agregados)
      for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const currentData = dataByDate.get(date);
        const prevData = i > 0 ? dataByDate.get(sortedDates[i - 1]) : null;

        const currentValue = currentData?.[columnName] || 0;
        const prevValue = prevData?.[columnName] || 0;
        const dailyValue = i === 0 ? currentValue : currentValue - prevValue;

        dailyValues[date] = dailyValue;
        mtd += dailyValue;
      }

      // Pega as metas diárias desta métrica
      const metricGoals = goals?.filter(g => g.metric_key === mapping.metric_key) || [];
      for (const goal of metricGoals) {
        dailyGoals[goal.date] = goal.daily_target;
      }
      const goalMTD = metricGoals.reduce((sum, g) => sum + g.daily_target, 0);
      const achievement = goalMTD > 0 ? ((mtd / goalMTD) - 1) * 100 : null;

      return {
        metric_key: mapping.metric_key,
        display_name: mapping.display_name,
        dailyValues,
        dailyGoals,
        mtd,
        goalMTD,
        achievement,
      };
    });
  }, [rawData, mappings, goals]);

  const isLoading = unitsLoading || rawLoading || adminLoading;

  const formatNumber = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  };

  const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(0)}%`;
  };

  const getPercentColor = (value: number | null) => {
    if (value === null) return '';
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-destructive';
    return 'text-warning';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Visão Diária
            </h1>
            <p className="text-muted-foreground">Acompanhamento dia a dia</p>
          </div>
          <Filters
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            selectedUnit={selectedUnit}
            onUnitChange={setSelectedUnit}
            units={units}
            hideUnitFilter={!isAdmin}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : mappings && mappings.length === 0 ? (
          <div className="metric-card text-center py-12">
            <p className="text-muted-foreground">Nenhum indicador selecionado para a Visão Diária.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Vá em Administração → DE/PARA Campos e ative a coluna "Diário" nos indicadores desejados.
            </p>
          </div>
        ) : (
          <div className="metric-card p-0 overflow-hidden">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-20 min-w-[180px] border-r">Indicador</TableHead>
                    <TableHead className="sticky left-[180px] bg-card z-20 min-w-[60px] border-r text-center">Tipo</TableHead>
                    {daysInMonth.map(day => (
                      <TableHead key={day.date} className="text-center min-w-[50px] px-2">
                        <div className="text-[10px] text-muted-foreground uppercase">{day.weekday}</div>
                        <div>{day.display}</div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-[80px] bg-muted/50 font-bold border-l">MTD</TableHead>
                    <TableHead className="text-center min-w-[80px] bg-muted/50 font-bold">Meta</TableHead>
                    <TableHead className="text-center min-w-[80px] bg-muted/50 font-bold">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, idx) => (
                    <>
                      {/* Linha 1: Realizado */}
                      <TableRow key={`${row.metric_key}-value`} className={idx > 0 ? 'border-t-2 border-border' : ''}>
                        <TableCell className="sticky left-0 bg-card z-10 font-medium border-r" rowSpan={3}>
                          {row.display_name}
                        </TableCell>
                        <TableCell className="sticky left-[180px] bg-card z-10 text-xs font-semibold text-primary border-r">
                          Real
                        </TableCell>
                        {daysInMonth.map(day => (
                          <TableCell key={day.date} className="text-center text-sm px-2 font-medium">
                            {formatNumber(row.dailyValues[day.date])}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold bg-muted/50 border-l">
                          {formatNumber(row.mtd)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground bg-muted/50" rowSpan={3}>
                          {row.goalMTD ? formatNumber(row.goalMTD) : '-'}
                        </TableCell>
                        <TableCell className={cn(
                          "text-center font-bold bg-muted/50",
                          getPercentColor(row.achievement)
                        )} rowSpan={3}>
                          {row.achievement !== null ? `${row.achievement >= 0 ? '+' : ''}${row.achievement.toFixed(1)}%` : '-'}
                        </TableCell>
                      </TableRow>

                      {/* Linha 2: Meta diária */}
                      <TableRow key={`${row.metric_key}-goal`}>
                        <TableCell className="sticky left-[180px] bg-muted/20 z-10 text-xs text-muted-foreground border-r">
                          Meta
                        </TableCell>
                        {daysInMonth.map(day => (
                          <TableCell key={day.date} className="text-center text-xs text-muted-foreground px-2 bg-muted/20">
                            {row.dailyGoals[day.date] !== undefined ? formatNumber(row.dailyGoals[day.date]) : '-'}
                          </TableCell>
                        ))}
                        <TableCell className="text-center text-muted-foreground bg-muted/30 border-l">-</TableCell>
                      </TableRow>

                      {/* Linha 3: % Atingimento diário */}
                      <TableRow key={`${row.metric_key}-pct`}>
                        <TableCell className="sticky left-[180px] bg-muted/10 z-10 text-xs text-muted-foreground border-r">
                          %
                        </TableCell>
                        {daysInMonth.map(day => {
                          const realizado = row.dailyValues[day.date];
                          const meta = row.dailyGoals[day.date];
                          const pct = meta && meta > 0 ? ((realizado / meta) - 1) * 100 : null;
                          return (
                            <TableCell
                              key={day.date}
                              className={cn("text-center text-xs px-2 bg-muted/10", getPercentColor(pct))}
                            >
                              {pct !== null ? formatPercent(pct) : '-'}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center bg-muted/30 border-l">-</TableCell>
                      </TableRow>
                    </>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
