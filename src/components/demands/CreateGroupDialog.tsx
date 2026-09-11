import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { GROUP_COLORS } from './demandGroups';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areas: string[];
  /** Setor já escolhido na lateral. Nulo em "Ver todos os setores": aí o campo de setor aparece. */
  defaultArea: string | null;
  onCreate: (area: string, name: string, color: string) => Promise<void>;
}

const CreateGroupDialog = ({ open, onOpenChange, areas, defaultArea, onCreate }: CreateGroupDialogProps) => {
  const [area, setArea] = useState(defaultArea ?? '');
  const [name, setName] = useState('');
  const [color, setColor] = useState(GROUP_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setArea(defaultArea ?? '');
      setName('');
      setColor(GROUP_COLORS[0]);
    }
  }, [open, defaultArea]);

  const podeSalvar = Boolean(area && name.trim()) && !saving;

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeSalvar) return;
    setSaving(true);
    try {
      await onCreate(area, name.trim(), color);
      onOpenChange(false);
    } catch {
      // A página já mostrou o erro num toast; o diálogo fica aberto para tentar de novo.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar grupo de tarefas</DialogTitle>
        </DialogHeader>
        <form onSubmit={salvar} className="space-y-4">
          {!defaultArea && (
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o setor" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nome-do-grupo">Nome do grupo</Label>
            <Input
              id="nome-do-grupo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: A Fazer"
              maxLength={60}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Cor ${c}`}
                  aria-pressed={color === c}
                  className={cn(
                    'h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition',
                    color === c ? 'ring-2 ring-foreground' : 'hover:scale-110',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!podeSalvar}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar grupo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
