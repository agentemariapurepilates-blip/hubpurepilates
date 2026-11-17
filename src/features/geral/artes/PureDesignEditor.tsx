import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { domToBlob } from 'modern-screenshot';
import { ArrowLeft, Mail, Trash2, RotateCcw, Plus, Copy, Download } from 'lucide-react';
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
  computeRepeatHeights,
  fieldIsRemovable,
  pureDesignTemplates,
  cantoDoLogo,
  posicaoDoLogo,
  recorteDaFoto,
  type CantoLogo,
  type LogoCaixa,
  type PureDesignTemplate,
  type RepeatItem,
  type TableRow,
} from '@/data/pureDesignTemplates';
import { getMontserratFontFaceCss } from '@/features/colaborador/academy/montserratEmbed';
import { listarAssets, type MarcaAsset } from '@/features/colaborador/assets-marca/marcaAssets';
import { fotosObrigatoriasFaltando } from './exportarPng';

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
  const { user, isColaborador, isAdmin } = useAuth();
  const doTime = isColaborador || isAdmin;
  const template = pureDesignTemplates.find((t) => t.id === id);
  // Logos da biblioteca de marca: só o time lista (o banco não deixa franqueado ler).
  const [logosDaMarca, setLogosDaMarca] = useState<MarcaAsset[]>([]);
  useEffect(() => {
    if (!doTime || !template?.fields.some((f) => f.inputType === 'logo')) return;
    listarAssets()
      .then((l) => setLogosDaMarca(l.filter((a) => a.ativo && a.tipo === 'logo')))
      .catch(() => {});
  }, [doTime, template]);

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  // Quem chega pelo assistente do Pure Design traz os campos já preenchidos.
  const location = useLocation();
  const preenchidos = (location.state as { valores?: Record<string, string> } | null)?.valores;
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!template) return {};
    const base = defaultValues(template);
    if (preenchidos) {
      for (const f of template.fields) {
        if (typeof preenchidos[f.id] === 'string' && preenchidos[f.id]) base[f.id] = preenchidos[f.id];
      }
    }
    return base;
  });
  const [rows, setRows] = useState<TableRow[]>(() =>
    template?.table
      ? Array.from({ length: template.table.initialRows }, () => ({ item: '', preco: '' }))
      : [],
  );
  // Sempre o valor mais recente, para os gestos na prévia (arrastar/zoom) não lerem um estado velho.
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const [repeatItems, setRepeatItems] = useState<RepeatItem[]>(() => {
    if (!template?.repeat) return [];
    // Itens vindos do assistente (ex.: as datas do feriado), se ele preencheu.
    const doAssistente = (location.state as { itens?: RepeatItem[] } | null)?.itens;
    const variantes = new Set(template.repeat.variants.map((v) => v.id));
    const validos = (doAssistente ?? []).filter((it) => it?.text && variantes.has(it.variant));
    return (validos.length ? validos : template.repeat.initial).map((it) => ({ ...it }));
  });
  // Campos que chegam excluídos do assistente (ex.: fotos da galeria que não serão usadas).
  const [removed, setRemoved] = useState<Set<string>>(() => {
    const vindos = (location.state as { removidos?: string[] } | null)?.removidos;
    return new Set((vindos ?? []).filter((id) => template?.fields.some((f) => f.id === id)));
  });
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
    : template?.repeat
      ? computeRepeatHeights(template.repeat, repeatItems.length).canvasHeight
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

  const renderedHTML = buildRenderedHTML(template, values, removed, rows, repeatItems);

  const handleFieldChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  /** Grava o enquadramento de uma foto (zoom e foco em %). */
  const ajustarFoto = (campo: string, r: { zoom: number; x: number; y: number }) => {
    setValues((prev) => ({
      ...prev,
      [`${campo}__zoom`]: r.zoom.toFixed(3),
      [`${campo}__fx`]: r.x.toFixed(2),
      [`${campo}__fy`]: r.y.toFixed(2),
    }));
  };

  /**
   * Gestos na prévia, como no Canva: arrastar a foto reposiciona; rodinha do
   * mouse ou pinça no trackpad dá zoom. Durante o gesto, mexe só no <img> da
   * prévia (fluido); ao soltar, grava no estado, e a arte e o PNG seguem.
   */
  const ligarGestosNaPrevia = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const estilo = doc.createElement('style');
    estilo.textContent =
      '[data-foto]{cursor:grab;touch-action:none}[data-foto]:hover{outline:4px dashed rgba(193,32,48,.55);outline-offset:-4px}[data-foto].arrastando{cursor:grabbing}';
    doc.head.appendChild(estilo);

    estilo.textContent +=
      '[data-logo]{cursor:move;touch-action:none}[data-logo]:hover{outline:3px dashed rgba(193,32,48,.6);outline-offset:4px}';
    doc.querySelectorAll<HTMLImageElement>('img[data-logo]').forEach((logo) => {
      const campo = logo.dataset.logo!;
      const caixa = template.fields.find((f) => f.id === campo)?.logoCaixa;
      if (!caixa) return;
      let p = posicaoDoLogo(campo, caixa, valuesRef.current);
      let inicio: { px: number; py: number; x: number; y: number } | null = null;
      const aplicar = () => {
        logo.style.left = `${p.x}px`;
        logo.style.top = `${p.y}px`;
        logo.style.width = `${caixa.largura * p.escala}px`;
      };
      const gravar = () =>
        setValues((prev) => ({
          ...prev,
          [`${campo}__x`]: String(Math.round(p.x)),
          [`${campo}__y`]: String(Math.round(p.y)),
          [`${campo}__escala`]: p.escala.toFixed(3),
        }));
      logo.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        p = posicaoDoLogo(campo, caixa, valuesRef.current);
        inicio = { px: e.clientX, py: e.clientY, x: p.x, y: p.y };
        logo.setPointerCapture(e.pointerId);
      });
      logo.addEventListener('pointermove', (e) => {
        if (!inicio) return;
        p = { ...p, x: inicio.x + (e.clientX - inicio.px), y: inicio.y + (e.clientY - inicio.py) };
        aplicar();
      });
      const soltar = () => {
        if (!inicio) return;
        inicio = null;
        gravar();
      };
      logo.addEventListener('pointerup', soltar);
      logo.addEventListener('pointercancel', soltar);
      let gravarTamanho: number | undefined;
      logo.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Redimensiona mantendo o centro do logo no lugar.
          const antes = caixa.largura * p.escala;
          const escala = Math.min(3, Math.max(0.3, p.escala * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))));
          const depois = caixa.largura * escala;
          p = { x: p.x - (depois - antes) / 2, y: p.y - ((depois - antes) * caixa.proporcao) / 2, escala };
          aplicar();
          window.clearTimeout(gravarTamanho);
          gravarTamanho = window.setTimeout(gravar, 250);
        },
        { passive: false },
      );
    });

    doc.querySelectorAll<HTMLElement>('[data-foto]').forEach((moldura) => {
      const campo = moldura.dataset.foto!;
      const img = moldura.querySelector('img');
      if (!img) return;
      let atual = recorteDaFoto(campo, valuesRef.current);
      const aplicar = () => {
        img.style.objectPosition = `${atual.x}% ${atual.y}%`;
        img.style.transformOrigin = `${atual.x}% ${atual.y}%`;
        img.style.transform = `scale(${atual.zoom})`;
      };
      // Quanto a imagem "anda" na moldura para cada 1% de foco: sobra do cover + sobra do zoom.
      const sobra = () => {
        const cw = moldura.clientWidth;
        const ch = moldura.clientHeight;
        const nw = img.naturalWidth || cw;
        const nh = img.naturalHeight || ch;
        const s = Math.max(cw / nw, ch / nh);
        return {
          x: Math.max(1, (nw * s - cw) * atual.zoom + (atual.zoom - 1) * cw),
          y: Math.max(1, (nh * s - ch) * atual.zoom + (atual.zoom - 1) * ch),
        };
      };
      let inicio: { px: number; py: number; x: number; y: number } | null = null;
      moldura.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        atual = recorteDaFoto(campo, valuesRef.current);
        inicio = { px: e.clientX, py: e.clientY, x: atual.x, y: atual.y };
        moldura.setPointerCapture(e.pointerId);
        moldura.classList.add('arrastando');
      });
      moldura.addEventListener('pointermove', (e) => {
        if (!inicio) return;
        const o = sobra();
        atual = {
          ...atual,
          x: Math.min(100, Math.max(0, inicio.x - ((e.clientX - inicio.px) / o.x) * 100)),
          y: Math.min(100, Math.max(0, inicio.y - ((e.clientY - inicio.py) / o.y) * 100)),
        };
        aplicar();
      });
      const soltar = () => {
        if (!inicio) return;
        inicio = null;
        moldura.classList.remove('arrastando');
        ajustarFoto(campo, atual);
      };
      moldura.addEventListener('pointerup', soltar);
      moldura.addEventListener('pointercancel', soltar);
      let gravarZoom: number | undefined;
      moldura.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          atual = { ...atual, zoom: Math.min(4, Math.max(1, atual.zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)))) };
          aplicar();
          window.clearTimeout(gravarZoom);
          gravarZoom = window.setTimeout(() => ajustarFoto(campo, atual), 250);
        },
        { passive: false },
      );
    });
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

  // Lista dinâmica de datas (Aviso de Feriado): adicionar / duplicar / excluir.
  const addRepeat = () =>
    setRepeatItems((prev) => [...prev, { text: '', variant: template!.repeat!.defaultVariant }]);
  const duplicateRepeat = (index: number) =>
    setRepeatItems((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, { ...prev[index] });
      return next;
    });
  // A lista pode ficar vazia: quem quer trocar todas as datas exclui as duas e
  // adiciona as novas. Sem itens, a arte mantém a altura base e o card sai vazio.
  const removeRepeat = (index: number) =>
    setRepeatItems((prev) => prev.filter((_, i) => i !== index));
  const setRepeatText = (index: number, text: string) =>
    setRepeatItems((prev) => prev.map((it, i) => (i === index ? { ...it, text } : it)));
  const setRepeatVariant = (index: number, variant: string) =>
    setRepeatItems((prev) => prev.map((it, i) => (i === index ? { ...it, variant } : it)));

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
    const faltando = fotosObrigatoriasFaltando(template, values);
    if (faltando.length) {
      toast.error(`Suba a foto antes de baixar: ${faltando.join(', ')}.`);
      return;
    }
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
            onClick={() =>
              // Veio do assistente: volta para o chat. Veio da galeria: volta para a
              // lista da categoria do modelo (ex.: Inauguração), onde a pessoa estava.
              preenchidos
                ? navigate('/pure-design')
                : navigate(
                    `/pure-design?tab=personalizadas&categoria=${encodeURIComponent(template.category)}`,
                  )
            }
            title="Voltar"
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
              // Logo: quem escolhe é o assistente (ou o time). Franqueado não troca.
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
                    <div className="space-y-1">
                      <Textarea
                        id={`campo-${field.id}`}
                        value={currentValue}
                        maxLength={field.maxLength}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="resize-y min-h-[80px]"
                      />
                      <AjusteDoTexto id={field.id} values={values} onChange={handleFieldChange} />
                    </div>
                  ) : field.inputType === 'logo' ? (
                    <div className="space-y-3">
                    {/* Trocar o logo: só o time (a biblioteca de marca é dele). */}
                    {doTime && (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'padrao', nome: 'Padrão do modelo', url: field.defaultValue },
                        ...logosDaMarca
                          .filter((a) => !field.unidadesLogo?.length || field.unidadesLogo.includes(a.unidade))
                          .map((a) => ({ id: a.id, nome: a.subpasta ? `${a.subpasta} · ${a.nome}` : a.nome, url: a.url })),
                      ].map((opcao) => (
                        <button
                          key={opcao.id}
                          type="button"
                          title={opcao.nome}
                          onClick={() => handleFieldChange(field.id, opcao.url)}
                          className={`flex h-16 items-center justify-center rounded-md border bg-muted/40 p-2 ${
                            currentValue === opcao.url ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                          }`}
                        >
                          <img src={opcao.url} alt={opcao.nome} className="max-h-full max-w-full object-contain" />
                        </button>
                      ))}
                    </div>
                    )}
                    {field.logoCaixa && (
                      <AjusteDoLogo
                        id={field.id}
                        caixa={field.logoCaixa}
                        values={values}
                        largura={template.width}
                        altura={effHeight}
                        onChange={(campos) => setValues((prev) => ({ ...prev, ...campos }))}
                      />
                    )}
                    </div>
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
                          reader.onload = () => {
                            // Foto nova começa centralizada e sem zoom.
                            handleFieldChange(field.id, String(reader.result));
                            ajustarFoto(field.id, { zoom: 1, x: 50, y: 50 });
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>Arraste a foto na arte para enquadrar; rodinha ou pinça para zoom.</span>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline"
                          onClick={() => ajustarFoto(field.id, { zoom: 1, x: 50, y: 50 })}
                        >
                          Centralizar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Input
                        id={`campo-${field.id}`}
                        value={currentValue}
                        maxLength={field.maxLength}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      />
                      <AjusteDoTexto id={field.id} values={values} onChange={handleFieldChange} />
                    </div>
                  )}
                </div>
              );
            })}
            {template.repeat && (
              <div className="space-y-3 border-t border-border pt-5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Datas</label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {repeatItems.length} {repeatItems.length === 1 ? 'data' : 'datas'}
                  </span>
                </div>
                <div className="space-y-2">
                  {repeatItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Input
                        value={item.text}
                        maxLength={30}
                        onChange={(e) => setRepeatText(i, e.target.value)}
                        placeholder="09/07 - Fechado"
                        className="flex-1 min-w-0"
                      />
                      <Select value={item.variant} onValueChange={(v) => setRepeatVariant(i, v)}>
                        <SelectTrigger className="w-[104px] shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {template.repeat!.variants.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        onClick={() => duplicateRepeat(i)}
                        title="Duplicar data"
                        aria-label="Duplicar data"
                        className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRepeat(i)}
                        title="Excluir data"
                        aria-label="Excluir data"
                        className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRepeat}
                  className="w-full gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  {template.repeat.addLabel}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Duplique ou adicione datas. <strong>Fechado</strong> fica vermelho;{' '}
                  <strong>Aberto</strong>, branco.
                </p>
              </div>
            )}
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
                onLoad={ligarGestosNaPrevia}
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

