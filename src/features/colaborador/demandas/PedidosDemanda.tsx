import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, ChevronDown, FolderPlus, LayoutGrid, List, Plus, Search, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import DemandListView from '@/components/demands/DemandListView';
import DemandKanbanView from '@/components/demands/DemandKanbanView';
import DemandBoardSidebar, { BOARD_AREAS, MINHA_AREA } from '@/components/demands/DemandBoardSidebar';
import MinhaAreaDeTrabalho, { estaConcluida } from '@/components/demands/MinhaAreaDeTrabalho';
import { compararPorPrazo } from '@/components/demands/demandHelpers';
import CreateDemandDialog from '@/components/demands/CreateDemandDialog';
import CreateGroupDialog from '@/components/demands/CreateGroupDialog';
import DemandDetailsDialog from '@/components/demands/DemandDetailsDialog';
import EditDemandDialog from '@/components/demands/EditDemandDialog';
import {
  createDemandGroup,
  deleteDemandGroup,
  fetchDemandGroups,
  groupsOf,
  renameDemandGroup,
  type DemandGroup,
} from '@/components/demands/demandGroups';
import {
  DemandLabelsContext,
  createLabel,
  deleteLabel,
  fetchBoardSettings,
  fetchLabels,
  saveBoardFlag,
  updateLabel,
  type BoardFlag,
  type BoardSettings,
  type DemandLabel,
  type DemandLabelsApi,
  type LabelKind,
} from '@/components/demands/demandLabels';

export interface Demand {
  id: string;
  title: string;
  description: string | null;
  from_department: string;
  to_department: string;
  status: 'pending' | 'in_progress' | 'missing_info' | 'in_approval' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  /** Grupo da área em que a demanda está. Nulo = "Sem grupo". */
  group_id: string | null;
  /** Etiquetas coloridas: Status por etiqueta (do setor) e Frente de negócio. */
  status_label_id: string | null;
  frente_label_id: string | null;
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

/**
 * Comentários por demanda. Busca paginada: o Supabase devolve no máximo 1000
 * linhas por chamada, e os comentários da rede passam disso — sem paginar a
 * contagem sairia cortada sem aviso.
 */
async function contarComentarios(): Promise<Record<string, number>> {
  const PAGINA = 1000;
  const contagem: Record<string, number> = {};
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabase
      .from('demand_comments')
      .select('demand_id')
      .order('id')
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw error;
    for (const c of data ?? []) contagem[c.demand_id] = (contagem[c.demand_id] ?? 0) + 1;
    if (!data || data.length < PAGINA) break;
  }
  return contagem;
}

/** A pessoa abriu a demanda ou está entre os responsáveis. */
const ehDaPessoa = (d: Demand, userId: string) =>
  d.created_by === userId || Boolean(d.assignees?.some((a) => a.user_id === userId));

