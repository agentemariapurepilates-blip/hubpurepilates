import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCalculatedMetrics } from '../../hooks/useCalculatedMetrics';

// Aba somente consulta: lista as métricas calculadas cadastradas no painel.
// Criar, editar e excluir métrica saíram — o que fica é conferir a fórmula, o
// formato e em quais telas cada métrica aparece, sem precisar abrir o painel
// publicado.

const formatLabels = {
  number: 'Número',
  currency: 'R$ (Moeda)',
  percent: '% (Percentual)',
};

// Os campos booleanos eram interruptores que gravavam no banco; viraram texto
// para preservar a informação sem a capacidade de alterar.
function Sinalizador({ ativo }: { ativo: boolean }) {
  return <Badge variant={ativo ? 'default' : 'outline'}>{ativo ? 'Sim' : 'Não'}</Badge>;
}

export function CalculatedMetricsTab() {
  const { data: metrics } = useCalculatedMetrics();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{metrics?.length || 0} métricas calculadas</p>

      <div className="metric-card p-0 overflow-hidden max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Fórmula</TableHead>
              <TableHead className="w-24">Formato</TableHead>
              <TableHead className="w-20 text-center">Ativo</TableHead>
              <TableHead className="w-24 text-center">Dashboard</TableHead>
              <TableHead className="w-24 text-center">Destaque</TableHead>
              <TableHead className="w-20 text-center">Diário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics?.map(m => (
              <TableRow key={m.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{m.display_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{m.metric_key}</div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs max-w-[200px] truncate" title={m.formula}>
                  {m.formula}
                </TableCell>
                <TableCell>{formatLabels[m.format_type]}</TableCell>
                <TableCell className="text-center">
                  <Sinalizador ativo={m.active} />
                </TableCell>
                <TableCell className="text-center">
                  <Sinalizador ativo={m.show_in_dashboard} />
                </TableCell>
                <TableCell className="text-center">
                  <Sinalizador ativo={m.show_as_highlight} />
                </TableCell>
                <TableCell className="text-center">
                  <Sinalizador ativo={m.show_in_daily} />
                </TableCell>
              </TableRow>
            ))}
            {!metrics?.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma métrica calculada cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="metric-card">
        <h3 className="font-semibold mb-3">Exemplos de Fórmulas</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-3">
            <code className="px-2 py-1 bg-muted rounded text-xs">qt_vagas_ocupadas / qt_vagas_total * 100</code>
            <span className="text-muted-foreground">% Ocupação</span>
          </div>
          <div className="flex items-start gap-3">
            <code className="px-2 py-1 bg-muted rounded text-xs">fin_receitas / cli_matriculas_total</code>
            <span className="text-muted-foreground">Ticket Médio (R$)</span>
          </div>
          <div className="flex items-start gap-3">
            <code className="px-2 py-1 bg-muted rounded text-xs">cli_matriculas_planos / cli_experimentais * 100</code>
            <span className="text-muted-foreground">% Conversão EXP</span>
          </div>
          <div className="flex items-start gap-3">
            <code className="px-2 py-1 bg-muted rounded text-xs">cli_matriculas_total - cli_perdas_planos_total</code>
            <span className="text-muted-foreground">Saldo Líquido</span>
          </div>
        </div>
      </div>
    </div>
  );
}