const CANTOS: { id: CantoLogo; nome: string }[] = [
  { id: 'sup-esq', nome: '↖ Em cima, esquerda' },
  { id: 'sup-dir', nome: '↗ Em cima, direita' },
  { id: 'inf-esq', nome: '↙ Embaixo, esquerda' },
  { id: 'inf-dir', nome: '↘ Embaixo, direita' },
];

/**
 * Logo: arrasta-se direto na arte (e a rodinha muda o tamanho). Aqui ficam os
 * atalhos de canto, o tamanho e o "voltar ao padrão". Vale para todos.
 */
function AjusteDoLogo({
  id,
  caixa,
  values,
  largura,
  altura,
  onChange,
}: {
  id: string;
  caixa: LogoCaixa;
  values: Record<string, string>;
  largura: number;
  altura: number;
  onChange: (campos: Record<string, string>) => void;
}) {
  const atual = posicaoDoLogo(id, caixa, values);
  return (
    <div className="space-y-2 rounded-md border border-border p-2.5">
      <p className="text-xs text-muted-foreground">Arraste o logo na arte para posicionar; rodinha ou pinça muda o tamanho.</p>
      <div className="grid grid-cols-2 gap-1.5">
        {CANTOS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              const p = cantoDoLogo(c.id, caixa, atual.escala, largura, altura);
              onChange({ [`${id}__x`]: String(Math.round(p.x)), [`${id}__y`]: String(Math.round(p.y)) });
            }}
            className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
          >
            {c.nome}
          </button>
        ))}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Tamanho</span>
          <span className="tabular-nums">{Math.round(atual.escala * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.3}
          max={3}
          step={0.05}
          value={atual.escala}
          onChange={(e) => onChange({ [`${id}__escala`]: e.target.value })}
          className="w-full accent-[hsl(var(--primary))]"
        />
      </div>
      <button
        type="button"
        className="text-xs text-muted-foreground underline"
        onClick={() => onChange({ [`${id}__x`]: '', [`${id}__y`]: '', [`${id}__escala`]: '' })}
      >
        Voltar ao padrão
      </button>
    </div>
  );
}

