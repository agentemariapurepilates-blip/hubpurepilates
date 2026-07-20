import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { domToBlob } from 'modern-screenshot';
import { ArrowLeft, Mail, Trash2, RotateCcw, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  buildRenderedHTML,
  fieldIsRemovable,
  pureDesignTemplates,
  type PureDesignTemplate,
  type TableRow,
} from '@/data/pureDesignTemplates';
import { getMontserratFontFaceCss } from '@/features/colaborador/academy/montserratEmbed';

const WEBHOOK_URL = import.meta.env.VITE_PURE_DESIGN_WEBHOOK_URL as string | undefined;

function defaultValues(template: PureDesignTemplate): Record<string, string> {
  const values: Record<string, string> = {};
  template.fields.forEach((f) => {
    values[f.id] = f.defaultValue;
  });
  return values;
}

function extractBody(html: string): string {
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return m ? m[1] : html;
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

function collectBackgroundImageUrls(root: HTMLElement): string[] {
  const urls = new Set<string>();
  const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  for (const el of all) {
    const bg = el.style?.backgroundImage;
    if (!bg || bg === 'none') continue;
    const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
    if (m && !m[1].startsWith('data:')) urls.add(m[1]);
  }
  return Array.from(urls);
}

const PureDesignEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const template = pureDesignTemplates.find((t) => t.id === id);

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const [values, setValues] = useState<Record<string, string>>(() =>
    template ? defaultValues(template) : {},
  );
  const [rows, setRows] = useState<TableRow[]>(() =>
    template?.table
      ? Array.from({ length: template.table.initialRows }, () => ({ item: '', preco: '' }))
      : [],
  );
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(0.4);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // @font-face do Montserrat embutido (data-URI). Fontes de <link> cross-origin
  // não são embutidas no SVG do modern-screenshot — sem isso o PNG sai com fonte
  // de fallback. Injetamos esse CSS dentro do nó capturado.
  const [fontFaceCss, setFontFaceCss] = useState('');

  useEffect(() => {
    getMontserratFontFaceCss().then(setFontFaceCss).catch(() => {});
  }, []);

  // Altura efetiva do canvas: templates com tabela crescem com o nº de linhas
  // e encolhem quando o bloco PIX é removido.
  const effHeight = template?.table
    ? template.table.baseHeight +
      rows.length * template.table.rowHeight -
      (removed.has('pix') ? template.table.pixHeight : 0)
    : (template?.height ?? 0);

  useEffect(() => {
    if (!template) return;
    const fit = () => {
      const el = previewWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const padding = 32;
      const scaleW = (rect.width - padding * 2) / template.width;
      const scaleH = (rect.height - padding * 2) / effHeight;
      setZoom(Math.max(0.1, Math.min(scaleW, scaleH, 1)));
    };
    const timer = window.setTimeout(fit, 100);
    window.addEventListener('resize', fit);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', fit);
    };
  }, [template, effHeight]);

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Modelo não encontrado</h1>
          <Button variant="outline" onClick={() => navigate('/pure-design')}>
            Voltar para Pure Design
          </Button>
        </div>
      </div>
    );
  }

  const renderedHTML = buildRenderedHTML(template, values, removed, rows);

  const handleFieldChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const addRow = () => setRows((prev) => [...prev, { item: '', preco: '' }]);
  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));
  const setRowItem = (index: number, item: string) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, item } : r)));
  // Preço é texto livre, mas só números e separador (o "R$" já está no layout).
  const setRowPreco = (index: number, raw: string) => {
    const preco = raw.replace(/[^\d.,]/g, '');
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, preco } : r)));
  };

  const toggleRemoved = (fieldId: string) => {
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  };

  const openEmailDialog = () => {
    setEmailTo((prev) => prev || user?.email || '');
    setEmailDialogOpen(true);
  };

  // Captura o nó escondido e devolve o PNG. Usado tanto pelo download quanto
  // pelo envio por email.
  const captureBlob = async (): Promise<Blob> => {
    const target = captureRef.current;
    if (!target) throw new Error('sem alvo de captura');

    // Garante o @font-face embutido dentro do nó capturado (caso o carregamento
    // assíncrono ainda não tenha populado o state antes do clique).
    if (!fontFaceCss) {
      const css = await getMontserratFontFaceCss().catch(() => '');
      if (css && !target.querySelector('style[data-montserrat]')) {
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-montserrat', '');
        styleEl.textContent = css;
        target.insertBefore(styleEl, target.firstChild);
      }
    }

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const imgs = Array.from(target.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
            }),
      ),
    );

    await Promise.all(collectBackgroundImageUrls(target).map(preloadImage));

    // modern-screenshot usa SVG foreignObject pra delegar o rendering pro browser
    // nativo (em vez de reimplementar como html2canvas faz). Isso garante que o
    // PNG exportado fica pixel-perfect com o preview — sem drift de baseline de
    // texto em pills/badges.
    const blob = await domToBlob(target, {
      type: 'image/png',
      scale: 1,
      backgroundColor: null,
    });
    if (!blob) throw new Error('falha ao gerar PNG');
    return blob;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await captureBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('PNG baixado!');
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível gerar o PNG. Tente novamente.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!WEBHOOK_URL) {
      toast.error('Envio não configurado. Avise o suporte.');
      return;
    }
    const email = emailTo.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Digite um email válido');
      return;
    }

    setSending(true);
    try {
      const blob = await captureBlob();

      const formData = new FormData();
      formData.append('file', blob, `${template.id}.png`);
      formData.append('email', email);
      formData.append('templateName', template.name);

      const response = await fetch(WEBHOOK_URL, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`webhook respondeu ${response.status}`);

      toast.success('Email enviado! Deve chegar em alguns minutos.');
      setEmailDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível enviar. Tente novamente em instantes.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="h-screen flex flex-col bg-background overflow-hidden"
      style={{ fontFamily: 'Montserrat, sans-serif' }}
    >
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate('/pure-design')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm uppercase tracking-wider text-foreground truncate">
            {template.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className="h-3.5 w-3.5" />
            {downloading ? 'Gerando...' : 'Baixar PNG'}
          </Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={openEmailDialog}>
            <Mail className="h-3.5 w-3.5" />
            Receber por email
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <aside className="w-full lg:w-[380px] bg-card border-b lg:border-b-0 lg:border-r border-border overflow-hidden flex-1 lg:flex-none lg:shrink-0 min-h-0 order-2 lg:order-1 flex flex-col">
          <div className="border-b border-border bg-muted/50 shrink-0 px-6 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Editar campos
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {template.table && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Produtos e preços
                  </label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {rows.length} {rows.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <div className="space-y-2">
                  {rows.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Select value={row.item} onValueChange={(v) => setRowItem(i, v)}>
                        <SelectTrigger className="flex-1 min-w-0">
                          <SelectValue placeholder="Selecionar produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {template.table!.catalog.map((produto) => (
                            <SelectItem key={produto} value={produto}>
                              {produto}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1 w-[116px] shrink-0">
                        <span className="text-xs text-muted-foreground">R$</span>
                        <Input
                          value={row.preco}
                          onChange={(e) => setRowPreco(i, e.target.value)}
                          placeholder="000,00"
                          inputMode="decimal"
                          className="px-2"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        title="Excluir linha"
                        aria-label="Excluir linha"
                        className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRow}
                  className="w-full gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar item
                </Button>

                {/* Card PIX — editável e removível */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      PIX
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRemoved('pix')}
                      title={removed.has('pix') ? 'Incluir PIX na arte' : 'Remover PIX da arte'}
                      aria-label={removed.has('pix') ? 'Incluir PIX' : 'Remover PIX'}
                      className={`h-6 w-6 inline-flex items-center justify-center rounded-md transition-colors ${
                        removed.has('pix')
                          ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                      }`}
                    >
                      {removed.has('pix') ? (
                        <RotateCcw className="h-3.5 w-3.5" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  {removed.has('pix') ? (
                    <button
                      type="button"
                      onClick={() => toggleRemoved('pix')}
                      className="w-full flex items-center justify-between gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted/70 transition-colors"
                    >
                      <span>PIX removido da arte</span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <RotateCcw className="h-3 w-3" />
                        Incluir
                      </span>
                    </button>
                  ) : (
                    template.fields.map((field) => (
                      <div key={field.id} className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">
                          {field.label}
                        </label>
                        <Input
                          value={values[field.id] ?? ''}
                          maxLength={field.maxLength}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder="chave PIX (e-mail, telefone, CNPJ...)"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {!template.table && template.fields.map((field) => {
              const currentValue = values[field.id] ?? '';
              const atLimit = field.maxLength !== undefined && currentValue.length >= field.maxLength;
              const removable = fieldIsRemovable(template, field.id);
              const isRemoved = removed.has(field.id);
              return (
                <div key={field.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-muted-foreground">{field.label}</label>
                    <div className="flex items-center gap-2 shrink-0">
                      {field.maxLength !== undefined && !isRemoved && (
                        <span
                          className={`text-xs tabular-nums ${
                            atLimit ? 'text-destructive font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          {currentValue.length}/{field.maxLength}
                        </span>
                      )}
                      {removable && (
                        <button
                          type="button"
                          onClick={() => toggleRemoved(field.id)}
                          title={isRemoved ? 'Restaurar campo' : 'Excluir campo (texto e forma)'}
                          aria-label={isRemoved ? 'Restaurar campo' : 'Excluir campo'}
                          className={`h-6 w-6 inline-flex items-center justify-center rounded-md transition-colors ${
                            isRemoved
                              ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                          }`}
                        >
                          {isRemoved ? (
                            <RotateCcw className="h-3.5 w-3.5" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  {isRemoved ? (
                    <button
                      type="button"
                      onClick={() => toggleRemoved(field.id)}
                      className="w-full flex items-center justify-between gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted/70 transition-colors"
                    >
                      <span>Campo removido da arte</span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <RotateCcw className="h-3 w-3" />
                        Restaurar
                      </span>
                    </button>
                  ) : field.inputType === 'textarea' ? (
                    <Textarea
                      value={currentValue}
                      maxLength={field.maxLength}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="resize-y min-h-[80px]"
                    />
                  ) : field.inputType === 'image' ? (
                    <div className="space-y-2">
                      {currentValue && (
                        <img
                          src={currentValue}
                          alt=""
                          className="w-full h-32 object-cover rounded-md border border-border"
                        />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () =>
                            handleFieldChange(field.id, String(reader.result));
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>
                  ) : (
                    <Input
                      value={currentValue}
                      maxLength={field.maxLength}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 min-h-0 overflow-auto order-1 lg:order-2 bg-muted/50">
          <div
            ref={previewWrapRef}
            className="w-full h-full flex items-center justify-center p-4"
          >
            <div
              className="shadow-2xl rounded-lg overflow-hidden bg-white shrink-0"
              style={{ width: template.width * zoom, height: effHeight * zoom }}
            >
              <iframe
                ref={iframeRef}
                srcDoc={renderedHTML}
                title="Pré-visualização"
                style={{
                  width: template.width,
                  height: effHeight,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  border: 'none',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </main>
      </div>

      <div
        ref={captureRef}
        aria-hidden
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          width: `${template.width}px`,
          height: `${effHeight}px`,
          pointerEvents: 'none',
          overflow: 'hidden',
          fontFamily: 'Montserrat, sans-serif',
        }}
        dangerouslySetInnerHTML={{
          __html: `<style>${fontFaceCss}</style>${extractBody(renderedHTML)}`,
        }}
      />

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receber arte por email</DialogTitle>
            <DialogDescription>
              Informe o email pra onde enviar o PNG. Pode ser qualquer email, não precisa ser o da Pure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="pd-email">Email de destino</Label>
            <Input
              id="pd-email"
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="seu@email.com"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !sending) handleSendEmail();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail} disabled={sending} className="gap-1.5">
              <Mail className="h-4 w-4" />
              {sending ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PureDesignEditor;
