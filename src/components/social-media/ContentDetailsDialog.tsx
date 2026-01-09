import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Edit, Trash2, User, Video } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import CommentSection from './CommentSection';

interface SocialMediaContent {
  id: string;
  title: string;
  description: string | null;
  google_drive_url: string | null;
  content_type: string | null;
  posting_date: string | null;
  tag: 'reels' | 'desafio_semana' | 'carrossel' | null;
  start_date: string;
  end_date: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

interface ContentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: SocialMediaContent | null;
  onDeleted: () => void;
  onEditClick: () => void;
}

const TAG_CONFIG: Record<string, { label: string; className: string }> = {
  reels: { label: 'Reels', className: 'bg-purple-500 text-white hover:bg-purple-600' },
  desafio_semana: { label: 'Desafio da Semana', className: 'bg-red-500 text-white hover:bg-red-600' },
  carrossel: { label: 'Carrossel', className: 'bg-teal-500 text-white hover:bg-teal-600' },
};

const ContentDetailsDialog = ({
  open,
  onOpenChange,
  content,
  onDeleted,
  onEditClick,
}: ContentDetailsDialogProps) => {
  const { user, isAdmin, isColaborador } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!content) return null;

  const postingDate = content.posting_date ? parseISO(content.posting_date) : parseISO(content.start_date);
  const canEdit = isColaborador && (user?.id === content.user_id || isAdmin);
  const tagConfig = content.tag ? TAG_CONFIG[content.tag] : (content.content_type ? TAG_CONFIG[content.content_type] : null);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from('social_media_content').delete().eq('id', content.id);

    setDeleting(false);
    setShowDeleteConfirm(false);

    if (error) {
      toast.error('Erro ao excluir conteúdo');
      return;
    }

    toast.success('Conteúdo excluído com sucesso');
    onOpenChange(false);
    onDeleted();
  };

  const handleDownload = () => {
    if (content.google_drive_url) {
      window.open(content.google_drive_url, '_blank');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">{content.title}</DialogTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tagConfig && (
                    <Badge className={tagConfig.className}>
                      {tagConfig.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Posting Date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(postingDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>

            {/* Description */}
            {content.description && (
              <p className="text-sm text-muted-foreground">{content.description}</p>
            )}

            {/* Download Button */}
            {content.google_drive_url && (
              <Button onClick={handleDownload} className="w-full gap-2" variant="outline">
                <Download className="h-4 w-4" />
                Baixar do Google Drive
              </Button>
            )}

            {/* Creator info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
              <User className="h-4 w-4" />
              <span>
                Criado por {content.profiles?.full_name || content.profiles?.email || 'Usuário'} em{' '}
                {format(parseISO(content.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>

            {/* Comments Section */}
            <CommentSection contentId={content.id} />

            {/* Actions */}
            {canEdit && (
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1 gap-2" onClick={onEditClick}>
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este conteúdo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContentDetailsDialog;
