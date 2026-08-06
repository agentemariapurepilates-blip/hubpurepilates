import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Download, FileSpreadsheet, Layers } from 'lucide-react';
import { useIndicatorMappings } from '../../hooks/useIndicatorMapping';
import { useClusterData, useAvailableMonths, ClusterRange, ClusterConfig } from '../../hooks/useClusterData';
import { exportToCSV, exportToExcel, ExportRow } from '../../lib/exportUtils';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Esta aba não grava nada: as faixas ficam só na memória da tela e servem para
// agrupar, em tempo de leitura, os dados que vêm do banco.

const COLORS: { value: ClusterRange['color']; label: string; className: string }[] = [
  { value: 'red', label: 'Vermelho', className: 'bg-red-500' },
  { value: 'yellow', label: 'Amarelo', className: 'bg-yellow-500' },
  { value: 'green', label: 'Verde', className: 'bg-green-500' },
  { value: 'blue', label: 'Azul', className: 'bg-blue-500' },
  { value: 'purple', label: 'Roxo', className: 'bg-purple-500' },
  { value: 'orange', label: 'Laranja', className: 'bg-orange-500' },
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

export function ClusterGeneratorTab() {
  const { data: mappings } = useIndicatorMappings();
  const { data: availableMonths } = useAvailableMonths();

  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [aggregation, setAggregation] = useState<ClusterConfig['aggregation']>('avg');
  const [ranges, setRanges] = useState<ClusterRange[]>([
    { id: generateId(), name: 'Ruim', min: 0, max: 19, color: 'red' },
    { id: generateId(), name: 'Regular', min: 20, max: 29, color: 'yellow' },
    { id: generateId(), name: 'Bom', min: 30, max: null, color: 'green' },
  ]);
  const [showResults, setShowResults] = useState(false);

  const config: ClusterConfig | null = useMemo(() => {
    if (!selectedMetric || selectedMonths.length === 0 || ranges.length === 0) return null;
    return {
      metricKey: selectedMetric,
      months: selectedMonths,
      aggregation,
      ranges
    };
  }, [selectedMetric, selectedMonths, aggregation, ranges]);

  const { data: results, isLoading, refetch } = useClusterData(showResults ? config : null);

  // Só indicadores ativos e numéricos podem ser agrupados em faixas.
  const availableIndicators = useMemo(() => {
    return mappings?.filter(m => m.active && m.data_type === 'numeric') || [];
  }, [mappings]);

  const handleAddRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const newMin = lastRange ? (lastRange.max ?? lastRange.min) + 1 : 0;
    const unusedColors = COLORS.filter(c => !ranges.some(r => r.color === c.value));
    const newColor = unusedColors[0]?.value || 'blue';

    setRanges([...ranges, {
      id: generateId(),
      name: `Faixa ${ranges.length + 1}`,
      min: newMin,
      max: null,
      color: newColor
    }]);
  };

  const handleRemoveRange = (id: string) => {
    if (ranges.length <= 2) return;
    setRanges(ranges.filter(r => r.id !== id));
  };

  const handleRangeChange = (id: string, field: keyof ClusterRange, value: string | number | null) => {
    setRanges(ranges.map(r => {
      if (r.id !== id) return r;
      return { ...r, [field]: value };
    }));
  };

  const handleGenerate = () => {
    setShowResults(true);
    refetch();
  };

  const handleExport = (type: 'csv' | 'excel') => {
    if (!results) return;

    const rows: ExportRow[] = [];
    results.forEach(cluster => {
      cluster.units.forEach(unit => {
        rows.push({
          cluster: cluster.clusterName,
          unitId: unit.id,
          unitName: unit.name,
          value: unit.value
        });
      });
    });

    // O seletor guarda o raw_column_name (ver o SelectItem abaixo), entao a busca
    // tem que ser por essa coluna. Comparando com metric_key nunca casava, e o
    // arquivo exportado saia com nome tecnico ('cli_experimentais') em vez do
    // nome do indicador.
    const metricName = availableIndicators.find(m => m.raw_column_name === selectedMetric)?.display_name || selectedMetric;
    const filename = `clusters_${metricName.replace(/\s+/g, '_')}`;

    if (type === 'csv') {
      exportToCSV(rows, filename);
    } else {
      exportToExcel(rows, filename);
    }
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev =>
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month].sort()
    );
    setShowResults(false);
  };

  const formatMonth = (month: string) => {
    const date = parse(month, 'yyyy-MM', new Date());
    return format(date, 'MMM yyyy', { locale: ptBR });
  };

  const getColorClass = (color: ClusterRange['color']) => {
    const colorMap: Record<ClusterRange['color'], string> = {
      red: 'bg-red-100 border-red-500 text-red-800',
      yellow: 'bg-yellow-100 border-yellow-500 text-yellow-800',
      green: 'bg-green-100 border-green-500 text-green-800',
      blue: 'bg-blue-100 border-blue-500 text-blue-800',
      purple: 'bg-purple-100 border-purple-500 text-purple-800',
      orange: 'bg-orange-100 border-orange-500 text-orange-800',
    };
    return colorMap[color];
  };

  const getHeaderColorClass = (color: ClusterRange['color']) => {
    const colorMap: Record<ClusterRange['color'], string> = {
      red: 'bg-red-500 text-white',
      yellow: 'bg-yellow-500 text-black',
      green: 'bg-green-500 text-white',
      blue: 'bg-blue-500 text-white',
      purple: 'bg-purple-500 text-white',
      orange: 'bg-orange-500 text-white',
    };
    return colorMap[color];
  };

  return (
    <div className="space-y-6">
      {/* Configuração do agrupamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Configuração do Cluster
          </CardTitle>
          <CardDescription>
            Selecione o indicador, período e defina as faixas para agrupar as unidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Escolha do indicador */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Indicador</Label>
              <Select value={selectedMetric} onValueChange={(v) => { setSelectedMetric(v); setShowResults(false); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um indicador" />
                </SelectTrigger>
                <SelectContent>
                  {availableIndicators.map(m => (
                    <SelectItem key={m.metric_key} value={m.raw_column_name}>
                      {m.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Agregação</Label>
              <Select value={aggregation} onValueChange={(v) => { setAggregation(v as ClusterConfig['aggregation']); setShowResults(false); }}>
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
          </div>

          {/* Escolha do período */}
          <div className="space-y-2">
            <Label>Período (selecione um ou mais meses)</Label>
            <div className="flex flex-wrap gap-2">
              {availableMonths?.slice(0, 12).map(month => (
                <Badge
                  key={month}
                  variant={selectedMonths.includes(month) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleMonth(month)}
                >
                  {formatMonth(month)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Definição das faixas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Definir Faixas</Label>
              <Button variant="outline" size="sm" onClick={handleAddRange}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Faixa
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Nome</TableHead>
                    <TableHead className="w-[100px]">Mínimo</TableHead>
                    <TableHead className="w-[100px]">Máximo</TableHead>
                    <TableHead className="w-[140px]">Cor</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranges.map((range) => (
                    <TableRow key={range.id}>
                      <TableCell>
                        <Input
                          value={range.name}
                          onChange={(e) => handleRangeChange(range.id, 'name', e.target.value)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={range.min}
                          onChange={(e) => handleRangeChange(range.id, 'min', parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={range.max ?? ''}
                          placeholder="∞"
                          onChange={(e) => handleRangeChange(range.id, 'max', e.target.value ? parseFloat(e.target.value) : null)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={range.color}
                          onValueChange={(v) => handleRangeChange(range.id, 'color', v as ClusterRange['color'])}
                        >
                          <SelectTrigger className="h-8">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${COLORS.find(c => c.value === range.color)?.className}`} />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {COLORS.map(c => (
                              <SelectItem key={c.value} value={c.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${c.className}`} />
                                  {c.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveRange(range.id)}
                          disabled={ranges.length <= 2}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Botão de gerar (só recalcula em memória, não grava) */}
          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!selectedMetric || selectedMonths.length === 0 || ranges.length < 2 || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Layers className="h-4 w-4 mr-2" />
              )}
              Gerar Clusters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {showResults && results && results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>
                  {results.reduce((acc, c) => acc + c.units.length, 0)} unidades classificadas em {results.length} clusters
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map(cluster => (
                <div
                  key={cluster.clusterId}
                  className={`border-2 rounded-lg overflow-hidden ${getColorClass(cluster.color)}`}
                >
                  <div className={`px-4 py-2 font-semibold ${getHeaderColorClass(cluster.color)}`}>
                    {cluster.clusterName} ({cluster.units.length} unidades)
                  </div>
                  <div className="max-h-[300px] overflow-y-auto bg-white/50">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">ID</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead className="w-[80px] text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cluster.units.map(unit => (
                          <TableRow key={unit.id}>
                            <TableCell className="font-mono text-xs">{unit.id}</TableCell>
                            <TableCell className="text-sm">{unit.name}</TableCell>
                            <TableCell className="text-right font-medium">{unit.value.toFixed(1)}</TableCell>
                          </TableRow>
                        ))}
                        {cluster.units.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                              Nenhuma unidade nesta faixa
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
