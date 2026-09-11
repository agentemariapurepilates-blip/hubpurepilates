import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { ChevronDown, ChevronRight, MessageCircle, MoreHorizontal, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Demand } from '@/features/colaborador/demandas/PedidosDemanda';
import { groupsOf, type DemandGroup } from './demandGroups';
import { getDeadlineStatus, parseDateOnly, priorityConfig } from './demandHelpers';
import { BOARD_AREAS } from './DemandBoardSidebar';
import { flagsFor, useDemandLabels, type LabelKind } from './demandLabels';
import { LabelSelect } from './LabelSelect';
import { BoardColumnsMenu } from './BoardColumnsMenu';

interface DemandListViewProps {
  /** Já filtradas por setor, busca e "Minhas". */
  demands: Demand[];
  /** Todos os grupos, de todos os setores. */
  groups: DemandGroup[];
  /** 'all' ou o nome do setor. */
  selectedDepartment: string;
  commentCounts: Record<string, number>;
  /** Grupos com ao menos uma demanda, considerando todas — não só as filtradas. */
  usedGroupIds: Set<string>;
  onDemandClick: (demand: Demand) => void;
  onAddDemand: (department: string, groupId: string | null) => void;
  onCreateGroup: (department: string) => void;
  onRenameGroup: (groupId: string, name: string) => Promise<void>;
  onDeleteGroup: (group: DemandGroup) => void;
}

const SEM_GRUPO_COR = '#C4C4C4';
const TITULO_COLUNA: Record<LabelKind, string> = { status: 'Status', frente: 'Frente' };

/** Colunas de etiqueta ligadas no setor, na ordem da tabela. */
const colunasDeEtiqueta = (flags: ReturnType<typeof flagsFor>): LabelKind[] => [
  ...(flags.show_status_labels ? (['status'] as const) : []),
  ...(flags.show_frente ? (['frente'] as const) : []),
];

// Tarefa | comentários | pessoa | [status] | [frente] | prioridade | prazo | "+".
// Inline em vez de classe: o número de colunas muda por setor, e o Tailwind só
// gera classes que existem escritas no código.
const gridDaTabela = (etiquetas: LabelKind[]) =>
  ['minmax(0,1fr)', '52px', '104px', ...etiquetas.map(() => '136px'), '96px', '84px', '40px'].join(' ');
const larguraMinima = (etiquetas: LabelKind[]) => 600 + etiquetas.length * 136;

/** Os grupos que vieram de Concluído e Cancelado começam recolhidos: são os que mais acumulam. */
const comecaRecolhido = (grupo: DemandGroup | null) =>
  grupo?.legacy_status === 'completed' || grupo?.legacy_status === 'cancelled';

const LinhaDemanda = ({
  demand,
  pausado,
  comentarios,
  etiquetas,
  template,
  onClick,
}: {
  demand: Demand;
  pausado: boolean;
  comentarios: number;
  etiquetas: LabelKind[];
  template: string;
  onClick: () => void;
}) => {
  const api = useDemandLabels();
  const prazo = getDeadlineStatus(demand.deadline, pausado);
  const prioridade = priorityConfig[demand.priority];
  const pessoas = demand.assignees ?? [];
  const primeira = pessoas[0];

  // A linha é uma div (não um botão) porque as células de etiqueta são clicáveis
  // por conta própria. O título é o botão acessível por teclado.
  return (
    <div
      onClick={onClick}
      className="group/linha grid min-h-[38px] cursor-pointer border-t text-sm transition-colors hover:bg-muted/40"
      style={{ gridTemplateColumns: template }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="flex items-center truncate px-3 py-2 text-left"
      >
        <span className="truncate">{demand.title}</span>
      </button>

      <span className="flex items-center justify-center border-l" title={`${comentarios} comentário(s)`}>
        <span className="relative inline-flex">
          <MessageCircle className={cn('h-4 w-4', comentarios ? 'text-foreground/70' : 'text-muted-foreground/40')} />
          {comentarios > 0 && (
            <span className="absolute -bottom-1.5 -right-2 min-w-[14px] rounded-full bg-foreground/75 px-1 text-center text-[9px] font-semibold leading-[14px] text-background">
              {comentarios}
            </span>
          )}
        </span>
      </span>

      <span className="flex items-center justify-center border-l">
        {primeira ? (
          <span className="flex -space-x-1.5">
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarImage src={primeira.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-[10px]">{primeira.profile?.full_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            {pessoas.length > 1 && (
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full border-2 border-background bg-foreground/80 px-1 text-[10px] font-semibold text-background">
                +{pessoas.length - 1}
              </span>
            )}
          </span>
        ) : (
          <Users className="h-4 w-4 text-muted-foreground/40" />
        )}
      </span>

      {etiquetas.map((kind) => (
        <div key={kind} className="border-l" onClick={(e) => e.stopPropagation()}>
          <LabelSelect
            variant="cell"
            kind={kind}
            department={demand.to_department}
            selectedId={kind === 'status' ? demand.status_label_id : demand.frente_label_id}
            onSelect={(id) => api.definir(demand.id, kind, id)}
          />
        </div>
      ))}

      <span className={cn('flex items-center justify-center border-l text-xs font-medium', prioridade.color)}>
        {prioridade.label}
      </span>

      <span
        className={cn(
          'flex items-center justify-center border-l text-xs tabular-nums',
          prazo?.label === 'Atrasada'
            ? 'font-semibold text-red-600'
            : prazo?.label === 'Atenção'
              ? 'font-semibold text-amber-600'
              : 'text-muted-foreground',
        )}
        title={prazo?.label}
      >
        {demand.deadline ? format(parseDateOnly(demand.deadline), 'MMM d', { locale: ptBR }) : '—'}
      </span>

      <span className="border-l" />
    </div>
  );
};

