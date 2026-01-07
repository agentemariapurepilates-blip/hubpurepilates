import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface MarketingEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: MarketingEvent | null;
}

export const EventDetailsDialog = ({ open, onOpenChange, event }: EventDetailsDialogProps) => {
  if (!event) return null;

  const startDate = parseISO(event.start_date);
  const endDate = parseISO(event.end_date);
  const createdAt = parseISO(event.created_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{event.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  {format(startDate, "dd 'de' MMMM", { locale: ptBR })} - {format(endDate, "dd 'de' MMMM", { locale: ptBR })}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Descrição</h4>
            <p className="text-foreground leading-relaxed">
              {event.description || 'Sem descrição disponível.'}
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                Criado por: {event.profiles?.full_name || event.profiles?.email || 'Usuário desconhecido'}
              </span>
            </div>
            <span className="text-muted-foreground">
              {format(createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
