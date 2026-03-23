import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, CalendarPlus, ChevronRight, Users, ChevronDown, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Demand } from '@/pages/PedidosDemanda';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface DemandListViewProps {
  demands: Demand[];
  onDemandClick: (demand: Demand) => void;
  onStatusChange: (demandId: string, status: Demand['status']) => void;
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', headerColor: 'bg-yellow-50 border-yellow-200' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800 border-blue-200', headerColor: 'bg-blue-50 border-blue-200' },
  missing_info: { label: 'Faltam Informações', color: 'bg-amber-100 text-amber-800 border-amber-200', headerColor: 'bg-amber-50 border-amber-200' },
  in_approval: { label: 'Em Aprovação', color: 'bg-purple-100 text-purple-800 border-purple-200', headerColor: 'bg-purple-50 border-purple-200' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800 border-green-200', headerColor: 'bg-green-50 border-green-200' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', headerColor: 'bg-red-50 border-red-200' },
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Média', color: 'bg-orange-100 text-orange-700' },
  high: { label: 'Alta', color: 'bg-red-100 text-red-700' },
};

const parseDateOnly = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getBrazilDateKey = (date = new Date()) => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const getDeadlineStatus = (deadline: string | null, status: string) => {
  if (!deadline || status === 'completed' || status === 'cancelled' || status === 'in_approval' || status === 'missing_info') return null;

  const todayKey = getBrazilDateKey();
  const attentionLimitKey = getBrazilDateKey(addDays(new Date(), 2));

  if (deadline < todayKey) {
    return { label: 'Atrasada', color: 'bg-red-500 text-white', icon: AlertTriangle };
  }
  if (deadline <= attentionLimitKey) {
    return { label: 'Atenção', color: 'bg-yellow-500 text-white', icon: Clock };
  }
  return { label: 'No prazo', color: 'bg-green-500 text-white', icon: CheckCircle2 };
};

const statusOrder: Demand['status'][] = ['pending', 'in_progress', 'missing_info', 'in_approval', 'completed', 'cancelled'];

const DemandListView = ({ demands, onDemandClick }: DemandListViewProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pending: true,
    in_progress: true,
    missing_info: true,
    in_approval: true,
    completed: true,
    cancelled: true,
  });

  const toggleSection = (status: string) => {
    setOpenSections(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const groupedDemands = statusOrder.reduce((acc, status) => {
    acc[status] = demands.filter(d => d.status === status);
    return acc;
  }, {} as Record<Demand['status'], Demand[]>);

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
    <div className="space-y-4">
      {statusOrder.map((status) => {
        const statusDemands = groupedDemands[status];
        const config = statusConfig[status];
        
        return (
          <Collapsible
            key={status}
            open={openSections[status]}
            onOpenChange={() => toggleSection(status)}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${config.headerColor}`}>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={config.color}>
                      {config.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {statusDemands.length} {statusDemands.length === 1 ? 'demanda' : 'demandas'}
                    </span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openSections[status] ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {statusDemands.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhuma demanda com este status
                  </div>
                ) : (
                  <div className="divide-y">
                    {statusDemands.map((demand) => (
                      <div
                        key={demand.id}
                        className="p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.995]"
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
                              <div className="min-w-0">
                                <h3 className="font-medium text-sm sm:text-base line-clamp-2">
                                  {demand.title}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  por {demand.creator_profile?.full_name || 'Usuário'}
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                            </div>

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {(() => {
                                const deadlineStatus = getDeadlineStatus(demand.deadline, demand.status);
                                const DeadlineStatusIcon = deadlineStatus?.icon;
                                return deadlineStatus && DeadlineStatusIcon ? (
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${deadlineStatus.color}`}>
                                    <DeadlineStatusIcon className="h-3 w-3" />
                                    {deadlineStatus.label}
                                  </span>
                                ) : null;
                              })()}
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${priorityConfig[demand.priority].color}`}
                              >
                                {priorityConfig[demand.priority].label}
                              </Badge>
                            </div>

                            {/* Departments & Dates */}
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span className="truncate">
                                {demand.from_department} → {demand.to_department}
                              </span>
                              <span className="flex items-center gap-1" title="Data de abertura">
                                <CalendarPlus className="h-3 w-3" />
                                {format(new Date(demand.created_at), 'dd/MM', { locale: ptBR })}
                              </span>
                              {demand.deadline && (
                                <span className="flex items-center gap-1" title="Prazo">
                                  <Calendar className="h-3 w-3" />
                                  {format(parseDateOnly(demand.deadline), 'dd/MM', { locale: ptBR })}
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
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default DemandListView;
