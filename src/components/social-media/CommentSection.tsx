import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Send, Trash2, Smile } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Comment {
  id: string;
  comment: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface CommentSectionProps {
  contentId: string;
}

const emojis = [
  '😀', '😃', '😄', '😁', '😊', '🥰', '😍', '🤩',
  '👍', '👏', '🙌', '💪', '🎉', '🎊', '🏆', '⭐',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '🔥', '✨', '💡', '📢', '📌', '✅', '🚀', '💼',
];

const CommentSection = ({ contentId }: CommentSectionProps) => {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('social_media_comments')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(
        (profilesData || []).map((p) => [
          p.user_id,
          { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url },
        ])
      );

      const commentsWithProfiles = data.map((c) => ({
        ...c,
        profiles: profilesMap.get(c.user_id) || null,
      }));

      setComments(commentsWithProfiles);
    } else {
      setComments([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [contentId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${contentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_media_comments',
          filter: `content_id=eq.${contentId}`,
        },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !newComment.trim()) return;

    setSubmitting(true);

    const { error } = await supabase.from('social_media_comments').insert({
      content_id: contentId,
      user_id: user.id,
      comment: newComment.trim(),
    });

    setSubmitting(false);

    if (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
      return;
    }

    setNewComment('');
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from('social_media_comments').delete().eq('id', commentId);

    if (error) {
      toast.error('Erro ao excluir comentário');
      return;
    }

    toast.success('Comentário excluído');
  };

  const insertEmoji = (emoji: string) => {
    setNewComment((prev) => prev + emoji);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <div className="space-y-3 pt-4 border-t">
      <h4 className="text-sm font-medium">Comentários</h4>

      <ScrollArea className="h-48">
        <div className="space-y-3 pr-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum comentário ainda</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(
                      comment.profiles?.full_name || null,
                      comment.profiles?.email || 'U'
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.profiles?.full_name || comment.profiles?.email || 'Usuário'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(comment.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                    </span>
                    {(user?.id === comment.user_id || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.comment}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicionar comentário..."
          className="min-h-[60px] resize-none"
        />
        <div className="flex items-center justify-between">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="gap-1">
                <Smile className="h-4 w-4" />
                Emoji
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="p-1.5 text-lg hover:bg-muted rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button type="submit" size="sm" disabled={!newComment.trim() || submitting} className="gap-2">
            <Send className="h-4 w-4" />
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CommentSection;
