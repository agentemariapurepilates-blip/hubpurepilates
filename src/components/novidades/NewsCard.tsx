import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SectorBadge from '@/components/feed/SectorBadge';
import ReadNewsDialog from './ReadNewsDialog';
import EditNewsDialog from './EditNewsDialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, Trash2, ArrowRight } from 'lucide-react';
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

type SectorType = 'estudios' | 'franchising' | 'academy' | 'consultoras' | 'implantacao';

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

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  sector: SectorType;
  image_url: string | null;
  cover_image_url: string | null;
  short_description: string | null;
  target_month: string | null;
  video_url: string | null;
  pinned: boolean;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  comments: Comment[];
}

interface NewsCardProps {
  post: NewsPost;
  onPostUpdated: () => void;
}

const NewsCard = ({ post, onPostUpdated }: NewsCardProps) => {
  const { user, isColaborador } = useAuth();
  const [showReadDialog, setShowReadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Only collaborators who own the post can edit/delete
  const canEdit = isColaborador && user?.id === post.user_id;
  const authorName = post.profiles?.full_name || post.profiles?.email || 'Usuário';
  const authorInitials = authorName.substring(0, 2).toUpperCase();

  // Get cover image - prioritize cover_image_url, then extract first image from content
  const getCoverImage = (): string | null => {
    if (post.cover_image_url) return post.cover_image_url;
    
    // Try to extract first image from HTML content
    const imgMatch = post.content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch && imgMatch[1]) return imgMatch[1];
    
    return null;
  };

  // Get short description - prioritize short_description, then extract first paragraph
  const getShortDescription = (): string => {
    if (post.short_description) return post.short_description;
    
    // Extract text from HTML and get first 150 chars
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = post.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const cleanText = textContent.trim();
    
    if (cleanText.length > 150) {
      return cleanText.substring(0, 150) + '...';
    }
    return cleanText;
  };

  const coverImage = getCoverImage();
  const shortDescription = getShortDescription();

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    setDeleting(false);

    if (error) {
      toast.error('Erro ao excluir publicação');
      return;
    }

    toast.success('Publicação excluída com sucesso');
    onPostUpdated();
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <div className="flex flex-col">
          {/* Cover Image - Full width at top */}
          {coverImage && (
            <div className="w-full h-48 sm:h-56 bg-muted relative">
              <img
                src={coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <CardContent className="p-5 sm:p-6">
            {/* Sector Badge */}
            <div className="mb-3">
              <SectorBadge sector={post.sector} />
            </div>

            {/* Title */}
            <h3 className="font-heading font-semibold text-xl sm:text-2xl mb-3">
              {post.title}
            </h3>

            {/* Short Description */}
            <p className="text-muted-foreground mb-4 line-clamp-3">
              {shortDescription}
            </p>

            {/* Author and Date */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {authorName} • {formatDistanceToNow(new Date(post.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3 border-t">
              <Button 
                variant="default" 
                className="gap-2"
                onClick={() => setShowReadDialog(true)}
              >
                Ler mais
                <ArrowRight className="h-4 w-4" />
              </Button>

              {canEdit && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setShowEditDialog(true)}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
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
                          onClick={handleDelete}
                          disabled={deleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting ? 'Excluindo...' : 'Excluir'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      <ReadNewsDialog
        post={post}
        open={showReadDialog}
        onOpenChange={setShowReadDialog}
        onCommentAdded={onPostUpdated}
      />

      <EditNewsDialog
        post={post}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onPostUpdated={onPostUpdated}
      />
    </>
  );
};

export default NewsCard;
