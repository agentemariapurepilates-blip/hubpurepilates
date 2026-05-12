import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PastPlan } from './types';

interface PastPlansCardProps {
  plans: PastPlan[];
  currentMonth: string;
  currentYear: string;
  onSelect: (month: string, year: string) => void;
}

export function PastPlansCard({ plans, currentMonth, currentYear, onSelect }: PastPlansCardProps) {
  if (plans.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planos Editoriais Salvos</CardTitle>
        <p className="text-sm text-muted-foreground">Clique num plano pra carregar e visualizar.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map((plan) => {
            const isCurrent = plan.month === currentMonth && plan.year === currentYear;
            return (
              <button
                key={`${plan.year}-${plan.month}`}
                type="button"
                onClick={() => onSelect(plan.month, plan.year)}
                className={`text-left rounded-2xl border p-4 transition hover:shadow-md ${
                  isCurrent ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{plan.month} {plan.year}</h3>
                  {isCurrent && (
                    <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Atual</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>{plan.total} postagens</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    {plan.approved} aprovadas
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                    {plan.total - plan.approved} restantes
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
