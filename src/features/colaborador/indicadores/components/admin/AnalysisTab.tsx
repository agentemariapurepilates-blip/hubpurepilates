import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Download, FileSpreadsheet, BarChart3, ArrowUpDown, Search } from 'lucide-react';
import { useActiveIndicatorMappings } from '../../hooks/useIndicatorMapping';
import { useActiveCalculatedMetrics } from '../../hooks/useCalculatedMetrics';
import { useAvailableMonths } from '../../hooks/useClusterData';
import { useAnalysisData, AnalysisFilter } from '../../hooks/useAnalysisData';
import { formatMetricValue } from '../../lib/formulaParser';
import { exportGenericToCSV, exportGenericToExcel } from '../../lib/exportUtils';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Esta aba não grava nada: os meses, a agregação e os filtros ficam só na
// memória da tela e servem para recortar, em tempo de leitura, os dados que
// vêm do banco. A personalização da ordem do resumo (que gravava na tabela
// `analysis_summary_order`) foi removida — o resumo usa a ordem padrão em que
// os indicadores chegam do hook de análise.

const OPERATORS = [
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '=', label: '=' },
];

const AGGREGATIONS = [
  { value: 'avg', label: 'Média' },
  { value: 'sum', label: 'Soma' },
  { value: 'max', label: 'Máximo' },
  { value: 'min', label: 'Mínimo' },
  { value: 'last', label: 'Último valor' },
];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

type SortDir = 'asc' | 'desc';

