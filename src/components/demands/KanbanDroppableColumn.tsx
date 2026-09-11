import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Demand } from '@/features/colaborador/demandas/PedidosDemanda';
import KanbanDraggableCard from './KanbanDraggableCard';

interface KanbanDroppableColumnProps {
  id: string;
  label: string;
  /** Cor do grupo, em hex. */
  color: string;
  demands: Demand[];
  pausesDeadline: boolean;
  onDemandClick: (demand: Demand) => void;
}

const KanbanDroppableColumn = ({ id, label, color, demands, pausesDeadline, onDemandClick }: KanbanDroppableColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div className="w-72 shrink-0">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <h3 className="font-semibold text-sm truncate">{label}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {demands.length}
        </Badge>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[200px] rounded-lg p-2 transition-colors duration-200 ${
          isOver
            ? 'bg-primary/10 ring-2 ring-primary/30'
            : 'bg-muted/30'
        }`}
      >
        {demands.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma demanda
          </div>
        ) : (
          demands.map((demand) => (
            <KanbanDraggableCard
              key={demand.id}
              demand={demand}
              pausesDeadline={pausesDeadline}
              onDemandClick={onDemandClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanDroppableColumn;
