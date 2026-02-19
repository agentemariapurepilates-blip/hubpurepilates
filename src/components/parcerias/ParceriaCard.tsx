import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Parceria } from '@/pages/Parcerias';

interface ParceriaCardProps {
  parceria: Parceria;
  onClick: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

const ParceriaCard = ({ parceria, onClick, onDelete, canDelete }: ParceriaCardProps) => {
  const textContent = parceria.content?.replace(/<[^>]*>/g, '') || '';

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] overflow-hidden"
      onClick={onClick}
    >
      {parceria.image_url && (
        <div className="w-full">
          <img
            src={parceria.image_url}
            alt={parceria.title}
            className="w-full h-auto object-contain"
          />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base line-clamp-2">{parceria.title}</h3>
          </div>

          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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

        {parceria.partner_url && (
          <a
            href={parceria.partner_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-3"
          >
            <ExternalLink className="h-3 w-3" />
            Ver site da parceria
          </a>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {format(new Date(parceria.created_at), "dd 'de' MMMM", { locale: ptBR })}
          </span>
          {parceria.creator_profile?.full_name && (
            <span className="truncate max-w-[120px]">
              por {parceria.creator_profile.full_name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ParceriaCard;
