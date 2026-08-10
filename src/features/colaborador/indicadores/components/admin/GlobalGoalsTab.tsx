import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGlobalGoals } from '../../hooks/useGlobalGoals';
import { useMesesComMeta } from '../../hooks/useMesesComMeta';
import { useIndicatorMappings } from '../../hooks/useIndicatorMapping';
import { Loader2, Target } from 'lucide-react';

// Somente consulta: mostra as metas globais já cadastradas no mês escolhido.
// A edição continua no painel do Cloudflare.

export function GlobalGoalsTab() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const hoje = new Date();
    const year = hoje.getFullYear();
    const month = (hoje.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  });

  const { data: existingGoals, isLoading: isLoadingGoals } = useGlobalGoals(selectedMonth);
  const { data: mesesDisponiveis } = useMesesComMeta();
  const { data: indicators } = useIndicatorMappings();

  // Indicadores que costumam ter meta cadastrada.
  const goalIndicators = useMemo(() => {
    if (!indicators) return [];
    const goalMetrics = ['experimentais', 'experimentais_presenca', 'matriculas_total', 'matriculas_purepass'];
    return indicators
      .filter(i => i.active && goalMetrics.includes(i.metric_key))
      .sort((a, b) => (a.dashboard_order ?? 0) - (b.dashboard_order ?? 0));
  }, [indicators]);

  // Quantidade de dias do mês escolhido.
  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonth]);

  // Metas vindas do banco, indexadas por "dia-metrica" para leitura na tabela.
  const goalsByDay = useMemo(() => {
    const mapa: Record<string, number> = {};
    existingGoals?.forEach(goal => {
      const day = parseInt(goal.date.split('-')[2]);
      mapa[`${day}-${goal.metric_key}`] = goal.daily_target;
    });
    return mapa;
  }, [existingGoals]);

  // Meses para consulta: os que TÊM meta cadastrada, mais o corrente e o
  // seguinte (ver useMesesComMeta).
  //
  // A versão anterior gerava "o mês atual e os 11 seguintes" num laço. Como as
  // metas são cadastradas mês a mês, isso listava 11 meses vazios e escondia
  // todos os passados — em agosto/2026 havia meta em 7 meses anteriores e
  // nenhum aparecia, então não havia como conferir a meta de junho.
  const monthOptions = useMemo(() => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    // Enquanto a consulta não volta, o mês corrente sozinho — assim o seletor
    // nunca aparece vazio nem perde o valor já selecionado.
    const lista = mesesDisponiveis?.length ? mesesDisponiveis : [selectedMonth];

    return lista.map((value) => {
      const [year, month] = value.split('-').map(Number);
      return { value, label: `${months[month - 1]} ${year}` };
    });
  }, [mesesDisponiveis, selectedMonth]);

  const getValue = (day: number, metricKey: string): number | undefined => {
    return goalsByDay[`${day}-${metricKey}`];
  };

  const getColumnTotal = (metricKey: string): number => {
    let total = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      total += getValue(day, metricKey) ?? 0;
    }
    return total;
  };

  const temMetasCadastradas = (existingGoals?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Globais Diárias
          </CardTitle>
          <CardDescription>
            Metas diárias cadastradas para cada indicador. Essas metas são globais e refletem em D-1, MTW e MTD.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoadingGoals ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : goalIndicators.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum indicador configurado para metas.
            </div>
          ) : !temMetasCadastradas ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma meta cadastrada para este mês.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-16 text-center">Dia</TableHead>
                      {goalIndicators.map(indicator => (
                        <TableHead key={indicator.metric_key} className="text-center min-w-[120px]">
                          {indicator.display_name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                      <TableRow key={day}>
                        <TableCell className="text-center font-medium">
                          {day.toString().padStart(2, '0')}
                        </TableCell>
                        {goalIndicators.map(indicator => {
                          const valor = getValue(day, indicator.metric_key);
                          return (
                            <TableCell key={`${day}-${indicator.metric_key}`} className="text-center tabular-nums">
                              {valor === undefined ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                valor.toLocaleString('pt-BR')
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="sticky bottom-0 bg-muted">
                    <TableRow>
                      <TableCell className="text-center font-bold">TOTAL</TableCell>
                      {goalIndicators.map(indicator => (
                        <TableCell key={`total-${indicator.metric_key}`} className="text-center font-bold">
                          {getColumnTotal(indicator.metric_key).toLocaleString('pt-BR')}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
