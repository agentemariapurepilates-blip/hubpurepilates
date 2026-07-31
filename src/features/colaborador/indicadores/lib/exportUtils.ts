// Exportação de dados já carregados na tela para arquivo local (CSV/Excel).
// É uma operação de leitura: monta um Blob no navegador e dispara o download.
// Nada aqui toca o banco.

export interface ExportRow {
  cluster: string;
  unitId: number;
  unitName: string;
  value: number;
}

/** Dispara o download de um Blob de texto como arquivo. */
function baixarArquivo(conteudo: string, nomeArquivo: string) {
  // O BOM inicial faz o Excel reconhecer o arquivo como UTF-8.
  const blob = new Blob(['\ufeff' + conteudo], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', nomeArquivo);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const CABECALHO_CLUSTERS = ['Cluster', 'ID Unidade', 'Nome Unidade', 'Valor'];

function linhasDeCluster(rows: ExportRow[]): string[] {
  return rows.map((row) =>
    [
      row.cluster,
      row.unitId,
      `"${row.unitName}"`,
      row.value.toFixed(2).replace('.', ','),
    ].join(';')
  );
}

export function exportToCSV(rows: ExportRow[], filename: string = 'clusters') {
  const csvContent = [CABECALHO_CLUSTERS.join(';'), ...linhasDeCluster(rows)].join('\n');
  baixarArquivo(csvContent, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportToExcel(rows: ExportRow[], filename: string = 'clusters') {
  // Mesmo formato CSV com ponto e vírgula, que é o que o Excel em português espera.
  const csvContent = [CABECALHO_CLUSTERS.join(';'), ...linhasDeCluster(rows)].join('\r\n');
  baixarArquivo(csvContent, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
}

// Versões genéricas, para tabelas de colunas dinâmicas.

function formatarCelula(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number') return val.toFixed(2).replace('.', ',');
  return `"${String(val).replace(/"/g, '""')}"`;
}

export function exportGenericToCSV(headers: string[], rows: unknown[][], filename: string) {
  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.map(formatarCelula).join(';')),
  ].join('\n');
  baixarArquivo(csvContent, `${filename}.csv`);
}

export function exportGenericToExcel(headers: string[], rows: unknown[][], filename: string) {
  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.map(formatarCelula).join(';')),
  ].join('\r\n');
  baixarArquivo(csvContent, `${filename}.csv`);
}
