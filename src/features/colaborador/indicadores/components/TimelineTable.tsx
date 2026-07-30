import { Fragment, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { TimelinePoint, TimelineSeries } from '../lib/timeline';

interface TimelineTableProps {
  series: TimelineSeries[];
}

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

const formatValue = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : numberFormatter.format(value);

const formatPercent = (value: number | null) =>
  value === null ? '—' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const percentColor = (value: number | null) => {
  if (value === null) return '';
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-destructive';
  return 'text-warning';
};

/**
 * Os mesmos números dos gráficos, em tabela: uma linha por indicador,
 * uma coluna por período.
 *
 * Cada série corta as pontas vazias por conta própria, então indicadores
 * diferentes podem começar e terminar em períodos diferentes. As colunas saem
 * da união ordenada de todos os períodos, para que uma linha nunca fique
 * deslocada em relação às outras.
 */
export function TimelineTable({ series }: TimelineTableProps) {
  const columns = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const s of series) {
      for (const point of s.points) byKey.set(point.key, point.label);
    }
    // As chaves são yyyy-MM ou yyyy-MM-dd, então a ordem alfabética é a ordem
    // cronológica.
    return Array.from(byKey.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, label]) => ({ key, label }));
  }, [series]);

  const pointsByKey = useMemo(
    () =>
      new Map(
        series.map((s) => [s.metric_key, new Map(s.points.map((p) => [p.key, p]))])
      ),
    [series]
  );

  if (columns.length === 0) return null;

  const cellFor = (metricKey: string, columnKey: string): TimelinePoint | undefined =>
    pointsByKey.get(metricKey)?.get(columnKey);

  return (
    <div className="metric-card overflow-hidden p-0">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold">Tabela histórica</h2>
        <p className="text-sm text-muted-foreground">
          Realizado, meta e atingimento de cada período
        </p>
      </div>

      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-20 min-w-[180px] border-r bg-card">
                Indicador
              </TableHead>
              <TableHead className="sticky left-[180px] z-20 min-w-[60px] border-r bg-card text-center">
                Tipo
              </TableHead>
              {columns.map((column) => (
                <TableHead key={column.key} className="min-w-[64px] px-2 text-center">
                  {column.label}
                </TableHead>
              ))}
              <TableHead className="min-w-[90px] border-l bg-muted/50 text-center font-bold">
                Total
              </TableHead>
              <TableHead className="min-w-[90px] bg-muted/50 text-center font-bold">Meta</TableHead>
              <TableHead className="min-w-[80px] bg-muted/50 text-center font-bold">%</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {series.map((s, index) => (
              <Fragment key={s.metric_key}>
                <TableRow className={index > 0 ? 'border-t-2 border-border' : ''}>
                  <TableCell
                    className="sticky left-0 z-10 border-r bg-card font-medium"
                    rowSpan={3}
                  >
                    {s.display_name}
                  </TableCell>
                  <TableCell className="sticky left-[180px] z-10 border-r bg-card text-xs font-semibold text-primary">
                    Real
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={column.key} className="px-2 text-center text-sm font-medium">
                      {formatValue(cellFor(s.metric_key, column.key)?.value)}
                    </TableCell>
                  ))}
                  <TableCell className="border-l bg-muted/50 text-center font-bold">
                    {numberFormatter.format(s.total)}
                  </TableCell>
                  <TableCell
                    className="bg-muted/50 text-center text-muted-foreground"
                    rowSpan={3}
                  >
                    {s.goalTotal > 0 ? numberFormatter.format(s.goalTotal) : '—'}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'bg-muted/50 text-center font-bold',
                      percentColor(s.achievement)
                    )}
                    rowSpan={3}
                  >
                    {formatPercent(s.achievement)}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="sticky left-[180px] z-10 border-r bg-muted/20 text-xs text-muted-foreground">
                    Meta
                  </TableCell>
                  {columns.map((column) => {
                    const point = cellFor(s.metric_key, column.key);
                    return (
                      <TableCell
                        key={column.key}
                        className="bg-muted/20 px-2 text-center text-xs text-muted-foreground"
                      >
                        {/* Período sem realizado não exibe meta: ela também não
                            entra no total, e mostrá-la faria a linha não fechar
                            com a coluna Meta. */}
                        {point?.value === null ? '—' : formatValue(point?.goal)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="border-l bg-muted/30 text-center text-muted-foreground">
                    —
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="sticky left-[180px] z-10 border-r bg-muted/10 text-xs text-muted-foreground">
                    %
                  </TableCell>
                  {columns.map((column) => {
                    const point = cellFor(s.metric_key, column.key);
                    const achieved =
                      point && point.value !== null && point.goal !== null && point.goal > 0
                        ? (point.value / point.goal - 1) * 100
                        : null;
                    return (
                      <TableCell
                        key={column.key}
                        className={cn('bg-muted/10 px-2 text-center text-xs', percentColor(achieved))}
                      >
                        {formatPercent(achieved)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="border-l bg-muted/30 text-center">—</TableCell>
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

