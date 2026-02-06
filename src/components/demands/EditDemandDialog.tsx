import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DemandRichTextEditor from './DemandRichTextEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Demand } from '@/pages/PedidosDemanda';

interface EditDemandDialogProps {
  demand: Demand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Colaborador {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const departments = [
  'Marketing',
  'Implantação',
  'Consultoras',
  'Pure Store',
  'Academy',
  'Financeiro/Jurídico',
  'Comercial',
  'Parceiros externos',
];

const EditDemandDialog = ({ demand, open, onOpenChange, onSuccess }: EditDemandDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fromDepartment, setFromDepartment] = useState('');
  const [toDepartment, setToDepartment] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [selectedAssignees, setSelectedAssignees] = useState<Colaborador[]>([]);

  // Load demand data
  useEffect(() => {
    if (demand && open) {
      setTitle(demand.title);
      setDescription(demand.description || '');
      setFromDepartment(demand.from_department);
      setToDepartment(demand.to_department);
      setPriority(demand.priority);
      setDeadline(demand.deadline ? new Date(demand.deadline) : undefined);
      
      // Load assignees
      const assignees = demand.assignees?.map(a => ({
        user_id: a.user_id,
        full_name: a.profile?.full_name || null,
        avatar_url: a.profile?.avatar_url || null,
      })) || [];
      setSelectedAssignees(assignees);
    }
  }, [demand, open]);

  // Fetch colaboradores
  useEffect(() => {
    const fetchColaboradores = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .eq('user_type', 'colaborador');

      if (!error && data) {
        setColaboradores(data);
      }
    };

    if (open) {
      fetchColaboradores();
    }
  }, [open]);

  const toggleAssignee = (colaborador: Colaborador) => {
    setSelectedAssignees(prev => {
      const exists = prev.find(a => a.user_id === colaborador.user_id);
      if (exists) {
        return prev.filter(a => a.user_id !== colaborador.user_id);
      }
      return [...prev, colaborador];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!demand || !title.trim() || !fromDepartment || !toDepartment) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o briefing e os departamentos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Update demand
      const { error: demandError } = await supabase
        .from('demands')
        .update({
          title,
          description,
          from_department: fromDepartment,
          to_department: toDepartment,
          priority,
          deadline: deadline ? format(deadline, 'yyyy-MM-dd') : null,
        })
        .eq('id', demand.id);

      if (demandError) throw demandError;

      // Update assignees - delete existing and insert new
      await supabase
        .from('demand_assignees')
        .delete()
        .eq('demand_id', demand.id);

      if (selectedAssignees.length > 0) {
        const assigneesData = selectedAssignees.map(a => ({
          demand_id: demand.id,
          user_id: a.user_id,
        }));

        const { error: assigneesError } = await supabase
          .from('demand_assignees')
          .insert(assigneesData);

        if (assigneesError) throw assigneesError;
      }

      toast({
        title: "Demanda atualizada",
        description: "A demanda foi atualizada com sucesso."
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error updating demand:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar demanda",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!demand) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Demanda</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title / Briefing */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descreva brevemente a demanda..."
              required
            />
          </div>

          {/* Description with rich text editor */}
          <div className="space-y-2">
            <Label>Descrição Detalhada</Label>
            <DemandRichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Descreva a demanda em detalhes... Use @ para mencionar alguém"
              minHeight="100px"
            />
          </div>

          {/* Departments */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>De (Departamento) *</Label>
              <Select value={fromDepartment} onValueChange={setFromDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Para (Departamento) *</Label>
              <Select value={toDepartment} onValueChange={setToDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority & Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <Label>Responsáveis</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedAssignees.map((assignee) => (
                <Badge key={assignee.user_id} variant="secondary" className="gap-1 pr-1">
                  {assignee.full_name || 'Usuário'}
                  <button
                    type="button"
                    onClick={() => toggleAssignee(assignee)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="border rounded-lg max-h-32 overflow-y-auto">
              {colaboradores.map((colaborador) => (
                <div
                  key={colaborador.user_id}
                  className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-muted transition-colors ${
                    selectedAssignees.find(a => a.user_id === colaborador.user_id) ? 'bg-primary/10' : ''
                  }`}
                  onClick={() => toggleAssignee(colaborador)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={colaborador.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {colaborador.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{colaborador.full_name || 'Usuário'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDemandDialog;
