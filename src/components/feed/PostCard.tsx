import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MessageCircle, Send, Pin, Smile, Heart, Trash2, Pencil, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SectorBadge from './SectorBadge';
import EditFeedPostDialog from './EditFeedPostDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Comment {
  id: string;
  content: string;
  emoji: string | null;
  user_id: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  sector: 'estudios' | 'franchising' | 'academy' | 'consultoras' | 'implantacao';
  image_url: string | null;
  pinned: boolean;
  created_at: string;
  user_id?: string;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  comments: Comment[];
}

interface PostCardProps {
  post: Post;
  onCommentAdded: () => void;
}

const emojis = [
  '😀', '😃', '😄', '😁', '😊', '🥰', '😍', '🤩',
  '👍', '👏', '🙌', '💪', '🎉', '🎊', '🏆', '⭐',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '🔥', '✨', '💡', '📢', '📌', '✅', '🚀', '💼',
];

const PostCard = ({ post, onCommentAdded }: PostCardProps) => {
  const { user, isAdmin } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(post.comments || []);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [postUserId, setPostUserId] = useState<string | null>(post.user_id || null);

  const isOwner = user?.id === postUserId;

  useEffect(() => {
    fetchLikes();
    if (!post.user_id) {
      fetchPostUserId();
    }
  }, [post.id, user]);

  useEffect(() => {
    setLocalComments(post.comments || []);
  }, [post.comments]);

  const fetchPostUserId = async () => {
    const { data } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', post.id)
      .single();
    
    if (data) {
      setPostUserId(data.user_id);
    }
  };

  const fetchLikes = async () => {
    // Get total likes count
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);

    setLikesCount(count || 0);

    // Check if current user liked
    if (user) {
      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setHasLiked(!!data);
    }
  };

  const handleLike = async () => {
    if (!user || likeLoading) return;

    setLikeLoading(true);

    if (hasLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);

      if (!error) {
        setHasLiked(false);
        setLikesCount((prev) => prev - 1);
      }
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: post.id, user_id: user.id });

      if (!error) {
        setHasLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    }

    setLikeLoading(false);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: user.id,
      content: newComment.trim(),
    });

    setSubmitting(false);

    if (error) {
      toast.error('Erro ao adicionar comentário');
      return;
    }

    setNewComment('');
    onCommentAdded();
    toast.success('Comentário adicionado!');
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

    setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
    toast.success('Comentário excluído');
    onCommentAdded();
  };

  const handleDeletePost = async () => {
    setDeleting(true);
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    setDeleting(false);

    if (error) {
      toast.error('Erro ao excluir publicação');
      return;
    }

    toast.success('Publicação excluída com sucesso');
    onCommentAdded();
  };

  const insertEmoji = (emoji: string) => {
    setNewComment((prev) => prev + emoji);
  };

  const authorName = post.profiles?.full_name || post.profiles?.email?.split('@')[0] || 'Usuário';
  const authorInitial = authorName[0].toUpperCase();

  return (
    <>
      <Card className="card-pure animate-fade-in overflow-hidden">
        {/* Image displayed at the top like Facebook */}
        {post.image_url && (
          <div className="w-full">
            <img 
              src={post.image_url} 
              alt={post.title}
              className="w-full object-cover max-h-[500px]"
            />
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.profiles?.avatar_url || undefined} alt={authorName} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {authorInitial}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{authorName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {post.pinned && (
                <Pin className="h-4 w-4 text-primary" />
              )}
              <SectorBadge sector={post.sector} />
              
              {/* Owner actions dropdown */}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem 
                          onSelect={(e) => e.preventDefault()}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir publicação?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A publicação será permanentemente removida.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeletePost}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleting ? 'Excluindo...' : 'Excluir'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
          <div 
            className="prose-post text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-4 pt-4 border-t flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${hasLiked ? 'text-red-500' : 'text-muted-foreground'}`}
              onClick={handleLike}
              disabled={likeLoading}
            >
              <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
              {likesCount} curtida{likesCount !== 1 ? 's' : ''}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              {localComments.length} comentário{localComments.length !== 1 ? 's' : ''}
            </Button>
          </div>

          {showComments && (
            <div className="mt-4 space-y-4 animate-fade-in">
              {/* Comments list */}
              {localComments.map((comment) => {
                const commentAuthor = comment.profiles?.full_name || comment.profiles?.email?.split('@')[0] || 'Usuário';
                const commentInitial = commentAuthor[0].toUpperCase();
                const canDelete = user?.id === comment.user_id || isAdmin;
                
                return (
                  <div key={comment.id} className="flex gap-3 group">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.profiles?.avatar_url || undefined} alt={commentAuthor} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        {commentInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">
                          {commentAuthor}
                        </p>
                        {comment.emoji && (
                          <span className="text-base">{comment.emoji}</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
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

              {/* New comment form */}
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Escreva um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
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
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submitting}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EditFeedPostDialog
        post={post}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onPostUpdated={onCommentAdded}
      />
    </>
  );
};

export default PostCard;
