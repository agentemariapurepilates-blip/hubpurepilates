import { useState } from 'react';
import { format } from 'date-fns';
import MainLayout from '@/components/layout/MainLayout';
import { MetricCard } from './components/MetricCard';
import { MetricsTable } from './components/MetricsTable';
import { Filters } from './components/Filters';
import { useUnits } from './hooks/useUnits';
import { useAggregatedData } from './hooks/useAggregatedData';
import { useDailyGoals } from './hooks/useDailyGoals';
import { useDashboardIndicators, useHighlightIndicators } from './hooks/useIndicatorMapping';
import { useCalculatedMetrics, useHighlightMetrics, useCalculatedHighlightMetrics } from './hooks/useMetrics';
import { useHighlightCalculatedMetrics } from './hooks/useCalculatedMetrics';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function VisaoGeral() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);

  const { isAdmin, profileLoading: adminLoading } = useAuth();
  const { data: units, isLoading: unitsLoading } = useUnits();

  // No Hub não existe recorte por unidade: só administradores e colaboradores
  // da sede acessam estas telas, e todos enxergam todas as unidades.
  const effectiveUnitId = isAdmin ? selectedUnit : null;

  const { data: rawData, isLoading: rawLoading } = useAggregatedData(effectiveUnitId, selectedMonth);
  const { data: goals } = useDailyGoals(effectiveUnitId, selectedMonth);
  const { data: mappings } = useDashboardIndicators();
  const { data: highlightMappings } = useHighlightIndicators();

  const { tableData, pctPresenca, pctConversaoMA, pctConversaoMP } = useCalculatedMetrics(
    rawData,
    goals,
    mappings,
    selectedMonth
  );

  const highlightCards = useHighlightMetrics(
    rawData,
    goals,
    highlightMappings,
    selectedMonth
  );

  // Busca as métricas calculadas marcadas como destaque
  const { data: highlightCalcMetrics } = useHighlightCalculatedMetrics();
  const calculatedHighlightCards = useCalculatedHighlightMetrics(
    rawData,
    highlightCalcMetrics,
    selectedMonth
  );

  // Junta os cards de destaque normais com os calculados
  const allHighlightCards = [...highlightCards, ...calculatedHighlightCards];

  const isLoading = unitsLoading || rawLoading || adminLoading;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Visão Geral
            </h1>
            <p className="text-muted-foreground">Acompanhe os indicadores do Pure Pilates</p>
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
            <p className="text-muted-foreground">Nenhum indicador selecionado para o Dashboard.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Vá em Administração → DE/PARA Campos e ative a coluna "Dashboard" nos indicadores desejados.
            </p>
          </div>
        ) : (
          <>
            {allHighlightCards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {allHighlightCards.map((card, i) => (
                  <MetricCard
                    key={card.key}
                    title={card.label}
                    value={card.formattedValue ?? card.value}
                    target={card.target}
                    percentage={card.percentage}
                    variant={(['primary', 'success', 'info', 'warning'] as const)[i % 4]}
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="metric-card">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">% Presença AE</h4>
                <p className="text-3xl font-bold text-primary">{pctPresenca?.toFixed(1) || 0}%</p>
              </div>
              <div className="metric-card">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">% Conversão M{'<>'}A</h4>
                <p className="text-3xl font-bold text-success">{pctConversaoMA?.toFixed(1) || 0}%</p>
              </div>
              <div className="metric-card">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">% Conversão M{'<>'}P</h4>
                <p className="text-3xl font-bold text-info">{pctConversaoMP?.toFixed(1) || 0}%</p>
              </div>
            </div>

            <MetricsTable data={tableData} />
          </>
        )}
      </div>
    </MainLayout>
  );
}
