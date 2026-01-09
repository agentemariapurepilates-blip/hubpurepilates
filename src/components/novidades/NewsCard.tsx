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
import { Pencil, Trash2, ArrowRight, ImageIcon } from 'lucide-react';
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
  const { user } = useAuth();
  const [showReadDialog, setShowReadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user?.id === post.user_id;
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
        <div className="flex flex-col sm:flex-row">
          {/* Cover Image */}
          <div className="sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-muted relative">
            {coverImage ? (
              <img
                src={coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-4 sm:p-5 flex flex-col">
            {/* Sector Badge */}
            <div className="mb-2">
              <SectorBadge sector={post.sector} />
            </div>

            {/* Title */}
            <h3 className="font-heading font-semibold text-lg mb-2 line-clamp-2">
              {post.title}
            </h3>

            {/* Short Description */}
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
              {shortDescription}
            </p>

            {/* Author and Date */}
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {authorName} • {formatDistanceToNow(new Date(post.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm"
                className="gap-1"
                onClick={() => setShowReadDialog(true)}
              >
                Ler mais
                <ArrowRight className="h-3 w-3" />
              </Button>

              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => setShowEditDialog(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Excluir</span>
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
