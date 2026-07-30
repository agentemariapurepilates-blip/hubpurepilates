import { ReactNode } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface TrendChartPoint {
  label: string;
  /** null desenha uma lacuna, e não um zero */
  value: number | null;
  goal?: number | null;
}

interface TrendChartProps {
  data: TrendChartPoint[];
  title: string;
  /** conteúdo alinhado à direita do título, como total e % da meta */
  headerRight?: ReactNode;
  showGoal?: boolean;
  className?: string;
  /** máximo de rótulos no eixo X; o resto é omitido para não embolar */
  maxTicks?: number;
}

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/**
 * Linha do realizado ao longo do tempo, com a meta como referência tracejada.
 * Serve tanto para uma série diária quanto mensal — quem decide é o `label` de
 * cada ponto.
 */
export function TrendChart({
  data,
  title,
  headerRight,
  showGoal = true,
  className,
  maxTicks = 12,
}: TrendChartProps) {
  const tickInterval = data.length > maxTicks ? Math.ceil(data.length / maxTicks) - 1 : 0;
  const hasGoal = showGoal && data.some((point) => point.goal !== null && point.goal !== undefined);

  return (
    <div className={cn('metric-card', className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="font-semibold">{title}</h3>
        {headerRight}
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 12, left: 4, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              interval={tickInterval}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              width={48}
              tickFormatter={(value) => numberFormatter.format(value)}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ fontWeight: 600 }}
              formatter={(value: number) => numberFormatter.format(value)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              name="Realizado"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={data.length <= 31 ? { fill: 'hsl(var(--primary))', r: 3 } : false}
              activeDot={{ r: 5 }}
            />
            {hasGoal && (
              <Line
                type="monotone"
                dataKey="goal"
                name="Meta"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

