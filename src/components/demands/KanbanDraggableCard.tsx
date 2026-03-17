import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, CalendarPlus, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Demand } from '@/pages/PedidosDemanda';

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Média', color: 'bg-orange-100 text-orange-700' },
  high: { label: 'Alta', color: 'bg-red-100 text-red-700' },
};

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getDeadlineStatus = (deadline: string | null, status: string) => {
  if (!deadline || status === 'completed' || status === 'cancelled') return null;
  const deadlineDate = parseLocalDate(deadline);
  const today = startOfDay(new Date());
  const daysLeft = differenceInDays(deadlineDate, today);

  if (daysLeft < 0) {
    return { label: 'Atrasada', color: 'bg-red-500 text-white', icon: AlertTriangle };
  }
  if (daysLeft <= 2) {
    return { label: 'Atenção', color: 'bg-yellow-500 text-white', icon: Clock };
  }
  return { label: 'No prazo', color: 'bg-green-500 text-white', icon: CheckCircle2 };
};

interface KanbanDraggableCardProps {
  demand: Demand;
  onDemandClick: (demand: Demand) => void;
}

const KanbanDraggableCard = ({ demand, onDemandClick }: KanbanDraggableCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: demand.id,
    data: { demand },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only open details if not dragging
    if (!isDragging) {
      onDemandClick(demand);
    }
  };

  const deadlineStatus = getDeadlineStatus(demand.deadline, demand.status);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 cursor-grab active:cursor-grabbing transition-colors touch-none ${
        isDragging ? 'opacity-40 shadow-lg z-50' : 'hover:bg-muted/50'
      }`}
      onClick={handleClick}
    >
      {/* Deadline Status Badge */}
      {deadlineStatus && (
        <div className="flex items-center gap-1 mb-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${deadlineStatus.color}`}>
            <deadlineStatus.icon className="h-3 w-3" />
            {deadlineStatus.label}
          </span>
        </div>
      )}

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

      {/* Dates */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarPlus className="h-3 w-3" />
          {format(new Date(demand.created_at), 'dd/MM', { locale: ptBR })}
        </span>
        {demand.deadline && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(demand.deadline), 'dd/MM', { locale: ptBR })}
          </span>
        )}
      </div>

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
      </div>
    </Card>
  );
};

export default KanbanDraggableCard;
