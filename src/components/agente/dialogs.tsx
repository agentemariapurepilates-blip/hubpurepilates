import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, XCircle } from 'lucide-react';
import { FieldKey, FIELD_LABELS } from './types';

// ============================================================================
// Dialog: Refazer tema com IA (regera title + description, mantem data/tipo).
// ============================================================================
interface RefineThemeDialogProps {
  open: boolean;
  prompt: string;
  loading: boolean;
  onPromptChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RefineThemeDialog({ open, prompt, loading, onPromptChange, onCancel, onConfirm }: RefineThemeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Refazer tema com IA
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sem ajuste = a IA regera título e briefing buscando algo mais forte. Com ajuste = guia a IA pra ir nessa direção. A data e o tipo (vídeo/carrossel/estático) são mantidos.
          </p>
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={3}
            placeholder='Ex: "mais sobre respiração", "menos comemorativo", "foca em iniciantes"'
            autoFocus
            disabled={loading}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>Cancelar</Button>
            <Button size="sm" onClick={onConfirm} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Refazendo…' : 'Refazer tema'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Dialog: Refinar UM campo (legenda / roteiro / texto_arte / briefing_arte) com IA.
// ============================================================================
interface RefineFieldDialogProps {
  open: boolean;
  field: FieldKey | null;
  prompt: string;
  loading: boolean;
  onPromptChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RefineFieldDialog({ open, field, prompt, loading, onPromptChange, onCancel, onConfirm }: RefineFieldDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Refinar {field ? FIELD_LABELS[field].toLowerCase() : 'campo'} com IA
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Conta o ajuste que você quer só neste campo. Os outros campos do post ficam intactos.
          </p>
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={4}
            placeholder='Ex: "tira o tom de venda", "menos clínico, mais ritual", "começa pelo benefício"'
            autoFocus
            disabled={loading}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>Cancelar</Button>
            <Button size="sm" onClick={onConfirm} disabled={loading || !prompt.trim()} className="gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Reescrevendo…' : 'Refinar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Dialog: Reprovar UM campo (motivo granular pra memoria da IA).
// ============================================================================
interface RejectFieldDialogProps {
  open: boolean;
  field: FieldKey | null;
  reason: string;
  saving: boolean;
  onReasonChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RejectFieldDialog({ open, field, reason, saving, onReasonChange, onCancel, onConfirm }: RejectFieldDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Por que está reprovando {field ? FIELD_LABELS[field].toLowerCase() : 'este campo'}?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            O motivo vai pra memória da IA e ensina ela a não repetir esse padrão NESTE campo específico. Quanto mais específico, melhor.
          </p>
          <Textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={5}
            placeholder='Ex: "Briefing genérico, não pediu paleta Pure" ou "Legenda com travessão e tom de spa"'
            autoFocus
            disabled={saving}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={onConfirm} disabled={saving || !reason.trim()} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reprovar campo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Dialog: Reprovar o POST INTEIRO (motivo global).
// ============================================================================
interface RejectGlobalDialogProps {
  open: boolean;
  reason: string;
  saving: boolean;
  onReasonChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RejectGlobalDialog({ open, reason, saving, onReasonChange, onCancel, onConfirm }: RejectGlobalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Por que está reprovando?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Conta o motivo. A IA vai usar isso na próxima geração pra evitar o mesmo problema. Quanto mais específico, melhor.
          </p>
          <Textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={5}
            placeholder='Ex: "Tom muito clínico, falta o calor da Pure" ou "Hashtag genérica demais"'
            autoFocus
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={onConfirm} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reprovar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
