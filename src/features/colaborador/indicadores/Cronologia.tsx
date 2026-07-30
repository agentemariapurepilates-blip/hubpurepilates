import { useState } from 'react';
import { format } from 'date-fns';
import MainLayout from '@/components/layout/MainLayout';
import { TimelineFilters } from './components/TimelineFilters';
import { TrendChart } from './components/TrendChart';
import { TimelineTable } from './components/TimelineTable';
import { useUnits } from './hooks/useUnits';
import { useDashboardIndicators } from './hooks/useIndicatorMapping';
import { useTimelineData, Granularity } from './hooks/useTimelineData';
import { useAuth } from '@/contexts/AuthContext';
import { getRecentMonths } from './lib/periods';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2, TrendingDown, TrendingUp } from 'lucide-react';

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export default function Cronologia() {
  // Abre nos últimos 6 meses: o suficiente para enxergar tendência sem
  // disparar doze consultas de cara.
  const recentMonths = getRecentMonths(12);
  const [granularity, setGranularity] = useState<Granularity>('month');
  const [fromMonth, setFromMonth] = useState(
    recentMonths[Math.min(5, recentMonths.length - 1)].value
  );
  const [toMonth, setToMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);

  const { isAdmin, profileLoading: adminLoading } = useAuth();
  const { data: units, isLoading: unitsLoading } = useUnits();

  // No Hub não existe recorte por unidade: só administradores e colaboradores
  // da sede acessam estas telas, e todos enxergam todas as unidades.
  const effectiveUnitId = isAdmin ? selectedUnit : null;

  const { data: mappings, isLoading: mappingsLoading } = useDashboardIndicators();
  const { series, isLoading: timelineLoading, failedMonths } = useTimelineData(
    effectiveUnitId,
    fromMonth,
    toMonth,
    mappings,
    granularity
  );

  const isLoading = adminLoading || unitsLoading || mappingsLoading || timelineLoading;

  const handleRangeChange = (from: string, to: string) => {
    setFromMonth(from);
    setToMonth(to);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Cronologia
            </h1>
            <p className="text-muted-foreground">Evolução dos indicadores ao longo do tempo</p>
          </div>
          <TimelineFilters
            granularity={granularity}
            onGranularityChange={setGranularity}
            fromMonth={fromMonth}
            toMonth={toMonth}
            onRangeChange={handleRangeChange}
            selectedUnit={selectedUnit}
            onUnitChange={setSelectedUnit}
            units={units}
            hideUnitFilter={!isAdmin}
          />
        </div>

        {failedMonths.length > 0 && (
          <div className="metric-card flex items-start gap-3 border-warning/40 bg-warning/5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-medium">Alguns meses não carregaram</p>
              <p className="text-sm text-muted-foreground">
                {failedMonths.join(', ')} — os gráficos abaixo mostram o restante do período.
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : mappings && mappings.length === 0 ? (
          <div className="metric-card py-12 text-center">
            <p className="text-muted-foreground">Nenhum indicador selecionado para o Dashboard.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Vá em Administração → DE/PARA Campos e ative a coluna "Dashboard" nos indicadores
              desejados.
            </p>
          </div>
        ) : series.every((s) => s.points.length === 0) ? (
          <div className="metric-card py-12 text-center">
            <p className="text-muted-foreground">Nenhum dado no período selecionado.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha outro intervalo ou outra unidade.
            </p>
          </div>
        ) : (
          <>
            <TimelineTable series={series} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {series.map((s) => (
                <TrendChart
                  key={s.metric_key}
                  title={s.display_name}
                  data={s.points}
                  maxTicks={granularity === 'month' ? 12 : 10}
                  headerRight={
                    <div className="text-right">
                      <div className="text-xl font-bold tracking-tight">
                        {numberFormatter.format(s.total)}
                      </div>
                      {s.achievement !== null && (
                        <div
                          className={cn(
                            'flex items-center justify-end gap-1 text-xs font-semibold',
                            s.achievement >= 0 ? 'text-success' : 'text-destructive'
                          )}
                        >
                          {s.achievement >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {s.achievement >= 0 ? '+' : ''}
                          {s.achievement.toFixed(1)}% vs meta
                        </div>
                      )}
                    </div>
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
