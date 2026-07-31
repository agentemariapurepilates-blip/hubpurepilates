import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useDashboardOrderedIndicators, useDailyOrderedIndicators, OrderableIndicator } from '../../hooks/useIndicatorOrder';

// Somente consulta: mostra em que ordem os indicadores aparecem hoje em cada
// visão. Reordenar continua sendo no painel do Cloudflare.

interface OrderListProps {
  title: string;
  description: string;
  indicators: OrderableIndicator[];
}

function OrderList({ title, description, indicators }: OrderListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {indicators.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Nenhum indicador configurado para esta visão
          </p>
        ) : (
          <div className="space-y-1">
            {indicators.map((ind, idx) => (
              <div
                key={`${ind.type}-${ind.id}`}
                className="flex items-center gap-2 p-2 rounded-lg border bg-card"
              >
                <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                  {idx + 1}
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="truncate">{ind.display_name}</span>
                  <Badge variant={ind.type === 'calculated' ? 'secondary' : 'outline'} className="text-xs shrink-0">
                    {ind.type === 'calculated' ? 'Calc' : 'Map'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function IndicatorOrderTab() {
  const { data: dashboardIndicators, isLoading: dashboardLoading } = useDashboardOrderedIndicators();
  const { data: dailyIndicators, isLoading: dailyLoading } = useDailyOrderedIndicators();

  if (dashboardLoading || dailyLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <OrderList
        title="Ordem no Dashboard"
        description="Indicadores da visão agregada (Visão Geral)"
        indicators={dashboardIndicators ?? []}
      />
      <OrderList
        title="Ordem na Visão Diária"
        description="Indicadores da evolução diária"
        indicators={dailyIndicators ?? []}
      />
    </div>
  );
}
