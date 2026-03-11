import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Aviso } from '@/pages/Avisos';

interface AvisoCardProps {
  aviso: Aviso;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
}

const AvisoCard = ({ aviso, onClick, onEdit, onDelete, canEdit }: AvisoCardProps) => {
  const textContent = aviso.content?.replace(/<[^>]*>/g, '') || '';
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] overflow-hidden"
      onClick={onClick}
    >
      {aviso.video_url ? (
        <div className="w-full">
          <video 
            src={aviso.video_url} 
            className="w-full max-h-64 object-contain bg-black"
            muted
            playsInline
            onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
            onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
          />
        </div>
      ) : aviso.image_url ? (
        <div className="w-full">
          <img 
            src={aviso.image_url} 
            alt={aviso.title}
            className="w-full h-auto object-contain"
          />
        </div>
      ) : null}
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base line-clamp-2">{aviso.title}</h3>
          </div>
          
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {textContent && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {textContent}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {format(new Date(aviso.created_at), "dd 'de' MMMM", { locale: ptBR })}
          </span>
          {aviso.creator_profile?.full_name && (
            <span className="truncate max-w-[120px]">
              por {aviso.creator_profile.full_name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AvisoCard;
