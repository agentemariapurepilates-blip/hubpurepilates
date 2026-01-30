import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Handshake, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Aviso } from '@/pages/Avisos';

interface AvisoDetailsDialogProps {
  aviso: Aviso | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AvisoDetailsDialog = ({ aviso, open, onOpenChange }: AvisoDetailsDialogProps) => {
  if (!aviso) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl pr-8">{aviso.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {aviso.image_url && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={aviso.image_url} 
                alt={aviso.title}
                className="w-full h-auto max-h-64 object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {aviso.partner_name && (
              <Badge variant="secondary" className="gap-1">
                <Handshake className="h-3 w-3" />
                {aviso.partner_name}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(aviso.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Badge>
          </div>

          {aviso.content && (
            <div className="prose prose-sm max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: aviso.content }}
                className="text-muted-foreground whitespace-pre-wrap"
              />
            </div>
          )}

          {aviso.creator_profile?.full_name && (
            <p className="text-sm text-muted-foreground border-t pt-4">
              Publicado por <span className="font-medium">{aviso.creator_profile.full_name}</span>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvisoDetailsDialog;
