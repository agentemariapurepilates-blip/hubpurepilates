import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIndicatorMappings } from '../../hooks/useIndicatorMapping';
import { useTableColumns } from '../../hooks/useRawData';

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
  const { data: columns } = useTableColumns();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Colunas brutas importadas que ainda não têm mapeamento de indicador.
  const mappedColumns = new Set(mappings?.map(m => m.raw_column_name) || []);
  const unmappedColumns = columns?.filter(col => !mappedColumns.has(col)) || [];

  // Categorias distintas configuradas nos mapeamentos, para o filtro.
  const categories = [...new Set(mappings?.map(m => m.category).filter(Boolean) || [])];

  const filteredMappings = mappings?.filter(m =>
    categoryFilter === 'all' || m.category === categoryFilter
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{mappings?.length || 0} mapeamentos configurados</p>
          {unmappedColumns.length > 0 && (
            <p className="text-sm text-warning">{unmappedColumns.length} colunas sem mapeamento</p>
          )}
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
            {filteredMappings.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs">{m.raw_column_name}</TableCell>
                <TableCell>{m.display_name}</TableCell>
                <TableCell>{m.data_type}</TableCell>
                <TableCell>{m.category || '-'}</TableCell>
                <TableCell className="text-center">
                  {/* Origem usava `m.active ?? true` (nulo contava como ativo); mantido aqui para paridade exata. */}
                  <Sinalizador ativo={m.active ?? true} />
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
            {!filteredMappings.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum mapeamento configurado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {unmappedColumns.length > 0 && (
        <div className="metric-card">
          <h3 className="font-semibold mb-2">Colunas Sem Mapeamento</h3>
          <div className="flex flex-wrap gap-2">
            {unmappedColumns.map(col => (
              <span key={col} className="px-2 py-1 bg-muted rounded text-xs font-mono">{col}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
