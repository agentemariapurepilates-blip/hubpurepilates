import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import SectorBadge from '@/components/feed/SectorBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, MessageCircle, Send, Loader2, Smile, Trash2 } from 'lucide-react';
import { NewsPost } from './NewsCard';

interface ReadNewsDialogProps {
  post: NewsPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentAdded: () => void;
}

const emojis = [
  '😀', '😃', '😄', '😁', '😊', '🥰', '😍', '🤩',
  '👍', '👏', '🙌', '💪', '🎉', '🎊', '🏆', '⭐',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '🔥', '✨', '💡', '📢', '📌', '✅', '🚀', '💼',
];

const ReadNewsDialog = ({ post, open, onOpenChange, onCommentAdded }: ReadNewsDialogProps) => {
  const { user, isAdmin } = useAuth();
  const [likes, setLikes] = useState<string[]>([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likesLoading, setLikesLoading] = useState(true);
  const [localComments, setLocalComments] = useState(post.comments);

  const authorName = post.profiles?.full_name || post.profiles?.email || 'Usuário';
  const authorInitials = authorName.substring(0, 2).toUpperCase();

  useEffect(() => {
    if (open && user) {
      fetchLikes();
    }
  }, [open, user, post.id]);

  useEffect(() => {
    setLocalComments(post.comments);
  }, [post.comments]);

  const fetchLikes = async () => {
    if (!user) return;
    setLikesLoading(true);
    
    const { data } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('post_id', post.id);

    if (data) {
      const likeUserIds = data.map(l => l.user_id);
      setLikes(likeUserIds);
      setHasLiked(likeUserIds.includes(user.id));
    }
    setLikesLoading(false);
  };

  const handleLike = async () => {
    if (!user) return;

    if (hasLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);
      
      setLikes(prev => prev.filter(id => id !== user.id));
      setHasLiked(false);
    } else {
      await supabase
        .from('post_likes')
        .insert({ post_id: post.id, user_id: user.id });
      
      setLikes(prev => [...prev, user.id]);
      setHasLiked(true);
    }
  };

  const handleCommentSubmit = async () => {
    if (!user || !newComment.trim()) return;

    setSubmittingComment(true);
    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: user.id,
      content: newComment.trim(),
    });
    setSubmittingComment(false);

    if (error) {
      toast.error('Erro ao enviar comentário');
      return;
    }

    toast.success('Comentário enviado!');
    setNewComment('');
    onCommentAdded();
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast.error('Erro ao excluir comentário');
      return;
    }

    setLocalComments(prev => prev.filter(c => c.id !== commentId));
    toast.success('Comentário excluído');
    onCommentAdded();
  };

  const insertEmoji = (emoji: string) => {
    setNewComment((prev) => prev + emoji);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          {/* Cover Image */}
          {post.cover_image_url && (
            <div className="w-full h-48 sm:h-64 rounded-lg overflow-hidden -mt-2">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Sector Badge */}
          <div>
            <SectorBadge sector={post.sector} />
          </div>

          {/* Title */}
          <DialogTitle className="text-xl sm:text-2xl font-heading pr-8">
            {post.title}
          </DialogTitle>

          {/* Author and Date */}
          <div className="flex items-center gap-3 pb-2 border-b">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{authorName}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(post.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div 
          className="prose-post py-4"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Likes and Comments Summary */}
        <div className="flex items-center gap-4 py-3 border-t border-b">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${hasLiked ? 'text-primary' : ''}`}
            onClick={handleLike}
            disabled={likesLoading}
          >
            <Heart className={`h-4 w-4 ${hasLiked ? 'fill-primary' : ''}`} />
            {likes.length} {likes.length === 1 ? 'curtida' : 'curtidas'}
          </Button>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            {localComments.length} {localComments.length === 1 ? 'comentário' : 'comentários'}
          </span>
        </div>

        {/* Comments Section */}
        <div className="space-y-4 pt-2">
          <h4 className="font-medium">Comentários</h4>

          {/* Comment Input */}
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
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
              <Button
                size="sm"
                onClick={handleCommentSubmit}
                disabled={submittingComment || !newComment.trim()}
                className="gap-2"
              >
                {submittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar
              </Button>
            </div>
          </div>

          {/* Comments List */}
          {localComments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          ) : (
            <div className="space-y-3">
              {localComments.map((comment) => {
                const commentAuthor = comment.profiles?.full_name || comment.profiles?.email || 'Usuário';
                const commentInitials = commentAuthor.substring(0, 2).toUpperCase();
                const canDelete = user?.id === comment.user_id || isAdmin;
                
                return (
                  <div key={comment.id} className="flex gap-3 group">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px] bg-muted">
                        {commentInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{commentAuthor}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReadNewsDialog;
