import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, Pin } from 'lucide-react';
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
  } | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  sector: 'estudios' | 'franchising' | 'academy' | 'marketing' | 'tecnologia' | 'expansao';
  image_url: string | null;
  pinned: boolean;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
  comments: Comment[];
}

interface PostCardProps {
  post: Post;
  onCommentAdded: () => void;
}

const emojis = ['👍', '❤️', '🎉', '💪', '🙌', '👏'];

const PostCard = ({ post, onCommentAdded }: PostCardProps) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: user.id,
      content: newComment.trim(),
      emoji: selectedEmoji,
    });

    setSubmitting(false);

    if (error) {
      toast.error('Erro ao adicionar comentário');
      return;
    }

    setNewComment('');
    setSelectedEmoji(null);
    onCommentAdded();
    toast.success('Comentário adicionado!');
  };

  const authorName = post.profiles?.full_name || post.profiles?.email?.split('@')[0] || 'Usuário';
  const authorInitial = authorName[0].toUpperCase();

  return (
    <Card className="card-pure animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
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
        <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
        
        {post.image_url && (
          <img 
            src={post.image_url} 
            alt={post.title}
            className="mt-4 rounded-lg w-full object-cover max-h-96"
          />
        )}

        <div className="mt-4 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4" />
            {post.comments?.length || 0} comentários
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Comments list */}
            {post.comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    {(comment.profiles?.full_name?.[0] || comment.profiles?.email?.[0] || 'U').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">
                      {comment.profiles?.full_name || comment.profiles?.email?.split('@')[0]}
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
            ))}

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
                  <div className="flex gap-1">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedEmoji(selectedEmoji === emoji ? null : emoji)}
                        className={`p-1.5 rounded hover:bg-muted transition-colors ${
                          selectedEmoji === emoji ? 'bg-muted ring-2 ring-primary' : ''
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
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
