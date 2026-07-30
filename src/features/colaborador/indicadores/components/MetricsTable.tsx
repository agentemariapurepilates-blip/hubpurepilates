import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AggregatedMetric, PeriodMetric } from '../types';
import { cn } from '@/lib/utils';

interface MetricsTableProps {
  data: AggregatedMetric[];
  className?: string;
}

export function MetricsTable({ data, className }: MetricsTableProps) {
  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val);
  };

  const formatPercent = (val: number | null) => {
    if (val === null) return '-';
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(0)}%`;
  };

  const getPercentClass = (val: number | null) => {
    if (val === null) return '';
    if (val > 0) return 'bg-success/10 text-success';
    if (val < 0) return 'bg-destructive/10 text-destructive';
    return 'bg-warning/10 text-warning';
  };

  const renderPeriodCell = (period: PeriodMetric, isForecast = false) => (
    <>
      <TableCell className="text-right tabular-nums font-medium">
        {formatNumber(period.value)}
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {period.target ? formatNumber(period.target) : '-'}
      </TableCell>
      <TableCell className="text-right">
        <span
          className={cn(
            'inline-flex items-center justify-center min-w-[48px] px-2 py-1 rounded-full text-xs font-semibold',
            getPercentClass(period.achievement)
          )}
        >
          {formatPercent(period.achievement)}
        </span>
      </TableCell>
    </>
  );

  const renderPeriodCells = (period: PeriodMetric, showBorderRight = false) => (
    <>
      <TableCell className="text-right tabular-nums font-medium py-2">
        {formatNumber(period.value)}
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground py-2">
        {period.target ? formatNumber(period.target) : '-'}
      </TableCell>
      <TableCell className={cn("text-right py-2", showBorderRight && "border-r border-border")}>
        <span
          className={cn(
            'inline-flex items-center justify-center min-w-[42px] px-1.5 py-0.5 rounded text-xs font-semibold',
            getPercentClass(period.achievement)
          )}
        >
          {formatPercent(period.achievement)}
        </span>
      </TableCell>
    </>
  );

  return (
    <div className={cn('metric-card p-0 overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-lg">Indicadores Agregados</h3>
        <p className="text-sm text-muted-foreground">D-1, MTW, MTD e Forecast com metas e % atingimento</p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 border-b-2 border-border">
              <TableHead rowSpan={2} className="font-semibold align-bottom border-r border-border min-w-[160px]">
                Indicador
              </TableHead>
              <TableHead colSpan={3} className="text-center font-semibold border-r border-border bg-primary/5">
                D-1
              </TableHead>
              <TableHead colSpan={3} className="text-center font-semibold border-r border-border bg-primary/5">
                MTW
              </TableHead>
              <TableHead colSpan={3} className="text-center font-semibold border-r border-border bg-primary/5">
                MTD
              </TableHead>
              <TableHead colSpan={3} className="text-center font-semibold bg-primary/5">
                Forecast
              </TableHead>
            </TableRow>
            <TableRow className="bg-muted/20">
              {/* D-1 */}
              <TableHead className="text-right text-xs py-1.5 font-medium">Real</TableHead>
              <TableHead className="text-right text-xs py-1.5 font-medium">Meta</TableHead>
              <TableHead className="text-right text-xs py-1.5 font-medium border-r border-border">%</TableHead>
              {/* MTW */}
              <TableHead className="text-right text-xs py-1.5 font-medium">Real</TableHead>
              <TableHead className="text-right text-xs py-1.5 font-medium">Meta</TableHead>
              <TableHead className="text-right text-xs py-1.5 font-medium border-r border-border">%</TableHead>
              {/* MTD */}
              <TableHead className="text-right text-xs py-1.5 font-medium">Real</TableHead>
              <TableHead className="text-right text-xs py-1.5 font-medium">Meta</TableHead>
              <TableHead className="text-right text-xs py-1.5 font-medium border-r border-border">%</TableHead>
              {/* Forecast */}
              <TableHead className="text-right text-xs py-1.5 font-medium">Proj.</TableHead>
              <TableHead className="text-right text-xs py-1.5 font-medium">Meta</TableHead>
              <TableHead className="text-right text-xs py-1.5 font-medium">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.metric_key} className="hover:bg-muted/10">
                <TableCell className="font-medium border-r border-border py-2">{row.display_name}</TableCell>
                {renderPeriodCells(row.d1, true)}
                {renderPeriodCells(row.mtw, true)}
                {renderPeriodCells(row.mtd, true)}
                {renderPeriodCells(row.forecast, false)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
