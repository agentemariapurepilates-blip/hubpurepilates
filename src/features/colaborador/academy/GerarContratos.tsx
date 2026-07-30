import { useState } from 'react';
import { FileSignature, Upload, Download, FileSpreadsheet, Loader2, AlertTriangle, Eye } from 'lucide-react';
import JSZip from 'jszip';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  parsePlanilha,
  baixarPlanilhaModelo,
  contratoFileName,
  type ContratoTipo,
  type ContratoRow,
} from './contrato';
import { buildContratoGravacaoDoc, docToPdfBlob } from './contratoPdf';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const TIPOS: { id: ContratoTipo; nome: string; disponivel: boolean }[] = [
  { id: 'gravacao', nome: 'Gravação de Conteúdo', disponivel: true },
  { id: 'wellhub', nome: 'Prestação de Serviços — Wellhub', disponivel: false },
];

// Monta o doc PDF (jsPDF) do contrato conforme o tipo.
function buildDoc(tipo: ContratoTipo, row: ContratoRow) {
  if (tipo === 'gravacao') return buildContratoGravacaoDoc(row);
  throw new Error('Modelo Wellhub ainda não disponível.');
}

const GerarContratos = () => {
  const [tipo, setTipo] = useState<ContratoTipo>('gravacao');
  const [rows, setRows] = useState<ContratoRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const tipoInfo = TIPOS.find((t) => t.id === tipo)!;

  const resetPlanilha = () => {
    setRows([]);
    setFileName('');
    setMissingColumns([]);
    setPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { rows: parsed, missingColumns } = await parsePlanilha(file, tipo);
      if (!parsed.length) {
        toast.error('Nenhum contrato encontrado na planilha. Confira se a coluna NOME COMPLETO está preenchida.');
        return;
      }
      setRows(parsed);
      setFileName(file.name);
      setMissingColumns(missingColumns);
      toast.success(`${parsed.length} contrato(s) carregado(s).`);
    } catch (err) {
      console.error(err);
      toast.error('Não consegui ler a planilha. Use um arquivo .xlsx ou .csv.');
    }
  };

  const handlePreview = async () => {
    if (!rows.length) return;
    setPreviewing(true);
    try {
      const blob = await docToPdfBlob(buildDoc(tipo, rows[0]));
      const url = URL.createObjectURL(blob);
      setPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return url; });
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível gerar a prévia.');
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!rows.length) return;
    setGenerating(true);
    setProgress({ done: 0, total: rows.length });
    try {
      const zip = new JSZip();
      const used = new Set<string>();

      for (let i = 0; i < rows.length; i++) {
        const blob = await docToPdfBlob(buildDoc(tipo, rows[i]));
        let name = contratoFileName(rows[i].nome, tipo);
        if (used.has(name)) name = name.replace(/\.pdf$/, ` (${i + 1}).pdf`);
        used.add(name);
        zip.file(name, blob);
        setProgress({ done: i + 1, total: rows.length });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      downloadBlob(content, `Contratos ${tipoInfo.nome}.zip`);
      toast.success(`${rows.length} contrato(s) gerado(s)! Download iniciado.`);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível gerar os contratos. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const hasRows = rows.length > 0;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <FileSignature className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Automação de contratos</h1>
            <p className="text-sm text-muted-foreground">
              Escolha o tipo, baixe a planilha modelo, preencha e suba de volta. O Hub gera 1 PDF por contrato (pronto pro Clicksign) num ZIP.
            </p>
          </div>
        </div>

        {/* Tipo de contrato */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <Label className="text-sm font-medium">Tipo de contrato</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={!t.disponivel}
                onClick={() => { setTipo(t.id); resetPlanilha(); }}
                className={cn(
                  'text-left rounded-lg border p-3 transition-colors',
                  tipo === t.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                  !t.disponivel && 'opacity-50 cursor-not-allowed',
                )}
              >
                <div className="text-sm font-semibold text-foreground">{t.nome}</div>
                <div className="text-xs text-muted-foreground">
                  {t.disponivel ? 'Disponível' : 'Modelo em breve'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Upload */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Planilha dos contratos</Label>
              <p className="text-xs text-muted-foreground">
                Baixe o modelo, preencha 1 linha por contrato e suba o arquivo <strong>.xlsx</strong>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                variant="outline"
                className="gap-2"
                onClick={async () => {
                  try {
                    await baixarPlanilhaModelo(tipo);
                  } catch (err) {
                    console.error(err);
                    toast.error('Não foi possível gerar a planilha modelo.');
                  }
                }}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Baixar planilha modelo
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  {hasRows ? 'Trocar planilha' : 'Escolher planilha'}
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </label>
              </Button>
            </div>
          </div>

          {hasRows && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="font-medium">{fileName}</span>
              <span className="text-muted-foreground">— {rows.length} contrato(s)</span>
            </div>
          )}

          {missingColumns.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Não encontrei a(s) coluna(s): <strong>{missingColumns.join(', ')}</strong>. Esses campos vão sair em branco. Confira o cabeçalho da planilha (use o modelo).
              </span>
            </div>
          )}
        </div>

        {/* Geração */}
        {hasRows ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Confira a prévia do 1º contrato antes de gerar todos. Cada contrato sai em PDF (texto selecionável).
              </p>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button variant="outline" className="gap-2" onClick={handlePreview} disabled={generating || previewing}>
                  {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  Pré-visualizar 1º
                </Button>
                <Button onClick={handleGenerate} disabled={generating} className="gap-2">
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando {progress.done}/{progress.total}...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Baixar todos (ZIP)
                    </>
                  )}
                </Button>
              </div>
            </div>

            {previewUrl && (
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="text-xs text-muted-foreground px-1 pb-2">Prévia do 1º contrato (texto selecionável):</div>
                <iframe
                  src={previewUrl}
                  title="Prévia do contrato"
                  className="w-full h-[70vh] rounded-lg border border-border bg-white"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma planilha carregada. Baixe o modelo, preencha e suba para começar.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default GerarContratos;
