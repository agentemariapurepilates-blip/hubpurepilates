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
import { MessageCircle, Send, Pin, Smile, Heart } from 'lucide-react';
import SectorBadge from './SectorBadge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Comment {
  id: string;
  content: string;
  emoji: string | null;
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
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    fetchLikes();
  }, [post.id, user]);

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

  const insertEmoji = (emoji: string) => {
    setNewComment((prev) => prev + emoji);
  };

  const authorName = post.profiles?.full_name || post.profiles?.email?.split('@')[0] || 'Usuário';
  const authorInitial = authorName[0].toUpperCase();

  return (
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
            {post.comments?.length || 0} comentário{(post.comments?.length || 0) !== 1 ? 's' : ''}
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Comments list */}
            {post.comments?.map((comment) => {
              const commentAuthor = comment.profiles?.full_name || comment.profiles?.email?.split('@')[0] || 'Usuário';
              const commentInitial = commentAuthor[0].toUpperCase();
              
              return (
                <div key={comment.id} className="flex gap-3">
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
  );
};

export default PostCard;
