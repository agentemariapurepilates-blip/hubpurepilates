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
  Users,
  Building2,
  Trash2,
  Edit,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Demand } from '@/pages/PedidosDemanda';

interface DemandDetailsDialogProps {
  demand: Demand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onEditClick: () => void;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  attachments?: {
    file_url: string;
    file_name: string;
  }[];
}

interface Colaborador {
  user_id: string;
  full_name: string | null;
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  in_approval: { label: 'Em Aprovação', color: 'bg-purple-100 text-purple-800' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

// Convert plain text URLs in HTML content to clickable links
const linkifyHtml = (html: string): string => {
  // Create a temporary element to parse HTML
  const div = document.createElement('div');
  div.innerHTML = html;
  
  const walkNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      // Match URLs not already inside an anchor tag
      const urlRegex = /(https?:\/\/[^\s<]+)/g;
      if (urlRegex.test(text)) {
        const span = document.createElement('span');
        span.innerHTML = text.replace(urlRegex, '<a href="$1" class="text-primary underline cursor-pointer" target="_blank" rel="noopener noreferrer">$1</a>');
        node.parentNode?.replaceChild(span, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName !== 'A') {
      // Don't process children of existing <a> tags
      Array.from(node.childNodes).forEach(walkNode);
    }
  };
  
  Array.from(div.childNodes).forEach(walkNode);
  return div.innerHTML;
};

const DemandDetailsDialog = ({ demand, open, onOpenChange, onUpdate, onEditClick }: DemandDetailsDialogProps) => {
  const { user, isAdmin, isColaborador } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [commentAttachments, setCommentAttachments] = useState<{ url: string; name: string }[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch comments
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

      // Fetch profiles
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      // Fetch attachments
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
  }, [demand]);

  // Fetch colaboradores for mentions
  useEffect(() => {
    const fetchColaboradores = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('user_type', 'colaborador');
      
      if (data) setColaboradores(data);
    };
    fetchColaboradores();
  }, []);

  useEffect(() => {
    if (open && demand) {
      fetchComments();

      // Realtime subscription
      const channel = supabase
        .channel(`demand-comments-${demand.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'demand_comments',
          filter: `demand_id=eq.${demand.id}`
        }, () => {
          fetchComments();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, demand, fetchComments]);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Handle paste for images
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await uploadImage(file);
        }
        break;
      }
    }
  }, []);

  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `comments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('demand-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('demand-attachments')
        .getPublicUrl(filePath);

      setCommentAttachments(prev => [...prev, { url: publicUrl, name: file.name }]);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da imagem",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };


  const handleSendComment = async () => {
    // Check if there's actual content (strip HTML tags to check)
    const textContent = newComment.replace(/<[^>]*>/g, '').trim();
    if (!textContent && commentAttachments.length === 0) return;
    if (!demand || !user) return;

    setSendingComment(true);
    try {
      // Create comment with HTML content
      const { data: comment, error } = await supabase
        .from('demand_comments')
        .insert({
          demand_id: demand.id,
          user_id: user.id,
          content: newComment
        })
        .select()
        .single();

      if (error) throw error;

      // Add attachments
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

      // Check for mentions in HTML (data-mention-id attributes) and create notifications
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
      toast({
        title: "Erro",
        description: "Erro ao enviar comentário",
        variant: "destructive"
      });
    } finally {
      setSendingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: Demand['status']) => {
    if (!demand) return;

    try {
      const { error } = await supabase
        .from('demands')
        .update({ status: newStatus })
        .eq('id', demand.id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "O status foi atualizado com sucesso."
      });

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

      toast({
        title: "Prazo atualizado",
        description: "O prazo foi atualizado com sucesso."
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating deadline:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('demand_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    const textContent = editingCommentContent.replace(/<[^>]*>/g, '').trim();
    if (!textContent) return;

    try {
      const { error } = await supabase
        .from('demand_comments')
        .update({ content: editingCommentContent })
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, content: editingCommentContent } : c
      ));
      setEditingCommentId(null);
      setEditingCommentContent('');
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: "Erro",
        description: "Erro ao editar comentário",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDemand = async () => {
    if (!demand) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('demands')
        .delete()
        .eq('id', demand.id);

      if (error) throw error;

      toast({
        title: "Demanda excluída",
        description: "A demanda foi excluída com sucesso."
      });

      setShowDeleteConfirm(false);
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error('Error deleting demand:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir demanda",
        variant: "destructive"
      });
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
            {/* Meta Info */}
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
              {demand.assignees && demand.assignees.length > 0 && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {demand.assignees.map((assignee) => (
                      <Badge key={assignee.user_id} variant="secondary" className="gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={assignee.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {assignee.profile?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {assignee.profile?.full_name || 'Usuário'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

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
                    <div key={comment.id} className="flex gap-3 group">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={comment.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {comment.profile?.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {comment.profile?.full_name || 'Usuário'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            há {formatDistanceToNowStrict(new Date(comment.created_at), {
                              locale: ptBR
                            })}
                          </span>
                          {comment.user_id === user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentContent(comment.content);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                          {(comment.user_id === user?.id || isAdmin) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {editingCommentId === comment.id ? (
                          <div className="mt-1 space-y-2">
                            <DemandRichTextEditor
                              content={editingCommentContent}
                              onChange={setEditingCommentContent}
                              placeholder="Editar comentário..."
                              minHeight="60px"
                              compact
                            />
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => handleEditComment(comment.id)}>
                                <Check className="h-3 w-3" />
                                Salvar
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => { setEditingCommentId(null); setEditingCommentContent(''); }}>
                                <X className="h-3 w-3" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="text-sm whitespace-pre-wrap break-words prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer"
                            dangerouslySetInnerHTML={{ __html: linkifyHtml(comment.content) }}
                          />
                        )}
                        {/* Comment Attachments */}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {comment.attachments.map((att, i) => (
                              <a key={i} href={att.file_url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={att.file_url}
                                  alt={att.file_name}
                                  className="max-h-32 rounded-lg cursor-pointer"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Comment Input */}
          <div className="p-4 border-t bg-background space-y-2">
            {/* Attachments Preview */}
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
