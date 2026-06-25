import { useLayoutEffect, useRef, useState } from 'react';
import { domToBlob } from 'modern-screenshot';
import { GraduationCap, Upload, Download, FileSpreadsheet, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import CertificadoCanvas from './CertificadoCanvas';
import { parsePlanilha, certFileName, BASE_W, BASE_H, type CertRow } from './certificado';
import { getMontserratFontFaceCss } from './montserratEmbed';

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

const blobToDataURL = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

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

const GerarCertificados = () => {
  const [rows, setRows] = useState<CertRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showGuides, setShowGuides] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const [captureRow, setCaptureRow] = useState<CertRow | null>(null);
  const captureRootRef = useRef<HTMLDivElement>(null);
  const [fontFaceCss, setFontFaceCss] = useState<string | undefined>();

  // Pré-carrega o Montserrat embutido (data-URI) pro export sair na fonte certa.
  useLayoutEffect(() => {
    getMontserratFontFaceCss().then(setFontFaceCss).catch(() => undefined);
  }, []);

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.2);

  useLayoutEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setPreviewScale(Math.max(0.05, el.clientWidth / BASE_W));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [rows.length]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { rows: parsed, missingColumns } = await parsePlanilha(file);
      if (!parsed.length) {
        toast.error('Nenhum formando encontrado na planilha. Confira se há a coluna NOME preenchida.');
        return;
      }
      setRows(parsed);
      setFileName(file.name);
      setMissingColumns(missingColumns);
      setPreviewIndex(0);
      toast.success(`${parsed.length} formando(s) carregado(s).`);
    } catch (err) {
      console.error(err);
      toast.error('Não consegui ler a planilha. Use um arquivo .xlsx ou .csv.');
    }
  };

  const handleGenerate = async () => {
    if (!rows.length) return;
    setGenerating(true);
    setProgress({ done: 0, total: rows.length });
    try {
      // Garante o @font-face embutido presente no nó de captura antes de exportar.
      const css = await getMontserratFontFaceCss();
      if (css !== fontFaceCss) {
        setFontFaceCss(css);
        await nextFrame();
      }
      if (document.fonts?.ready) await document.fonts.ready;
      const zip = new JSZip();
      const used = new Set<string>();

      for (let i = 0; i < rows.length; i++) {
        setCaptureRow(rows[i]);
        await nextFrame();
        await nextFrame();
        if (document.fonts?.ready) await document.fonts.ready;

        const node = captureRootRef.current;
        if (!node) throw new Error('captura indisponível');

        const img = node.querySelector('img');
        if (img && !(img.complete && img.naturalWidth > 0)) {
          await new Promise<void>((res) => {
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
          });
        }

        const blob = await domToBlob(node, { type: 'image/png', scale: 1, backgroundColor: '#ffffff' });
        if (!blob) throw new Error('falha ao gerar PNG');

        // Embute o PNG numa página PDF A4 paisagem (mesma proporção 3508×2480).
        const dataUrl = await blobToDataURL(blob);
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [BASE_W, BASE_H] });
        pdf.addImage(dataUrl, 'PNG', 0, 0, BASE_W, BASE_H, undefined, 'FAST');
        const pdfBlob = pdf.output('blob');

        let name = certFileName(rows[i].nome);
        if (used.has(name)) name = name.replace(/\.pdf$/, ` (${i + 1}).pdf`);
        used.add(name);
        zip.file(name, pdfBlob);
        setProgress({ done: i + 1, total: rows.length });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      downloadBlob(content, 'Certificados Academy.zip');
      toast.success(`${rows.length} certificado(s) gerado(s)! Download iniciado.`);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível gerar os certificados. Tente novamente.');
    } finally {
      setGenerating(false);
      setCaptureRow(null);
    }
  };

  const hasRows = rows.length > 0;
  const current = hasRows ? rows[Math.min(previewIndex, rows.length - 1)] : null;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Yaro', 'Inter', sans-serif" }}>
              Gerar certificados
            </h1>
            <p className="text-sm text-muted-foreground">
              Suba a planilha da turma e baixe todos os certificados da Academy em um ZIP.
            </p>
          </div>
        </div>

        {/* Upload */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Planilha da turma</Label>
              <p className="text-xs text-muted-foreground">
                Arquivo <strong>.xlsx</strong> ou <strong>.csv</strong>, com as colunas: NOME, CPF, CURSO, CARGA HORÁRIA, INÍCIO, CONCLUSÃO.
              </p>
            </div>
            <Button asChild variant="outline" className="gap-2 shrink-0">
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

          {hasRows && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="font-medium">{fileName}</span>
              <span className="text-muted-foreground">— {rows.length} formando(s)</span>
            </div>
          )}

          {missingColumns.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Não encontrei a(s) coluna(s): <strong>{missingColumns.join(', ')}</strong>. Esses campos vão sair em branco no certificado. Confira o cabeçalho da planilha.
              </span>
            </div>
          )}
        </div>

        {/* Preview + geração */}
        {hasRows && current && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={previewIndex <= 0}
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums min-w-[120px] text-center">
                  {Math.min(previewIndex + 1, rows.length)} de {rows.length} — {current.nome}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={previewIndex >= rows.length - 1}
                  onClick={() => setPreviewIndex((i) => Math.min(rows.length - 1, i + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="guides" className="text-xs text-muted-foreground">Mostrar guias</Label>
                <Switch id="guides" checked={showGuides} onCheckedChange={setShowGuides} />
              </div>
            </div>

            {/* Preview escalado */}
            <div ref={previewWrapRef} className="w-full">
              <div className="mx-auto shadow-lg rounded-lg overflow-hidden border border-border" style={{ width: BASE_W * previewScale, height: BASE_H * previewScale }}>
                <CertificadoCanvas row={current} scale={previewScale} showGuides={showGuides} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <p className="text-xs text-muted-foreground">
                Confira o posicionamento acima. Os certificados são gerados em A4 (3508×2480px) e baixados num ZIP.
              </p>
              <Button onClick={handleGenerate} disabled={generating} className="gap-2 shrink-0">
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
        )}

        {!hasRows && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma planilha carregada ainda. Escolha o arquivo da turma para começar.
            </p>
          </div>
        )}
      </div>

      {/* Nó oculto em tamanho nativo, usado só pra captura (modern-screenshot) */}
      <div aria-hidden style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }}>
        {captureRow && (
          <CertificadoCanvas row={captureRow} scale={1} rootRef={captureRootRef} fontFaceCss={fontFaceCss} />
        )}
      </div>
    </MainLayout>
  );
};

export default GerarCertificados;
