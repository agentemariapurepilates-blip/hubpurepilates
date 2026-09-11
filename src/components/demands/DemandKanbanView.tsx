import { DndContext, DragEndEvent, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useState } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Demand } from '@/features/colaborador/demandas/PedidosDemanda';
import KanbanDroppableColumn from './KanbanDroppableColumn';
import type { DemandGroup } from './demandGroups';
import { parseDateOnly, priorityConfig } from './demandHelpers';

/** Id da coluna das demandas sem grupo (ou com grupo de outra área). */
const SEM_GRUPO = '__sem_grupo__';

interface DemandKanbanViewProps {
  demands: Demand[];
  /** Grupos da área selecionada, já na ordem de exibição. */
  groups: DemandGroup[];
  onDemandClick: (demand: Demand) => void;
  onGroupChange: (demandId: string, groupId: string | null) => void;
}

const DemandKanbanView = ({ demands, groups, onDemandClick, onGroupChange }: DemandKanbanViewProps) => {
  const [activeDemand, setActiveDemand] = useState<Demand | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const idsDosGrupos = new Set(groups.map((g) => g.id));
  const grupoAtual = (d: Demand) => (d.group_id && idsDosGrupos.has(d.group_id) ? d.group_id : null);
  const semGrupo = demands.filter((d) => grupoAtual(d) === null);

  const handleDragStart = (event: DragEndEvent) => {
    const demand = event.active.data.current?.demand as Demand | undefined;
    if (demand) setActiveDemand(demand);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDemand(null);

    if (!over) return;

    const demandId = active.id as string;
    const destino = over.id === SEM_GRUPO ? null : String(over.id);
    const demand = demands.find((d) => d.id === demandId);

    if (demand && grupoAtual(demand) !== destino) {
      onGroupChange(demandId, destino);
    }
  };

  const handleDragCancel = () => {
    setActiveDemand(null);
  };

  if (groups.length === 0 && semGrupo.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Este setor ainda não tem grupos. Crie um grupo pela lista ou pelo menu “Criar tarefa”.
      </Card>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4 min-w-max">
          {groups.map((grupo) => (
            <KanbanDroppableColumn
              key={grupo.id}
              id={grupo.id}
              label={grupo.name}
              color={grupo.color}
              demands={demands.filter((d) => d.group_id === grupo.id)}
              pausesDeadline={grupo.pauses_deadline}
              onDemandClick={onDemandClick}
            />
          ))}
          {semGrupo.length > 0 && (
            <KanbanDroppableColumn
              id={SEM_GRUPO}
              label="Sem grupo"
              color="#C4C4C4"
              demands={semGrupo}
              pausesDeadline={false}
              onDemandClick={onDemandClick}
            />
          )}
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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarPlus className="h-3 w-3" />
                {format(new Date(activeDemand.created_at), 'dd/MM', { locale: ptBR })}
              </span>
              {activeDemand.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(parseDateOnly(activeDemand.deadline), 'dd/MM', { locale: ptBR })}
                </span>
              )}
            </div>
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
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DemandKanbanView;
