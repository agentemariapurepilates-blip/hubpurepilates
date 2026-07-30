import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  target?: number | null;
  percentage?: number | null;
  format?: 'number' | 'currency' | 'percent';
  variant?: 'primary' | 'success' | 'warning' | 'info';
  className?: string;
}

export function MetricCard({
  title,
  value,
  target,
  percentage,
  format = 'number',
  variant = 'primary',
  className,
}: MetricCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('pt-BR').format(val);
    }
  };

  const isPositive = percentage !== null && percentage !== undefined && percentage > 0;
  const isNegative = percentage !== null && percentage !== undefined && percentage < 0;
  const isExact = percentage !== null && percentage !== undefined && percentage === 0;

  const gradientClasses = {
    primary: 'from-primary/10 to-primary/5 border-primary/20',
    success: 'from-success/10 to-success/5 border-success/20',
    warning: 'from-warning/10 to-warning/5 border-warning/20',
    info: 'from-info/10 to-info/5 border-info/20',
  };

  const iconClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    info: 'text-info',
  };

  return (
    <div
      className={cn(
        'metric-card bg-gradient-to-br border',
        gradientClasses[variant],
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {percentage !== null && percentage !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
              isPositive && 'bg-success/10 text-success',
              isNegative && 'bg-destructive/10 text-destructive',
              isExact && 'bg-warning/10 text-warning'
            )}
          >
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {isExact && <Minus className="h-3 w-3" />}
            {percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className={cn('text-3xl font-bold tracking-tight', iconClasses[variant])}>
          {formatValue(value)}
        </div>

        {target !== null && target !== undefined && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>Meta: {formatValue(target)}</span>
          </div>
        )}

        {percentage !== null && percentage !== undefined && target && (
          <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'absolute left-0 top-0 h-full rounded-full transition-all duration-500',
                isPositive ? 'bg-success' : isNegative ? 'bg-destructive' : 'bg-warning'
              )}
              style={{ width: `${Math.min(Math.max(50 + (percentage / 2), 0), 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
