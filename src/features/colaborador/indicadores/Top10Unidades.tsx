import { useState } from 'react';
import { format } from 'date-fns';
import MainLayout from '@/components/layout/MainLayout';
import { RankingTable } from './components/RankingTable';
import { Filters } from './components/Filters';
import { useUnits } from './hooks/useUnits';
import { useRawData } from './hooks/useRawData';
import { useActiveIndicatorMappings } from './hooks/useIndicatorMapping';
import { useUnitRankings, usePercentageRankings } from './hooks/useMetrics';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Lock } from 'lucide-react';

export default function Top10Unidades() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const { isAdmin, profileLoading: adminLoading } = useAuth();
  const { data: units, isLoading: unitsLoading } = useUnits();
  const { data: rawData, isLoading: rawLoading } = useRawData(null, selectedMonth);
  const { data: mappings } = useActiveIndicatorMappings();

  const experimentaisRanking = useUnitRankings(rawData, units, 'experimentais', mappings);
  const presencaRanking = useUnitRankings(rawData, units, 'experimentais_presenca', mappings);
  const matriculasRanking = useUnitRankings(rawData, units, 'matriculas_total', mappings);

  // Rankings baseados em percentual
  const pctPresencaRanking = usePercentageRankings(rawData, units, 'cli_experimentais_presenca', 'cli_experimentais', 'Presença');
  const pctOcupacaoRanking = usePercentageRankings(rawData, units, 'qt_vagas_ocupadas', 'qt_vagas_total', 'Ocupação');
  const pctConversaoMARanking = usePercentageRankings(rawData, units, 'cli_matriculas_total', 'cli_experimentais', 'Conv. M<>A');

  const isLoading = unitsLoading || rawLoading || adminLoading;

  // Se não for admin, mostra mensagem de acesso restrito
  if (!adminLoading && !isAdmin) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold tracking-tight mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            O ranking de unidades está disponível apenas para administradores.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Top 10 Unidades</h1>
            <p className="text-muted-foreground">Ranking por indicador</p>
          </div>
          <Filters
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            selectedUnit={null}
            onUnitChange={() => {}}
            units={[]}
            hideUnitFilter
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RankingTable data={experimentaisRanking} title="Aulas Experimentais" />
              <RankingTable data={presencaRanking} title="Presença AE" />
              <RankingTable data={matriculasRanking} title="Matrículas" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RankingTable data={pctPresencaRanking} title="% Presença" isPercentage />
              <RankingTable data={pctOcupacaoRanking} title="% Ocupação Agenda" isPercentage />
              <RankingTable data={pctConversaoMARanking} title="% Conversão M<>A" isPercentage />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
