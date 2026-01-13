import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, ChevronRight, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Demand } from '@/pages/PedidosDemanda';

interface DemandListViewProps {
  demands: Demand[];
  onDemandClick: (demand: Demand) => void;
  onStatusChange: (demandId: string, status: Demand['status']) => void;
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Média', color: 'bg-orange-100 text-orange-700' },
  high: { label: 'Alta', color: 'bg-red-100 text-red-700' },
};

const DemandListView = ({ demands, onDemandClick }: DemandListViewProps) => {
  if (demands.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma demanda encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">
          Clique em "Nova Demanda" para criar a primeira
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {demands.map((demand) => (
        <Card
          key={demand.id}
          className="p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.99]"
          onClick={() => onDemandClick(demand)}
        >
          <div className="flex items-start gap-3">
            {/* Creator Avatar */}
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={demand.creator_profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {demand.creator_profile?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm sm:text-base line-clamp-2">
                  {demand.title}
                </h3>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${statusConfig[demand.status].color}`}
                >
                  {statusConfig[demand.status].label}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${priorityConfig[demand.priority].color}`}
                >
                  {priorityConfig[demand.priority].label}
                </Badge>
              </div>

              {/* Departments & Deadline */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span className="truncate">
                  {demand.from_department} → {demand.to_department}
                </span>
                {demand.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(demand.deadline), 'dd/MM', { locale: ptBR })}
                  </span>
                )}
              </div>

              {/* Assignees */}
              {demand.assignees && demand.assignees.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex -space-x-2">
                    {demand.assignees.slice(0, 3).map((assignee) => (
                      <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={assignee.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-[10px]">
                          {assignee.profile?.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {demand.assignees.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{demand.assignees.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DemandListView;
