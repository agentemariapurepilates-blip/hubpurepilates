import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Demand } from '@/pages/PedidosDemanda';

interface DemandKanbanViewProps {
  demands: Demand[];
  onDemandClick: (demand: Demand) => void;
  onStatusChange: (demandId: string, status: Demand['status']) => void;
}

const columns = [
  { id: 'pending', label: 'Pendente', color: 'bg-yellow-500' },
  { id: 'in_progress', label: 'Em Andamento', color: 'bg-blue-500' },
  { id: 'completed', label: 'Concluído', color: 'bg-green-500' },
  { id: 'cancelled', label: 'Cancelado', color: 'bg-red-500' },
] as const;

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Média', color: 'bg-orange-100 text-orange-700' },
  high: { label: 'Alta', color: 'bg-red-100 text-red-700' },
};

const DemandKanbanView = ({ demands, onDemandClick }: DemandKanbanViewProps) => {
  const getDemandsForStatus = (status: Demand['status']) => {
    return demands.filter(d => d.status === status);
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 pb-4 min-w-max">
        {columns.map((column) => {
          const columnDemands = getDemandsForStatus(column.id);
          
          return (
            <div key={column.id} className="w-72 shrink-0">
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <h3 className="font-semibold text-sm">{column.label}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {columnDemands.length}
                </Badge>
              </div>

              {/* Column Content */}
              <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
                {columnDemands.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhuma demanda
                  </div>
                ) : (
                  columnDemands.map((demand) => (
                    <Card
                      key={demand.id}
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
                      onClick={() => onDemandClick(demand)}
                    >
                      {/* Title */}
                      <h4 className="font-medium text-sm line-clamp-2 mb-2">
                        {demand.title}
                      </h4>

                      {/* Creator & Priority */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Avatar className="h-4 w-4 shrink-0">
                            <AvatarImage src={demand.creator_profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-[8px]">
                              {demand.creator_profile?.full_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate">
                            {demand.creator_profile?.full_name || 'Usuário'}
                          </span>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs shrink-0 ${priorityConfig[demand.priority].color}`}
                        >
                          {priorityConfig[demand.priority].label}
                        </Badge>
                      </div>

                      {/* Department */}
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {demand.from_department} → {demand.to_department}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        {/* Assignees */}
                        <div className="flex -space-x-2">
                          {demand.assignees?.slice(0, 3).map((assignee) => (
                            <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-background">
                              <AvatarImage src={assignee.profile?.avatar_url || undefined} />
                              <AvatarFallback className="bg-muted text-[10px]">
                                {assignee.profile?.full_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {(demand.assignees?.length || 0) > 3 && (
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                              +{(demand.assignees?.length || 0) - 3}
                            </div>
                          )}
                        </div>

                        {/* Deadline */}
                        {demand.deadline && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(demand.deadline), 'dd/MM', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default DemandKanbanView;