const PedidosDemanda = () => {
  const { user, isColaborador, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [demands, setDemands] = useState<Demand[]>([]);
  const [groups, setGroups] = useState<DemandGroup[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<{ toDepartment?: string; groupId?: string | null }>({});
  const [groupDialog, setGroupDialog] = useState<{ open: boolean; area: string | null }>({ open: false, area: null });
  const [groupToDelete, setGroupToDelete] = useState<DemandGroup | null>(null);
  // A tabela de grupos ainda não existe no banco (migração pendente).
  const [gruposAusentes, setGruposAusentes] = useState(false);
  const [labels, setLabels] = useState<DemandLabel[]>([]);
  const [boardSettings, setBoardSettings] = useState<BoardSettings[]>([]);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  // Abre direto no primeiro setor (Marketing); "Ver todos os setores" fica no fim da lateral.
  const [selectedDepartment, setSelectedDepartment] = useState<string>(BOARD_AREAS[0]);
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

  const carregarGrupos = async () => {
    try {
      setGroups(await fetchDemandGroups());
      setGruposAusentes(false);
    } catch (error) {
      // Sem a migração de grupos aplicada a tabela não existe (PGRST205). A tela
      // segue funcionando, com tudo em "Sem grupo", e avisa: sem o aviso parece
      // que os status sumiram.
      if ((error as { code?: string })?.code === 'PGRST205') setGruposAusentes(true);
      console.error('Error fetching demand groups:', error);
    }
  };

  const carregarComentarios = async () => {
    try {
      setCommentCounts(await contarComentarios());
    } catch (error) {
      console.error('Error counting comments:', error);
    }
  };

  const carregarEtiquetas = async () => {
    try {
      const [etiquetas, configuracoes] = await Promise.all([fetchLabels(), fetchBoardSettings()]);
      setLabels(etiquetas);
      setBoardSettings(configuracoes);
    } catch (error) {
      // Sem a migração das etiquetas as tabelas não existem; a lista segue sem essas colunas.
      console.error('Error fetching labels:', error);
    }
  };

  const fetchDemands = async () => {
    try {
      const { data: demandsData, error: demandsError } = await supabase
        .from('demands')
        .select('*')
        .order('created_at', { ascending: false });

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
        group_id: demand.group_id ?? null,
        status_label_id: demand.status_label_id ?? null,
        frente_label_id: demand.frente_label_id ?? null,
        creator_profile: profiles?.find(p => p.user_id === demand.created_by),
        assignees: assigneesData
          ?.filter(a => a.demand_id === demand.id)
          .map(a => ({
            user_id: a.user_id,
            profile: assigneeProfiles?.find(p => p.user_id === a.user_id)
          }))
      })) as Demand[];

      setDemands(demandsWithData || []);
      await carregarComentarios();
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
    carregarGrupos();
    carregarEtiquetas();

    // Setup realtime subscription with debounce to avoid cascading refetches
    let debounceTimer: ReturnType<typeof setTimeout>;
    let debounceGrupos: ReturnType<typeof setTimeout>;
    let debounceEtiquetas: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel('demands-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demands' }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fetchDemands(), 1000);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demand_groups' }, () => {
        clearTimeout(debounceGrupos);
        debounceGrupos = setTimeout(() => carregarGrupos(), 500);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demand_labels' }, () => {
        clearTimeout(debounceEtiquetas);
        debounceEtiquetas = setTimeout(() => carregarEtiquetas(), 500);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demand_board_settings' }, () => {
        clearTimeout(debounceEtiquetas);
        debounceEtiquetas = setTimeout(() => carregarEtiquetas(), 500);
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      clearTimeout(debounceGrupos);
      clearTimeout(debounceEtiquetas);
      supabase.removeChannel(channel);
    };
  }, []);

  // Contagem por área, sobre todas as demandas (não só as filtradas)
  const demandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    demands.forEach(d => {
      counts[d.to_department] = (counts[d.to_department] || 0) + 1;
    });
    return counts;
  }, [demands]);

  const extraAreas = useMemo(
    () => Object.keys(demandCounts).filter((a) => !BOARD_AREAS.includes(a)).sort(),
    [demandCounts],
  );
  const todasAreas = useMemo(() => [...BOARD_AREAS, ...extraAreas], [extraAreas]);

  // Grupos em uso por qualquer demanda: não podem ser excluídos
  const usedGroupIds = useMemo(
    () => new Set(demands.map((d) => d.group_id).filter((id): id is string => Boolean(id))),
    [demands],
  );

  const gruposPorId = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);
  // Número ao lado de "Minha área de trabalho": só as tarefas em aberto.
  const minhaAreaCount = useMemo(
    () => (user ? demands.filter((d) => ehDaPessoa(d, user.id) && !estaConcluida(d, gruposPorId)).length : 0),
    [demands, gruposPorId, user],
  );

  const emMinhaArea = selectedDepartment === MINHA_AREA;
  const areaAtual = selectedDepartment === 'all' || emMinhaArea ? null : selectedDepartment;
  const gruposDaArea = useMemo(() => (areaAtual ? groupsOf(groups, areaAtual) : []), [groups, areaAtual]);
  // No "Todos" cada área tem grupos diferentes, então não há colunas comuns para o Kanban.
  const kanbanDisponivel = areaAtual !== null;

  // Filtra por setor, pessoa e busca. Ordena pelo prazo (vence antes, aparece antes): vale para a lista e o Kanban.
  const filteredDemands = useMemo(() => {
    return demands.filter(d => {
      // "Minhas" e a Minha área de trabalho: quem abriu ou está como responsável
      if ((showOnlyMine || emMinhaArea) && user && !ehDaPessoa(d, user.id)) return false;
      // Filter by department
      if (areaAtual && d.to_department !== areaAtual) {
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
    }).sort(compararPorPrazo);
  }, [demands, selectedDepartment, searchTerm, showOnlyMine, user]);

  // Link de demanda (/pedidos-demanda?demanda=<id>): abre essa demanda assim que a lista carrega.
  const demandaDaUrl = searchParams.get('demanda');
  useEffect(() => {
    if (!demandaDaUrl || loading) return;
    if (detailsOpen && selectedDemand?.id === demandaDaUrl) return;
    const alvo = demands.find((d) => d.id === demandaDaUrl);
    if (alvo) {
      setSelectedDemand(alvo);
      setDetailsOpen(true);
    } else {
      toast({
        title: "Demanda não encontrada",
        description: "O link aponta para uma demanda que não existe mais.",
        variant: "destructive",
      });
      setSearchParams({}, { replace: true });
    }
  }, [demandaDaUrl, demands, loading]);

  // Keep selectedDemand in sync with latest data
  useEffect(() => {
    if (selectedDemand) {
      const updated = demands.find(d => d.id === selectedDemand.id);
      if (updated && updated !== selectedDemand) {
        setSelectedDemand(updated);
      }
    }
  }, [demands]);

  /** Abrir uma demanda põe o id na URL: é esse endereço que a pessoa copia e manda para o colega. */
  const handleDemandClick = (demand: Demand) => {
    setSelectedDemand(demand);
    setDetailsOpen(true);
    setSearchParams({ demanda: demand.id });
  };

  const fecharDetalhes = (open: boolean) => {
    setDetailsOpen(open);
    if (!open && searchParams.has('demanda')) setSearchParams({}, { replace: true });
  };

  const abrirNovaDemanda = (department?: string, groupId?: string | null) => {
    setCreateDefaults({ toDepartment: department, groupId });
    setIsCreateOpen(true);
  };

  const handleGroupChange = async (demandId: string, groupId: string | null) => {
    const grupo = groups.find((g) => g.id === groupId) ?? null;
    // Grupo que nasceu de um status leva o status junto: o que ainda lê `status` continua coerente.
    const patch = {
      group_id: groupId,
      ...(grupo?.legacy_status ? { status: grupo.legacy_status } : {}),
    };

    try {
      const { error } = await supabase.from('demands').update(patch).eq('id', demandId);
      if (error) throw error;

      setDemands(prev => prev.map(d => (d.id === demandId ? { ...d, ...patch } : d)));
      toast({
        title: "Demanda movida",
        description: grupo ? `Agora em "${grupo.name}".` : "Agora sem grupo.",
      });
    } catch (error) {
      console.error('Error moving demand:', error);
      toast({
        title: "Erro",
        description: "Erro ao mover a demanda",
        variant: "destructive"
      });
    }
  };

  const handleCreateGroup = async (area: string, name: string, color: string) => {
    const daArea = groupsOf(groups, area);
    const position = daArea.length ? Math.max(...daArea.map((g) => g.position)) + 1 : 0;
    try {
      const novo = await createDemandGroup({ department: area, name, color, position, createdBy: user?.id });
      setGroups(prev => [...prev, novo]);
      toast({ title: "Grupo criado", description: `"${name}" em ${area}.` });
    } catch (error) {
      console.error('Error creating group:', error);
      toast({ title: "Erro", description: "Erro ao criar o grupo", variant: "destructive" });
      throw error;
    }
  };

  const handleRenameGroup = async (groupId: string, name: string) => {
    try {
      await renameDemandGroup(groupId, name);
      setGroups(prev => prev.map((g) => (g.id === groupId ? { ...g, name } : g)));
      toast({ title: "Grupo renomeado" });
    } catch (error) {
      console.error('Error renaming group:', error);
      toast({ title: "Erro", description: "Erro ao renomear o grupo", variant: "destructive" });
    }
  };

  const handleDeleteGroup = (group: DemandGroup) => {
    if (usedGroupIds.has(group.id)) {
      toast({
        title: "O grupo tem demandas",
        description: "Mova as demandas para outro grupo antes de excluir.",
        variant: "destructive"
      });
      return;
    }
    setGroupToDelete(group);
  };

  const confirmarExclusaoDoGrupo = async () => {
    if (!groupToDelete) return;
    const alvo = groupToDelete;
    setGroupToDelete(null);
    try {
      await deleteDemandGroup(alvo.id);
      setGroups(prev => prev.filter((g) => g.id !== alvo.id));
      toast({ title: "Grupo excluído" });
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({ title: "Erro", description: "Erro ao excluir o grupo", variant: "destructive" });
    }
  };

  const labelApi: DemandLabelsApi = {
    labels,
    settings: boardSettings,
    criar: async (kind: LabelKind, department: string | null, name: string, color: string) => {
      const mesmas = labels.filter((l) => l.kind === kind && l.department === department);
      const position = mesmas.length ? Math.max(...mesmas.map((l) => l.position)) + 1 : 0;
      try {
        const nova = await createLabel({ kind, department, name, color, position, createdBy: user?.id });
        setLabels(prev => [...prev, nova]);
      } catch (error) {
        console.error('Error creating label:', error);
        toast({ title: "Erro", description: "Erro ao criar a etiqueta", variant: "destructive" });
      }
    },
    atualizar: async (id: string, patch: { name?: string; color?: string }) => {
      try {
        await updateLabel(id, patch);
        setLabels(prev => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
      } catch (error) {
        console.error('Error updating label:', error);
        toast({ title: "Erro", description: "Erro ao salvar a etiqueta", variant: "destructive" });
      }
    },
    excluir: async (label: DemandLabel) => {
      const emUso = demands.filter((d) =>
        label.kind === 'status' ? d.status_label_id === label.id : d.frente_label_id === label.id,
      ).length;
      if (emUso > 0 && !window.confirm(`Excluir "${label.name}"? Ela sai de ${emUso} ${emUso === 1 ? 'tarefa' : 'tarefas'}.`)) {
        return;
      }
      const limpar = label.kind === 'status' ? { status_label_id: null } : { frente_label_id: null };
      try {
        await deleteLabel(label.id);
        setLabels(prev => prev.filter((l) => l.id !== label.id));
        // O banco já tira a etiqueta das demandas (ON DELETE SET NULL); aqui só espelha.
        setDemands(prev => prev.map((d) =>
          (label.kind === 'status' ? d.status_label_id : d.frente_label_id) === label.id ? { ...d, ...limpar } : d,
        ));
      } catch (error) {
        console.error('Error deleting label:', error);
        toast({ title: "Erro", description: "Erro ao excluir a etiqueta", variant: "destructive" });
      }
    },
    definir: async (demandId: string, kind: LabelKind, labelId: string | null) => {
      const patch = kind === 'status' ? { status_label_id: labelId } : { frente_label_id: labelId };
      try {
        const { error } = await supabase.from('demands').update(patch).eq('id', demandId);
        if (error) throw error;
        setDemands(prev => prev.map((d) => (d.id === demandId ? { ...d, ...patch } : d)));
      } catch (error) {
        console.error('Error setting label:', error);
        toast({ title: "Erro", description: "Erro ao salvar a etiqueta", variant: "destructive" });
      }
    },
    alternar: async (department: string, flag: BoardFlag, value: boolean) => {
      try {
        const salvo = await saveBoardFlag(department, flag, value);
        setBoardSettings(prev => [...prev.filter((c) => c.department !== department), salvo]);
      } catch (error) {
        console.error('Error saving board columns:', error);
        toast({ title: "Erro", description: "Erro ao salvar as colunas do setor", variant: "destructive" });
      }
    },
  };

  if (!isColaborador && !isAdmin) {
    return null;
  }

  return (
    <DemandLabelsContext.Provider value={labelApi}>
    <MainLayout>
      {/* Largura toda, como os quadros do Monday: com limite e centralizado sobrava faixa vazia nas telas largas. */}
      <div className="px-2 sm:px-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <DemandBoardSidebar
            selected={selectedDepartment}
            onSelect={setSelectedDepartment}
            counts={demandCounts}
            extraAreas={extraAreas}
            minhaAreaCount={minhaAreaCount}
          />

          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Solicitação de Demandas
              </p>
              <h1 className="text-xl sm:text-2xl font-bold">
                {emMinhaArea ? 'Minha área de trabalho' : areaAtual ?? 'Todos os setores'}
              </h1>
            </div>

            {/* Barra de ferramentas */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex">
                <Button
                  size="sm"
                  className="h-9 gap-1.5 rounded-r-none"
                  onClick={() => abrirNovaDemanda(areaAtual ?? undefined)}
                >
                  <Plus className="h-4 w-4" />
                  Criar tarefa
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="h-9 rounded-l-none border-l border-primary-foreground/25 px-2"
                      aria-label="Mais opções de criação"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onSelect={() => setGroupDialog({ open: true, area: areaAtual })}>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Criar grupo de tarefas
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>

              {/* Na Minha área de trabalho já está tudo filtrado pela pessoa. */}
              {!emMinhaArea && (
                <Toggle
                  pressed={showOnlyMine}
                  onPressedChange={setShowOnlyMine}
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <User className="h-4 w-4" />
                  Minhas
                </Toggle>
              )}

              <Tabs
                value={kanbanDisponivel ? viewMode : 'list'}
                onValueChange={(v) => setViewMode(v as 'list' | 'kanban')}
                className="sm:ml-auto"
              >
                <TabsList className="h-9">
                  <TabsTrigger value="list" className="gap-1.5">
                    <List className="h-4 w-4" />
                    Lista
                  </TabsTrigger>
                  <TabsTrigger
                    value="kanban"
                    disabled={!kanbanDisponivel}
                    title={kanbanDisponivel ? undefined : 'Escolha um setor para ver o Kanban'}
                    className="gap-1.5"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Kanban
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {gruposAusentes && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Os grupos ainda não foram ativados no banco.</strong> Assim que a migração for
                  aplicada, cada área passa a mostrar os grupos Pendente, Em Andamento, Faltam Informações,
                  Em Aprovação, Concluído e Cancelado, com cada demanda no grupo do seu status. Até lá, elas
                  aparecem em “Sem grupo”.
                </AlertDescription>
              </Alert>
            )}

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : emMinhaArea ? (
              <MinhaAreaDeTrabalho
                demands={filteredDemands}
                groups={groups}
                commentCounts={commentCounts}
                onDemandClick={handleDemandClick}
              />
            ) : kanbanDisponivel && viewMode === 'kanban' ? (
              <DemandKanbanView
                demands={filteredDemands}
                groups={gruposDaArea}
                onDemandClick={handleDemandClick}
                onGroupChange={handleGroupChange}
              />
            ) : (
              <DemandListView
                demands={filteredDemands}
                groups={groups}
                selectedDepartment={selectedDepartment}
                commentCounts={commentCounts}
                usedGroupIds={usedGroupIds}
                onDemandClick={handleDemandClick}
                onAddDemand={abrirNovaDemanda}
                onCreateGroup={(area) => setGroupDialog({ open: true, area })}
                onRenameGroup={handleRenameGroup}
                onDeleteGroup={handleDeleteGroup}
              />
            )}
          </div>
        </div>

        {/* Create Dialog */}
        <CreateDemandDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          groups={groups}
          defaultToDepartment={createDefaults.toDepartment}
          defaultGroupId={createDefaults.groupId}
          onSuccess={() => {
            setIsCreateOpen(false);
            // Recarrega na hora em vez de esperar o realtime, que não está chegando.
            fetchDemands();
          }}
        />

        <CreateGroupDialog
          open={groupDialog.open}
          onOpenChange={(open) => setGroupDialog((g) => ({ ...g, open }))}
          areas={todasAreas}
          defaultArea={groupDialog.area}
          onCreate={handleCreateGroup}
        />

        {/* Details Dialog */}
        <DemandDetailsDialog
          demand={selectedDemand}
          open={detailsOpen}
          onOpenChange={fecharDetalhes}
          onUpdate={fetchDemands}
          groups={groups}
          onGroupChange={handleGroupChange}
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
          groups={groups}
          onSuccess={() => {
            fetchDemands();
            setEditOpen(false);
          }}
        />

        <AlertDialog open={groupToDelete !== null} onOpenChange={(open) => !open && setGroupToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir o grupo “{groupToDelete?.name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                O grupo está vazio. Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmarExclusaoDoGrupo}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
    </DemandLabelsContext.Provider>
  );
};

export default PedidosDemanda;
