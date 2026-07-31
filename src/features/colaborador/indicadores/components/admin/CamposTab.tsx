import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useIndicatorMappings } from '../../hooks/useIndicatorMapping';

// Aba somente consulta: lista o mapeamento entre as colunas brutas importadas
// e os indicadores exibidos no painel. Criar, editar e excluir campo saíram —
// o que fica é conferir como cada coluna foi mapeada e onde ela aparece, sem
// precisar abrir o painel publicado.

// Os campos booleanos eram interruptores (Ativo/Dashboard/Destaque/Diário)
// que gravavam no banco ao alternar; viraram texto para preservar a
// informação sem a capacidade de alterar.
function Sinalizador({ ativo }: { ativo: boolean }) {
  return <Badge variant={ativo ? 'default' : 'outline'}>{ativo ? 'Sim' : 'Não'}</Badge>;
}

export function CamposTab() {
  const { data: mappings } = useIndicatorMappings();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{mappings?.length || 0} mapeamentos configurados</p>

      <div className="metric-card p-0 overflow-hidden max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coluna</TableHead>
              <TableHead>Nome Exibição</TableHead>
              <TableHead className="w-24">Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="w-20 text-center">Ativo</TableHead>
              <TableHead className="w-24 text-center">Dashboard</TableHead>
              <TableHead className="w-24 text-center">Destaque</TableHead>
              <TableHead className="w-20 text-center">Diário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings?.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs">{m.raw_column_name}</TableCell>
                <TableCell>{m.display_name}</TableCell>
                <TableCell>{m.data_type}</TableCell>
                <TableCell>{m.category || '-'}</TableCell>
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
            {!mappings?.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum mapeamento configurado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