/** Negrito (**trecho**) e tamanho do texto de um campo. Vale para todos. */
function AjusteDoTexto({
  id,
  values,
  onChange,
}: {
  id: string;
  values: Record<string, string>;
  onChange: (campo: string, valor: string) => void;
}) {
  const tam = Math.min(1.4, Math.max(0.7, Number(values[`${id}__tam`] || 1)));
  const negrito = () => {
    // Põe ** em volta do trecho selecionado (ou do campo todo, sem seleção).
    const el = document.getElementById(`campo-${id}`) as HTMLInputElement | HTMLTextAreaElement | null;
    const texto = values[id] ?? '';
    const ini = el?.selectionStart ?? 0;
    const fim = el?.selectionEnd ?? 0;
    if (fim > ini) onChange(id, `${texto.slice(0, ini)}**${texto.slice(ini, fim)}**${texto.slice(fim)}`);
    else onChange(id, texto.includes('**') ? texto.replace(/\*\*/g, '') : `**${texto}**`);
  };
  const passo = (d: number) => onChange(`${id}__tam`, String(Math.round(Math.min(1.4, Math.max(0.7, tam + d)) * 100) / 100));
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <button type="button" onClick={negrito} className="rounded border border-border px-2 py-0.5 font-bold hover:bg-muted" title="Negrito no trecho selecionado">
        N
      </button>
      <span className="mx-1 h-4 w-px bg-border" />
      <button type="button" onClick={() => passo(-0.05)} className="rounded border border-border px-2 py-0.5 hover:bg-muted" title="Diminuir texto">
        A−
      </button>
      <span className="w-10 text-center tabular-nums">{Math.round(tam * 100)}%</span>
      <button type="button" onClick={() => passo(0.05)} className="rounded border border-border px-2 py-0.5 hover:bg-muted" title="Aumentar texto">
        A+
      </button>
    </div>
  );
}

export default PureDesignEditor;
