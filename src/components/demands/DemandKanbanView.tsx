import { DndContext, DragEndEvent, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useState } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Demand } from '@/pages/PedidosDemanda';
import KanbanDroppableColumn from './KanbanDroppableColumn';

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

const DemandKanbanView = ({ demands, onDemandClick, onStatusChange }: DemandKanbanViewProps) => {
  const [activeDemand, setActiveDemand] = useState<Demand | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const getDemandsForStatus = (status: Demand['status']) => {
    return demands.filter(d => d.status === status);
  };

  const handleDragStart = (event: DragEndEvent) => {
    const demand = event.active.data.current?.demand as Demand | undefined;
    if (demand) setActiveDemand(demand);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDemand(null);

    if (!over) return;

    const demandId = active.id as string;
    const newStatus = over.id as Demand['status'];
    const demand = demands.find(d => d.id === demandId);

    if (demand && demand.status !== newStatus) {
      onStatusChange(demandId, newStatus);
    }
  };

  const handleDragCancel = () => {
    setActiveDemand(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4 min-w-max">
          {columns.map((column) => (
            <KanbanDroppableColumn
              key={column.id}
              id={column.id}
              label={column.label}
              color={column.color}
              demands={getDemandsForStatus(column.id)}
              onDemandClick={onDemandClick}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Drag Overlay - follows cursor */}
      <DragOverlay>
        {activeDemand ? (
          <Card className="p-3 w-72 shadow-xl rotate-2 opacity-90 border-primary/30">
            <h4 className="font-medium text-sm line-clamp-2 mb-2">
              {activeDemand.title}
            </h4>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar className="h-4 w-4 shrink-0">
                  <AvatarImage src={activeDemand.creator_profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {activeDemand.creator_profile?.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {activeDemand.creator_profile?.full_name || 'Usuário'}
                </span>
              </div>
              <Badge 
                variant="secondary" 
                className={`text-xs shrink-0 ${priorityConfig[activeDemand.priority].color}`}
              >
                {priorityConfig[activeDemand.priority].label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate mb-2">
              {activeDemand.from_department} → {activeDemand.to_department}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {activeDemand.assignees?.slice(0, 3).map((assignee) => (
                  <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={assignee.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-[10px]">
                      {assignee.profile?.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {activeDemand.deadline && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(activeDemand.deadline), 'dd/MM', { locale: ptBR })}
                </span>
              )}
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DemandKanbanView;
