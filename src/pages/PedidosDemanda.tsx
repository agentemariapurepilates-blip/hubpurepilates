import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, List, LayoutGrid, Search, User } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import DemandListView from '@/components/demands/DemandListView';
import DemandKanbanView from '@/components/demands/DemandKanbanView';
import DepartmentSelector from '@/components/demands/DepartmentSelector';
import CreateDemandDialog from '@/components/demands/CreateDemandDialog';
import DemandDetailsDialog from '@/components/demands/DemandDetailsDialog';
import EditDemandDialog from '@/components/demands/EditDemandDialog';

export interface Demand {
  id: string;
  title: string;
  description: string | null;
  from_department: string;
  to_department: string;
  status: 'pending' | 'in_approval' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  deadline: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  assignees?: {
    user_id: string;
    profile?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  }[];
}

const PedidosDemanda = () => {
  const { user, isColaborador, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  // Redirect non-colaboradores
  useEffect(() => {
    if (user && !isColaborador && !isAdmin) {
      navigate('/');
      toast({
        title: "Acesso negado",
        description: "Apenas colaboradores podem acessar esta área.",
        variant: "destructive"
      });
    }
  }, [user, isColaborador, isAdmin, navigate]);

  const fetchDemands = async () => {
    try {
      const { data: demandsData, error: demandsError } = await supabase
        .from('demands')
        .select('*')
        .order('created_at', { ascending: true });

      if (demandsError) throw demandsError;

      // Fetch creator profiles
      const creatorIds = [...new Set(demandsData?.map(d => d.created_by) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', creatorIds);

      // Fetch assignees
      const demandIds = demandsData?.map(d => d.id) || [];
      const { data: assigneesData } = await supabase
        .from('demand_assignees')
        .select('demand_id, user_id')
        .in('demand_id', demandIds);

      const assigneeUserIds = [...new Set(assigneesData?.map(a => a.user_id) || [])];
      const { data: assigneeProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', assigneeUserIds);

      const demandsWithData = demandsData?.map(demand => ({
        ...demand,
        creator_profile: profiles?.find(p => p.user_id === demand.created_by),
        assignees: assigneesData
          ?.filter(a => a.demand_id === demand.id)
          .map(a => ({
            user_id: a.user_id,
            profile: assigneeProfiles?.find(p => p.user_id === a.user_id)
          }))
      })) as Demand[];

      setDemands(demandsWithData || []);
    } catch (error) {
      console.error('Error fetching demands:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar demandas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemands();

    // Setup realtime subscription
    const channel = supabase
      .channel('demands-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demands' }, () => {
        fetchDemands();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate demand counts by department
  const demandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    demands.forEach(d => {
      counts[d.to_department] = (counts[d.to_department] || 0) + 1;
    });
    return counts;
  }, [demands]);

  // Filter demands by department and search
  const filteredDemands = useMemo(() => {
    return demands.filter(d => {
      // Filter by "my demands"
      if (showOnlyMine && user) {
        const isCreator = d.created_by === user.id;
        const isAssignee = d.assignees?.some(a => a.user_id === user.id);
        if (!isCreator && !isAssignee) return false;
      }
      // Filter by department
      if (selectedDepartment !== 'all' && d.to_department !== selectedDepartment) {
        return false;
      }
      // Filter by search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          d.title.toLowerCase().includes(searchLower) ||
          d.description?.toLowerCase().includes(searchLower) ||
          d.from_department.toLowerCase().includes(searchLower) ||
          d.to_department.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [demands, selectedDepartment, searchTerm, showOnlyMine, user]);

  const handleDemandClick = (demand: Demand) => {
    setSelectedDemand(demand);
    setDetailsOpen(true);
  };

  const handleStatusChange = async (demandId: string, newStatus: Demand['status']) => {
    try {
      const { error } = await supabase
        .from('demands')
        .update({ status: newStatus })
        .eq('id', demandId);

      if (error) throw error;

      setDemands(prev => prev.map(d => 
        d.id === demandId ? { ...d, status: newStatus } : d
      ));

      toast({
        title: "Status atualizado",
        description: "O status da demanda foi atualizado com sucesso."
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive"
      });
    }
  };

  if (!isColaborador && !isAdmin) {
    return null;
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        {/* Mobile-first Header */}
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold">Solicitação de Demandas</h1>
            <Button 
              onClick={() => setIsCreateOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Demanda</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>

          {/* My Demands Filter */}
          <Toggle
            pressed={showOnlyMine}
            onPressedChange={setShowOnlyMine}
            variant="outline"
            className="gap-2 w-full justify-center data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <User className="h-4 w-4" />
            Minhas Demandas
          </Toggle>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar demandas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Department Selector */}
          <DepartmentSelector
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
            demandCounts={demandCounts}
          />
          
          {/* View Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'kanban')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="kanban" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Quadro
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : viewMode === 'list' ? (
          <DemandListView 
            demands={filteredDemands} 
            onDemandClick={handleDemandClick}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <DemandKanbanView 
            demands={filteredDemands} 
            onDemandClick={handleDemandClick}
            onStatusChange={handleStatusChange}
          />
        )}

        {/* Create Dialog */}
        <CreateDemandDialog 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen}
          onSuccess={() => {
            fetchDemands();
            setIsCreateOpen(false);
          }}
        />

        {/* Details Dialog */}
        <DemandDetailsDialog
          demand={selectedDemand}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onUpdate={fetchDemands}
          onEditClick={() => {
            setDetailsOpen(false);
            setEditOpen(true);
          }}
        />

        {/* Edit Dialog */}
        <EditDemandDialog
          demand={selectedDemand}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={() => {
            fetchDemands();
            setEditOpen(false);
          }}
        />
      </div>
    </MainLayout>
  );
};

export default PedidosDemanda;