export function AnalysisTab() {
  const { data: mappings } = useActiveIndicatorMappings();
  const { data: calculatedMetrics } = useActiveCalculatedMetrics();
  const { data: availableMonths } = useAvailableMonths();

  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [aggregation, setAggregation] = useState<'avg' | 'sum' | 'max' | 'min' | 'last'>('avg');
  const [filters, setFilters] = useState<AnalysisFilter[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Lista combinada de métricas para o seletor de filtros
  const allMetrics = useMemo(() => {
    const mapped = (mappings || []).map(m => ({
      key: m.raw_column_name,
      name: m.display_name,
      isCalculated: false,
    }));
    const calc = (calculatedMetrics || []).map(cm => ({
      key: cm.metric_key,
      name: cm.display_name,
      isCalculated: true,
    }));
    return [...mapped, ...calc];
  }, [mappings, calculatedMetrics]);

  // Definição de todas as colunas das tabelas
  const allColumns = useMemo(() => {
    const cols: { key: string; name: string; formatType?: string; decimalPlaces?: number }[] = [];
    (mappings || []).forEach(m => cols.push({ key: m.raw_column_name, name: m.display_name }));
    (calculatedMetrics || []).forEach(cm => cols.push({
      key: cm.metric_key,
      name: cm.display_name,
      formatType: cm.format_type,
      decimalPlaces: cm.decimal_places,
    }));
    return cols;
  }, [mappings, calculatedMetrics]);

  const config = useMemo(() => {
    if (selectedMonths.length === 0 || !mappings || !calculatedMetrics) return null;
    return {
      months: selectedMonths,
      aggregation,
      filters,
      indicators: mappings,
      calculatedMetrics,
    };
  }, [selectedMonths, aggregation, filters, mappings, calculatedMetrics]);

  const { data: result, isLoading } = useAnalysisData(showResults ? config : null);

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev =>
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month].sort()
    );
    setShowResults(false);
  };

  const formatMonth = (month: string) => {
    const date = parse(month, 'yyyy-MM', new Date());
    return format(date, 'MMM yy', { locale: ptBR });
  };

  const addFilter = () => {
    if (allMetrics.length === 0) return;
    setFilters(prev => [...prev, {
      id: generateId(),
      metricKey: allMetrics[0].key,
      isCalculated: allMetrics[0].isCalculated,
      operator: '>=',
      value: 0,
    }]);
  };

  const updateFilter = (id: string, field: keyof AnalysisFilter, value: unknown) => {
    setFilters(prev => prev.map(f => {
      if (f.id !== id) return f;
      if (field === 'metricKey') {
        const metric = allMetrics.find(m => m.key === value);
        return { ...f, metricKey: value as string, isCalculated: metric?.isCalculated ?? false };
      }
      return { ...f, [field]: value };
    }));
  };

  const removeFilter = (id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  };

  const handleSearch = () => {
    setShowResults(true);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedUnits = useMemo(() => {
    if (!result?.filteredUnits) return [];
    const units = [...result.filteredUnits];
    units.sort((a, b) => {
      if (sortKey === 'name') {
        return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      const va = a.values[sortKey] ?? -Infinity;
      const vb = b.values[sortKey] ?? -Infinity;
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return units;
  }, [result?.filteredUnits, sortKey, sortDir]);

  const formatVal = (val: number | null, col: { formatType?: string; decimalPlaces?: number }) => {
    if (col.formatType) {
      return formatMetricValue(val, col.formatType as 'number' | 'currency' | 'percent', col.decimalPlaces ?? 2);
    }
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(val);
  };

  const handleExport = (type: 'csv' | 'excel') => {
    if (!sortedUnits.length) return;
    const headers = ['Unidade', ...allColumns.map(c => c.name)];
    const rows = sortedUnits.map(u => [
      u.name,
      ...allColumns.map(c => u.values[c.key] ?? ''),
    ]);
    const filename = `analise_${new Date().toISOString().split('T')[0]}`;
    if (type === 'csv') {
      exportGenericToCSV(headers, rows, filename);
    } else {
      exportGenericToExcel(headers, rows, filename);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise Avançada
          </CardTitle>
          <CardDescription>
            Filtre unidades por qualquer combinação de indicadores e analise todos os dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Período */}
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="flex flex-wrap gap-2">
              {availableMonths?.slice(0, 18).map(month => (
                <Badge
                  key={month}
                  variant={selectedMonths.includes(month) ? 'default' : 'outline'}
                  className="cursor-pointer select-none"
                  onClick={() => toggleMonth(month)}
                >
                  {formatMonth(month)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Agregação */}
          <div className="w-48">
            <Label>Agregação</Label>
            <Select value={aggregation} onValueChange={(v) => { setAggregation(v as typeof aggregation); setShowResults(false); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGGREGATIONS.map(a => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros */}
          <div className="space-y-3">
            <Label>Filtros (encadeados com AND)</Label>
            {filters.map(f => (
              <div key={f.id} className="flex items-center gap-2 flex-wrap">
                <Select value={f.metricKey} onValueChange={(v) => updateFilter(f.id, 'metricKey', v)}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allMetrics.map(m => (
                      <SelectItem key={m.key} value={m.key}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={f.operator} onValueChange={(v) => updateFilter(f.id, 'operator', v)}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map(op => (
                      <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  value={f.value}
                  onChange={(e) => updateFilter(f.id, 'value', parseFloat(e.target.value) || 0)}
                  className="w-[100px]"
                />

                <Button variant="ghost" size="icon" onClick={() => removeFilter(f.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFilter}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Filtro
            </Button>
          </div>

          {/* Botão de buscar */}
          <div className="flex justify-center pt-2">
            <Button size="lg" onClick={handleSearch} disabled={selectedMonths.length === 0 || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {showResults && result && (
        <>
          {/* Contagem */}
          <div className="text-sm text-muted-foreground font-medium">
            Resultado: <span className="text-foreground font-bold">{result.filteredUnits.length}</span> de {result.totalUnits} unidades
          </div>

          {/* Resumo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resumo Estatístico</CardTitle>
              <CardDescription>Média, mínimo, máximo e soma de cada indicador nas unidades filtradas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10">Indicador</TableHead>
                      <TableHead className="text-right">Média</TableHead>
                      <TableHead className="text-right">Mín</TableHead>
                      <TableHead className="text-right">Máx</TableHead>
                      <TableHead className="text-right">Soma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.summary.map(s => (
                      <TableRow key={s.key}>
                        <TableCell className="sticky left-0 bg-background z-10 font-medium">{s.name}</TableCell>
                        <TableCell className="text-right">{formatVal(s.avg, s)}</TableCell>
                        <TableCell className="text-right">{formatVal(s.min, s)}</TableCell>
                        <TableCell className="text-right">{formatVal(s.max, s)}</TableCell>
                        <TableCell className="text-right">{formatVal(s.sum, s)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de detalhes */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Detalhes por Unidade</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                    <Download className="h-4 w-4 mr-1" /> CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="sticky left-0 bg-background z-10 cursor-pointer select-none"
                        onClick={() => handleSort('name')}
                      >
                        <span className="flex items-center gap-1">
                          Unidade
                          {sortKey === 'name' && <ArrowUpDown className="h-3 w-3" />}
                        </span>
                      </TableHead>
                      {allColumns.map(col => (
                        <TableHead
                          key={col.key}
                          className="text-right cursor-pointer select-none whitespace-nowrap"
                          onClick={() => handleSort(col.key)}
                        >
                          <span className="flex items-center justify-end gap-1">
                            {col.name}
                            {sortKey === col.key && <ArrowUpDown className="h-3 w-3" />}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUnits.map(unit => (
                      <TableRow key={unit.id}>
                        <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">
                          {unit.name}
                        </TableCell>
                        {allColumns.map(col => (
                          <TableCell key={col.key} className="text-right whitespace-nowrap">
                            {formatVal(unit.values[col.key] ?? null, col)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {sortedUnits.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={allColumns.length + 1} className="text-center text-muted-foreground py-8">
                          Nenhuma unidade encontrada com os filtros aplicados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