const BlocoGrupo = ({
  group,
  department,
  demands,
  commentCounts,
  podeExcluir,
  etiquetas,
  onDemandClick,
  onAddDemand,
  onRenameGroup,
  onDeleteGroup,
}: {
  /** null = "Sem grupo". */
  group: DemandGroup | null;
  department: string;
  demands: Demand[];
  commentCounts: Record<string, number>;
  podeExcluir: boolean;
  etiquetas: LabelKind[];
  onDemandClick: (demand: Demand) => void;
  onAddDemand: (department: string, groupId: string | null) => void;
  onRenameGroup: (groupId: string, name: string) => Promise<void>;
  onDeleteGroup: (group: DemandGroup) => void;
}) => {
  const [aberto, setAberto] = useState(!comecaRecolhido(group));
  const [renomeando, setRenomeando] = useState(false);
  const [nome, setNome] = useState(group?.name ?? '');
  const cor = group?.color ?? SEM_GRUPO_COR;
  const template = gridDaTabela(etiquetas);

  const salvarNome = async () => {
    const novo = nome.trim();
    setRenomeando(false);
    if (!group || !novo || novo === group.name) {
      setNome(group?.name ?? '');
      return;
    }
    await onRenameGroup(group.id, novo);
  };

  return (
    <section className="space-y-1.5">
      <div className="group/cab flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-label={aberto ? 'Recolher grupo' : 'Expandir grupo'}
          className="rounded p-0.5 hover:bg-muted"
        >
          {aberto ? (
            <ChevronDown className="h-4 w-4" style={{ color: cor }} />
          ) : (
            <ChevronRight className="h-4 w-4" style={{ color: cor }} />
          )}
        </button>

        {renomeando ? (
          <Input
            autoFocus
            value={nome}
            maxLength={60}
            onChange={(e) => setNome(e.target.value)}
            onBlur={salvarNome}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                setNome(group?.name ?? '');
                setRenomeando(false);
              }
            }}
            className="h-7 w-56 text-sm font-semibold"
          />
        ) : (
          <h3 className="text-sm font-semibold" style={{ color: cor }}>
            {group?.name ?? 'Sem grupo'}
          </h3>
        )}

        <span className="text-xs tabular-nums text-muted-foreground">{demands.length}</span>

        {group && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Opções do grupo"
                className="ml-1 rounded p-1 text-muted-foreground opacity-0 hover:bg-muted focus:opacity-100 group-hover/cab:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            {/* Sem devolver o foco ao botão: senão o campo de renomear perde o foco e fecha na hora. */}
            <DropdownMenuContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuItem
                onSelect={() => {
                  setNome(group.name);
                  setRenomeando(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!podeExcluir}
                onSelect={() => onDeleteGroup(group)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {podeExcluir ? 'Excluir grupo' : 'Excluir (mova as tarefas antes)'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {aberto && (
        <div className="overflow-x-auto rounded-md border" style={{ borderLeft: `4px solid ${cor}` }}>
          <div style={{ minWidth: larguraMinima(etiquetas) }}>
            <div className="grid bg-muted/30 text-xs text-muted-foreground" style={{ gridTemplateColumns: template }}>
              <span className="px-3 py-1.5">Tarefa</span>
              <span className="border-l" />
              <span className="flex items-center justify-center border-l">Pessoa</span>
              {etiquetas.map((kind) => (
                <span key={kind} className="flex items-center justify-center border-l">
                  {TITULO_COLUNA[kind]}
                </span>
              ))}
              <span className="flex items-center justify-center border-l">Prioridade</span>
              <span className="flex items-center justify-center border-l">Prazo</span>
              <span className="border-l">
                <BoardColumnsMenu department={department} />
              </span>
            </div>

            {demands.map((demand) => (
              <LinhaDemanda
                key={demand.id}
                demand={demand}
                pausado={group?.pauses_deadline ?? false}
                comentarios={commentCounts[demand.id] ?? 0}
                etiquetas={etiquetas}
                template={template}
                onClick={() => onDemandClick(demand)}
              />
            ))}

            <button
              type="button"
              onClick={() => onAddDemand(department, group?.id ?? null)}
              className="flex w-full items-center gap-1.5 border-t px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar tarefa
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

const SecaoArea = ({
  area,
  emTodos,
  props,
}: {
  area: string;
  /** Em "Ver todos os setores" o setor vira uma seção recolhível com título. */
  emTodos: boolean;
  props: DemandListViewProps;
}) => {
  const api = useDemandLabels();
  const [aberta, setAberta] = useState(true);
  const grupos = groupsOf(props.groups, area);
  const idsDosGrupos = new Set(grupos.map((g) => g.id));
  const daArea = props.demands.filter((d) => d.to_department === area);
  // Sem grupo, ou apontando para grupo de outro setor (o setor mudou na edição).
  const semGrupo = daArea.filter((d) => !d.group_id || !idsDosGrupos.has(d.group_id));
  // Em "Ver todos" só os grupos com tarefa; dentro do setor, todos — para dar para adicionar nos vazios.
  const visiveis = emTodos ? grupos.filter((g) => daArea.some((d) => d.group_id === g.id)) : grupos;
  const etiquetas = colunasDeEtiqueta(flagsFor(api.settings, area));

  const blocoComum = {
    department: area,
    commentCounts: props.commentCounts,
    etiquetas,
    onDemandClick: props.onDemandClick,
    onAddDemand: props.onAddDemand,
    onRenameGroup: props.onRenameGroup,
    onDeleteGroup: props.onDeleteGroup,
  };

  const conteudo =
    !emTodos && grupos.length === 0 && semGrupo.length === 0 ? (
      <Card className="space-y-3 p-8 text-center">
        <p className="font-medium">{area} ainda não tem grupos</p>
        <p className="text-sm text-muted-foreground">Crie o primeiro grupo e comece a adicionar as tarefas.</p>
        <Button size="sm" onClick={() => props.onCreateGroup(area)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Criar grupo
        </Button>
      </Card>
    ) : (
      <div className="space-y-5">
        {visiveis.map((grupo) => (
          <BlocoGrupo
            key={grupo.id}
            group={grupo}
            demands={daArea.filter((d) => d.group_id === grupo.id)}
            podeExcluir={!props.usedGroupIds.has(grupo.id)}
            {...blocoComum}
          />
        ))}
        {semGrupo.length > 0 && (
          <BlocoGrupo key="sem-grupo" group={null} demands={semGrupo} podeExcluir={false} {...blocoComum} />
        )}
        {!emTodos && (
          <button
            type="button"
            onClick={() => props.onCreateGroup(area)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Adicionar grupo
          </button>
        )}
      </div>
    );

  if (!emTodos) return conteudo;

  return (
    <section>
      <button type="button" onClick={() => setAberta((v) => !v)} className="mb-3 flex items-center gap-2">
        {aberta ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <h2 className="text-base font-bold">{area}</h2>
        <span className="text-xs tabular-nums text-muted-foreground">{daArea.length}</span>
      </button>
      {aberta && conteudo}
    </section>
  );
};

const ordemDaArea = (area: string) => {
  const i = BOARD_AREAS.indexOf(area);
  return i === -1 ? BOARD_AREAS.length : i;
};

const DemandListView = (props: DemandListViewProps) => {
  const emTodos = props.selectedDepartment === 'all';

  if (emTodos && props.demands.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
      </Card>
    );
  }

  const areas = emTodos
    ? [...new Set(props.demands.map((d) => d.to_department))].sort(
        (a, b) => ordemDaArea(a) - ordemDaArea(b) || a.localeCompare(b),
      )
    : [props.selectedDepartment];

  return (
    <div className="space-y-8">
      {areas.map((area) => (
        <SecaoArea key={area} area={area} emTodos={emTodos} props={props} />
      ))}
    </div>
  );
};

export default DemandListView;
