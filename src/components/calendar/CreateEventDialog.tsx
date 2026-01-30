import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/ui/rich-text-editor';

const TAG_OPTIONS = [
  { value: 'pacotes', label: 'Pacotes' },
  { value: 'pure_pass', label: 'Pure Pass' },
  { value: 'pure_club', label: 'Pure Club' },
] as const;

type EventTag = 'pacotes' | 'pure_pass' | 'pure_club';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onSuccess: () => void;
}

export const CreateEventDialog = ({ open, onOpenChange, selectedDate, onSuccess }: CreateEventDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(selectedDate || undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(selectedDate || undefined);
  const [tag, setTag] = useState<EventTag | ''>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !startDate || !endDate || !title.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: 'Erro',
        description: 'A data de fim deve ser após a data de início',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('marketing_events').insert({
      title: title.trim(),
      description: description || null,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      user_id: user.id,
      tag: tag || null,
    });

    if (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o evento',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Evento criado com sucesso!',
      });
      setTitle('');
      setDescription('');
      setStartDate(undefined);
      setEndDate(undefined);
      setTag('');
      onOpenChange(false);
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Evento de Marketing</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: 50% OFF para planos anuais"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Detalhes da campanha..."
            />
          </div>

          <div className="space-y-2">
            <Label>Tag</Label>
            <Select value={tag} onValueChange={(value) => setTag(value as EventTag)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma tag" />
              </SelectTrigger>
              <SelectContent>
                {TAG_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Fim *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
