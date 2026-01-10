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
import { Calendar, Download, Edit, Trash2, User, Video, Image, Target, LayoutGrid, LucideIcon, Copy, Check } from 'lucide-react';
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
  tag: 'reels' | 'desafio_semana' | 'carrossel' | 'estatico' | null;
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

const TAG_CONFIG: Record<string, { label: string; className: string; icon: LucideIcon }> = {
  reels: { label: 'Reels', className: 'bg-purple-500 text-white hover:bg-purple-600', icon: Video },
  desafio_semana: { label: 'Desafio da Semana', className: 'bg-red-500 text-white hover:bg-red-600', icon: Target },
  carrossel: { label: 'Carrossel', className: 'bg-teal-500 text-white hover:bg-teal-600', icon: LayoutGrid },
  estatico: { label: 'Estático', className: 'bg-blue-500 text-white hover:bg-blue-600', icon: Image },
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
  const [copied, setCopied] = useState(false);

  const handleCopyCaption = async () => {
    if (!content.description) return;
    
    try {
      await navigator.clipboard.writeText(content.description);
      setCopied(true);
      toast.success('Legenda copiada!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar legenda');
    }
  };

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {tagConfig ? (
                  <tagConfig.icon className="h-5 w-5 text-primary" />
                ) : (
                  <Video className="h-5 w-5 text-primary" />
                )}
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

            {/* Download Button - Red and prominent */}
            {content.google_drive_url && (
              <a
                href={content.google_drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-md"
              >
                <Download className="h-5 w-5" />
                Baixar do Google Drive
              </a>
            )}

            {/* Caption/Description - Below download button with emphasis */}
            {content.description && (
              <div className="space-y-3 bg-muted/50 rounded-lg p-4 border">
                <h4 className="font-semibold text-base text-foreground">Legenda do Post</h4>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{content.description}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 w-full"
                  onClick={handleCopyCaption}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar Legenda
                    </>
                  )}
                </Button>
              </div>
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
