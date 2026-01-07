import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, User, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  onEventDeleted?: () => void;
}

export const EventDetailsDialog = ({ open, onOpenChange, event, onEventDeleted }: EventDetailsDialogProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  if (!event) return null;

  const startDate = parseISO(event.start_date);
  const endDate = parseISO(event.end_date);
  const createdAt = parseISO(event.created_at);

  const handleDelete = async () => {
    setDeleting(true);
    
    const { error } = await supabase
      .from('marketing_events')
      .delete()
      .eq('id', event.id);

    if (error) {
      toast({
        title: 'Erro ao excluir evento',
        description: error.message,
        variant: 'destructive',
      });
      setDeleting(false);
      return;
    }

    toast({
      title: 'Evento excluído',
      description: 'O evento foi excluído com sucesso.',
    });

    setShowDeleteConfirm(false);
    onOpenChange(false);
    onEventDeleted?.();
  };

  return (
    <>
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

            <Separator />

            <div className="flex justify-end">
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir Evento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza de que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O evento "{event.title}" será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
