import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DemandRichTextEditor from './DemandRichTextEditor';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  CalendarIcon,
  Send,
  Loader2,
  Clock,
  Building2,
  Trash2,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { supabase } from '@/integrations/supabase/client';
import { uploadFileToStorage } from '@/lib/upload';
import { toast } from '@/hooks/use-toast';
import { Demand } from '@/pages/PedidosDemanda';
import { useColaboradores } from '@/hooks/useColaboradores';
import { CommentItem, Comment } from './detail/CommentItem';
import { AssigneeSection } from './detail/AssigneeSection';
import { statusConfig } from './detail/statusConfig';
import { linkifyHtml } from './detail/linkifyHtml';

interface DemandDetailsDialogProps {
  demand: Demand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onEditClick: () => void;
}

const DemandDetailsDialog = ({ demand, open, onOpenChange, onUpdate, onEditClick }: DemandDetailsDialogProps) => {
  const { user, isAdmin, isColaborador } = useAuth();
  const { colaboradores } = useColaboradores();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [commentAttachments, setCommentAttachments] = useState<{ url: string; name: string }[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    if (!demand) return;

    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('demand_comments')
        .select('*')
        .eq('demand_id', demand.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const commentIds = commentsData?.map(c => c.id) || [];
      const { data: attachmentsData } = await supabase
        .from('demand_attachments')
        .select('comment_id, file_url, file_name')
        .in('comment_id', commentIds);

      const commentsWithData = commentsData?.map(comment => ({
        ...comment,
        profile: profiles?.find(p => p.user_id === comment.user_id),
        attachments: attachmentsData?.filter(a => a.comment_id === comment.id)
      })) as Comment[];

      setComments(commentsWithData || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [demand?.id]);

  useEffect(() => {
    if (!open || !demand) return;

    fetchComments();

    let debounceTimer: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel(`demand-comments-${demand.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'demand_comments',
        filter: `demand_id=eq.${demand.id}`
      }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fetchComments(), 500);
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [open, demand?.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setUploadingImage(true);
          try {
            const { publicUrl } = await uploadFileToStorage(file, 'demand-attachments', 'comments');
            setCommentAttachments(prev => [...prev, { url: publicUrl, name: file.name }]);
          } catch (error) {
            console.error('Error uploading image:', error);
            toast({ title: "Erro", description: "Erro ao fazer upload da imagem", variant: "destructive" });
          } finally {
            setUploadingImage(false);
          }
        }
        break;
      }
    }
  }, []);

  const handleSendComment = async () => {
    const textContent = newComment.replace(/<[^>]*>/g, '').trim();
    if (!textContent && commentAttachments.length === 0) return;
    if (!demand || !user) return;

    setSendingComment(true);
    try {
      const { data: comment, error } = await supabase
        .from('demand_comments')
        .insert({ demand_id: demand.id, user_id: user.id, content: newComment })
        .select()
        .single();

      if (error) throw error;

      if (commentAttachments.length > 0) {
        const attachmentsData = commentAttachments.map(a => ({
          comment_id: comment.id,
          demand_id: demand.id,
          file_url: a.url,
          file_name: a.name,
          uploaded_by: user.id,
        }));
        await supabase.from('demand_attachments').insert(attachmentsData);
      }

      const mentionIdRegex = /data-mention-id="([^"]+)"/g;
      let match;
      const mentionedIds = new Set<string>();
      while ((match = mentionIdRegex.exec(newComment)) !== null) {
        mentionedIds.add(match[1]);
      }

      for (const mentionedUserId of mentionedIds) {
        if (mentionedUserId !== user.id) {
          await supabase.from('demand_notifications').insert({
            user_id: mentionedUserId,
            demand_id: demand.id,
            notification_type: 'mention',
            message: `Você foi mencionado(a) em um comentário na demanda: ${demand.title}`,
            created_by: user.id,
          });
        }
      }

      setNewComment('');
      setCommentAttachments([]);
    } catch (error) {
      console.error('Error sending comment:', error);
      toast({ title: "Erro", description: "Erro ao enviar comentário", variant: "destructive" });
    } finally {
      setSendingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: Demand['status']) => {
    if (!demand) return;
    try {
      const { error } = await supabase.from('demands').update({ status: newStatus }).eq('id', demand.id);
      if (error) throw error;
      toast({ title: "Status atualizado", description: "O status foi atualizado com sucesso." });
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeadlineChange = async (newDeadline: Date | undefined) => {
    if (!demand) return;
    try {
      const { error } = await supabase
        .from('demands')
        .update({ deadline: newDeadline ? format(newDeadline, 'yyyy-MM-dd') : null })
        .eq('id', demand.id);
      if (error) throw error;
      toast({ title: "Prazo atualizado", description: "O prazo foi atualizado com sucesso." });
      onUpdate();
    } catch (error) {
      console.error('Error updating deadline:', error);
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      const { error } = await supabase.from('demand_comments').update({ content }).eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content } : c));
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({ title: "Erro", description: "Erro ao editar comentário", variant: "destructive" });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from('demand_comments').delete().eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleDeleteDemand = async () => {
    if (!demand) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('demands').delete().eq('id', demand.id);
      if (error) throw error;
      toast({ title: "Demanda excluída", description: "A demanda foi excluída com sucesso." });
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error('Error deleting demand:', error);
      toast({ title: "Erro", description: "Erro ao excluir demanda", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (!demand) return null;

  const canEdit = demand.created_by === user?.id || isAdmin;
  const canChangeStatus = isColaborador || isAdmin;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0 shrink-0">
            <DialogTitle className="text-left line-clamp-2 pr-8">{demand.title}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4">
            <div className="space-y-4 py-4">
              {/* Status */}
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Status:</span>
                {canChangeStatus ? (
                  <Select value={demand.status} onValueChange={(v) => handleStatusChange(v as Demand['status'])}>
                    <SelectTrigger className="h-8 w-auto">
                      <Badge className={statusConfig[demand.status].color}>
                        {statusConfig[demand.status].label}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="missing_info">Faltam Informações</SelectItem>
                      <SelectItem value="in_approval">Em Aprovação</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={statusConfig[demand.status].color}>
                    {statusConfig[demand.status].label}
                  </Badge>
                )}
              </div>

              {/* Created at */}
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Aberta em:</span>
                <span className="text-sm">
                  {format(new Date(demand.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Prazo:</span>
                {canEdit ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        {demand.deadline
                          ? format(new Date(demand.deadline), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Definir prazo'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={demand.deadline ? new Date(demand.deadline) : undefined}
                        onSelect={handleDeadlineChange}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <span className="text-sm">
                    {demand.deadline
                      ? format(new Date(demand.deadline), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Não definido'
                    }
                  </span>
                )}
              </div>

              {/* Departments */}
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {demand.from_department} → {demand.to_department}
                </span>
              </div>

              {/* Assignees */}
              <AssigneeSection
                demand={demand}
                colaboradores={colaboradores}
                canManage={isColaborador || isAdmin}
                onUpdate={onUpdate}
              />

              {/* Creator */}
              <div className="flex items-center gap-3">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={demand.creator_profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {demand.creator_profile?.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  Aberto por <span className="font-medium text-foreground">{demand.creator_profile?.full_name || 'Usuário'}</span>
                </span>
              </div>

              {/* Description */}
              {demand.description && (
                <div className="pt-2">
                  <div
                    className="text-sm text-muted-foreground prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer"
                    dangerouslySetInnerHTML={{ __html: linkifyHtml(demand.description) }}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Comments Section */}
            <div className="py-4">
              <h3 className="font-semibold mb-4">Comentários</h3>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum comentário ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUserId={user?.id}
                      isAdmin={isAdmin}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                    />
                  ))}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Comment Input */}
          <div className="p-4 border-t bg-background space-y-2">
            {commentAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {commentAttachments.map((att, i) => (
                  <div key={i} className="relative">
                    <img src={att.url} alt={att.name} className="h-12 w-12 object-cover rounded" />
                    <button
                      onClick={() => setCommentAttachments(prev => prev.filter((_, index) => index !== i))}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <span className="sr-only">Remover</span>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <DemandRichTextEditor
              content={newComment}
              onChange={setNewComment}
              placeholder="Escreva um comentário... Use @ para mencionar"
              minHeight="60px"
              compact
            />

            <div className="flex justify-end">
              <Button
                size="sm"
                className="gap-2"
                onClick={handleSendComment}
                disabled={sendingComment || (!newComment.trim() && !newComment.includes('<') && commentAttachments.length === 0)}
              >
                {sendingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Edit/Delete Actions */}
          {canEdit && (
            <div className="flex gap-2 p-4 pt-0 border-t">
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
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta demanda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDemand} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DemandDetailsDialog;
