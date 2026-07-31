import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAllUnits } from '../../hooks/useUnits';

// Aba somente consulta: lista as unidades cadastradas no painel. Sincronizar
// com o Pure Pilates saiu — sincronização de unidades passa a ser feita
// apenas pelo painel publicado.

export function UnidadesTab() {
  const { data: units } = useAllUnits();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{units?.length || 0} unidades cadastradas</p>

      <div className="metric-card p-0 overflow-hidden max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-24">Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units?.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-mono">{u.id}</TableCell>
                <TableCell>{u.name}</TableCell>
                <TableCell className="font-mono text-xs">{u.slug || '-'}</TableCell>
                <TableCell>{u.active ? '✓' : '✗'}</TableCell>
              </TableRow>
            ))}
            {!units?.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhuma unidade cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
