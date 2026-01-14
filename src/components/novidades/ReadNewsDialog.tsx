import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SectorBadge from '@/components/feed/SectorBadge';
import VideoEmbed from './VideoEmbed';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, Loader2 } from 'lucide-react';
import { NewsPost } from './NewsCard';

interface ReadNewsDialogProps {
  post: NewsPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentAdded?: () => void;
}

const ReadNewsDialog = ({ post, open, onOpenChange }: ReadNewsDialogProps) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState<string[]>([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [likesLoading, setLikesLoading] = useState(true);

  const authorName = post.profiles?.full_name || post.profiles?.email || 'Usuário';
  const authorInitials = authorName.substring(0, 2).toUpperCase();

  useEffect(() => {
    if (open && user) {
      fetchLikes();
    }
  }, [open, user, post.id]);

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

        {/* Video Embed */}
        {post.video_url && (
          <div className="py-4">
            <VideoEmbed url={post.video_url} title={post.title} />
          </div>
        )}

        {/* Content */}
        <div 
          className="prose-post py-4"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Likes */}
        <div className="flex items-center gap-4 py-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${hasLiked ? 'text-primary' : ''}`}
            onClick={handleLike}
            disabled={likesLoading}
          >
            {likesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className={`h-4 w-4 ${hasLiked ? 'fill-primary' : ''}`} />
            )}
            {likes.length} {likes.length === 1 ? 'curtida' : 'curtidas'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReadNewsDialog;
