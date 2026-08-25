import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleCheck, CircleSlash } from 'lucide-react';
import type { Diagnostico } from '../lib/analise';

/**
 * As três fontes previstas, lado a lado, no topo do relatório.
 *
 * Fica ANTES dos números de propósito. Quem abre um relatório de mídia começa
 * lendo o total; se a informação de que duas de três fontes não estão ligadas
 * vier depois, ela chega tarde demais para mudar a leitura do total.
 */
export function FontesConsideradas({ fontes }: { fontes: Diagnostico['fontes'] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {fontes.map((fonte) => (
        <Card
          key={fonte.id}
          className={fonte.conectada ? 'border-emerald-500/30' : 'border-dashed border-amber-500/50'}
        >
          <CardContent className="flex gap-3 p-4">
            {fonte.conectada ? (
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <CircleSlash className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{fonte.nome}</span>
                <Badge
                  variant="outline"
                  className={
                    fonte.conectada
                      ? 'border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-400'
                      : 'border-amber-500/30 text-[10px] text-amber-700 dark:text-amber-400'
                  }
                >
                  {fonte.conectada ? 'entra na análise' : 'fora da análise'}
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {fonte.observacao}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
