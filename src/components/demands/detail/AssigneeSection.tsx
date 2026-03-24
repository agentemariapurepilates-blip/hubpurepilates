import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, UserPlus, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Colaborador } from '@/hooks/useColaboradores';
import type { Demand } from '@/pages/PedidosDemanda';

interface AssigneeSectionProps {
  demand: Demand;
  colaboradores: Colaborador[];
  canManage: boolean;
  onUpdate: () => void;
}

export function AssigneeSection({ demand, colaboradores, canManage, onUpdate }: AssigneeSectionProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleAssignee = async (colaborador: Colaborador) => {
    setLoading(true);
    try {
      const isAssigned = demand.assignees?.some(a => a.user_id === colaborador.user_id);
      if (isAssigned) {
        const { error } = await supabase
          .from('demand_assignees')
          .delete()
          .eq('demand_id', demand.id)
          .eq('user_id', colaborador.user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('demand_assignees')
          .insert({ demand_id: demand.id, user_id: colaborador.user_id });
        if (error) throw error;
      }
      onUpdate();
      toast({ title: isAssigned ? "Responsável removido" : "Responsável adicionado" });
    } catch (error) {
      console.error('Error toggling assignee:', error);
      toast({ title: "Erro", description: "Erro ao atualizar responsável", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <Users className="h-4 w-4 text-muted-foreground mt-1" />
      <div className="flex-1">
        <div className="flex flex-wrap gap-1 mb-1">
          {demand.assignees?.map((assignee) => (
            <Badge key={assignee.user_id} variant="secondary" className="gap-1 pr-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={assignee.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[8px]">
                  {assignee.profile?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              {assignee.profile?.full_name || 'Usuário'}
              {canManage && (
                <button
                  onClick={() => handleToggleAssignee({ user_id: assignee.user_id, full_name: assignee.profile?.full_name || null, avatar_url: assignee.profile?.avatar_url || null })}
                  disabled={loading}
                  className="ml-0.5 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {(!demand.assignees || demand.assignees.length === 0) && (
            <span className="text-sm text-muted-foreground">Nenhum responsável</span>
          )}
        </div>
        {canManage && (
          <Popover open={showPopover} onOpenChange={setShowPopover}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <UserPlus className="h-3 w-3" />
                Adicionar responsável
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {colaboradores.map((colab) => {
                  const isAssigned = demand.assignees?.some(a => a.user_id === colab.user_id);
                  return (
                    <button
                      key={colab.user_id}
                      onClick={() => handleToggleAssignee(colab)}
                      disabled={loading}
                      className={`flex items-center gap-2 w-full p-2 rounded text-sm hover:bg-muted transition-colors ${isAssigned ? 'bg-primary/10' : ''}`}
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={colab.avatar_url || undefined} />
                        <AvatarFallback className="text-[8px]">{colab.full_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-left truncate">{colab.full_name || 'Usuário'}</span>
                      {isAssigned && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
