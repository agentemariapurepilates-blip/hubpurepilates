import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { ArrowLeft, Mail } from 'lucide-react';
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
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  buildRenderedHTML,
  pureDesignTemplates,
  type PureDesignTemplate,
} from '@/data/pureDesignTemplates';

const WEBHOOK_URL = import.meta.env.VITE_PURE_DESIGN_WEBHOOK_URL as string | undefined;

function defaultValues(template: PureDesignTemplate): Record<string, string> {
  const values: Record<string, string> = {};
  template.fields.forEach((f) => {
    values[f.id] = f.defaultValue;
  });
  return values;
}

const PureDesignEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const template = pureDesignTemplates.find((t) => t.id === id);

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [values, setValues] = useState<Record<string, string>>(() =>
    template ? defaultValues(template) : {},
  );
  const [zoom, setZoom] = useState(0.4);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!template) return;
    const fit = () => {
      const el = previewWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const padding = 32;
      const scaleW = (rect.width - padding * 2) / template.width;
      const scaleH = (rect.height - padding * 2) / template.height;
      setZoom(Math.max(0.1, Math.min(scaleW, scaleH, 1)));
    };
    const timer = window.setTimeout(fit, 100);
    window.addEventListener('resize', fit);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', fit);
    };
  }, [template]);

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

  const renderedHTML = buildRenderedHTML(template, values);

  const handleFieldChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const openEmailDialog = () => {
    setEmailTo((prev) => prev || user?.email || '');
    setEmailDialogOpen(true);
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
    const iframe = iframeRef.current;
    if (!iframe) return;

    setSending(true);
    try {
      const doc = iframe.contentDocument;
      const target = doc?.body.firstElementChild as HTMLElement | null;
      if (!doc || !target) throw new Error('preview não disponível');

      const canvas = await html2canvas(target, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        width: template.width,
        height: template.height,
        backgroundColor: null,
      });

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('falha ao gerar PNG'))), 'image/png');
      });

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
        <Button size="sm" className="gap-1.5 text-xs" onClick={openEmailDialog}>
          <Mail className="h-3.5 w-3.5" />
          Receber por email
        </Button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <aside className="w-full lg:w-[380px] bg-card border-b lg:border-b-0 lg:border-r border-border overflow-hidden shrink-0 order-2 lg:order-1 flex flex-col">
          <div className="border-b border-border bg-muted/50 shrink-0 px-6 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Editar campos
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {template.fields.map((field) => {
              const currentValue = values[field.id] ?? '';
              const atLimit = field.maxLength !== undefined && currentValue.length >= field.maxLength;
              return (
                <div key={field.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">{field.label}</label>
                    {field.maxLength !== undefined && (
                      <span
                        className={`text-xs tabular-nums ${
                          atLimit ? 'text-destructive font-medium' : 'text-muted-foreground'
                        }`}
                      >
                        {currentValue.length}/{field.maxLength}
                      </span>
                    )}
                  </div>
                  {field.inputType === 'textarea' ? (
                    <Textarea
                      value={currentValue}
                      maxLength={field.maxLength}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="resize-y min-h-[80px]"
                    />
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

        <main className="flex-1 overflow-auto order-1 lg:order-2 bg-muted/50">
          <div
            ref={previewWrapRef}
            className="w-full h-full flex items-center justify-center p-4"
          >
            <iframe
              ref={iframeRef}
              srcDoc={renderedHTML}
              title="Pré-visualização"
              className="shadow-2xl rounded-lg bg-white"
              style={{
                width: template.width,
                height: template.height,
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                border: 'none',
              }}
            />
          </div>
        </main>
      </div>

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
