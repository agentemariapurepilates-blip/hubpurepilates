import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Parceria } from '@/pages/Parcerias';

interface ParceriaDetailsDialogProps {
  parceria: Parceria | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ParceriaDetailsDialog = ({ parceria, open, onOpenChange }: ParceriaDetailsDialogProps) => {
  if (!parceria) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{parceria.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {parceria.image_url && (
            <div className="w-full rounded-lg overflow-hidden">
              <img
                src={parceria.image_url}
                alt={parceria.title}
                className="w-full h-auto object-contain"
              />
            </div>
          )}

          {parceria.content && (
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: parceria.content }}
            />
          )}

          {parceria.partner_url && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={parceria.partner_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Visitar site da parceria
              </a>
            </Button>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <span>
              {format(new Date(parceria.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            {parceria.creator_profile?.full_name && (
              <span>por {parceria.creator_profile.full_name}</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParceriaDetailsDialog;
