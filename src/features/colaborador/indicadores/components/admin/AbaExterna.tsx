import { ExternalLink, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Aba cujo conteúdo NÃO é acessível a partir do Hub.
//
// As tabelas `report_recipients`, `report_settings` e `integration_logs` do
// projeto de indicadores exigem uma sessão de administrador daquele projeto
// (RLS com has_role(auth.uid(), 'admin')). O Hub lê aquele banco de forma
// anônima, então essas consultas retornam HTTP 200 com zero linhas — sem erro,
// sem aviso. Portar as telas de verdade produziria tabelas vazias que parecem
// quebradas.
//
// Em vez disso, a aba existe, explica o motivo e leva ao painel onde o dado
// está. Assim ninguém fica procurando o que sumiu.

const PAINEL_ADMIN_URL = 'https://pure-pilates-insights.pages.dev/admin';

interface AbaExternaProps {
  /** O que essa aba mostra no painel de origem. */
  titulo: string;
  /** Descrição curta do conteúdo, para quem não conhece a aba. */
  conteudo: string;
  /** Nome exato da aba no painel de origem — ele não aceita link direto por aba. */
  abaNoPainel: string;
}

export function AbaExterna({ titulo, conteudo, abaNoPainel }: AbaExternaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          {titulo}
        </CardTitle>
        <CardDescription>{conteudo}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Estes dados são protegidos pelo login do próprio Painel de Indicadores e não podem ser
          lidos a partir do Hub. Por isso esta aba não traz a tabela — ela viria vazia, sem indicar
          o motivo.
        </p>
        <div className="space-y-2">
          <Button asChild>
            <a href={PAINEL_ADMIN_URL} target="_blank" rel="noopener noreferrer">
              Abrir no Painel de Indicadores
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            O painel abre na administração; lá dentro, clique na aba <strong>{abaNoPainel}</strong>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
