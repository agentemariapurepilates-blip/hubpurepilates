import { useState } from 'react';
import { addDays, endOfWeek, format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { CalendarCheck, ChevronDown, ChevronRight, MessageCircle, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Demand } from '@/features/colaborador/demandas/PedidosDemanda';
import type { DemandGroup } from './demandGroups';
import { compararPorPrazo, getDeadlineStatus, parseDateOnly, priorityConfig } from './demandHelpers';
import { corDoTexto, flagsFor, useDemandLabels } from './demandLabels';

interface MinhaAreaDeTrabalhoProps {
  /** Já filtradas: só as da pessoa (abriu ou é responsável), e pela busca. */
  demands: Demand[];
  /** Todos os grupos, de todos os setores. */
  groups: DemandGroup[];
  commentCounts: Record<string, number>;
  onDemandClick: (demand: Demand) => void;
}

/** Concluída ou cancelada: pelo grupo em que a demanda está; sem grupo, pelo status antigo. */
export function estaConcluida(demand: Demand, gruposPorId: Map<string, DemandGroup>) {
  const grupo = demand.group_id ? gruposPorId.get(demand.group_id) : undefined;
  const status = grupo ? grupo.legacy_status : demand.status;
  return status === 'completed' || status === 'cancelled';
}

export interface FaixaDePrazo {
  titulo: string;
  cor: string;
  demandas: Demand[];
  concluidas?: boolean;
}

const dia = (d: Date) => format(d, 'yyyy-MM-dd');
// O prazo é só data ("2026-09-15"): comparar o texto evita erro de fuso.
const prazoDe = (d: Demand) => d.deadline?.slice(0, 10) ?? null;

/**
 * Separa em faixas de prazo, como o "Meu trabalho" do Monday. As concluídas vão
 * para a última faixa: sem isso, as antigas encheriam o topo como "atrasadas".
 */
export function separarPorPrazo(
  demandas: Demand[],
  gruposPorId: Map<string, DemandGroup>,
  agora = new Date(),
): FaixaDePrazo[] {
  const hoje = dia(agora);
  const fimDaSemana = endOfWeek(startOfDay(agora), { weekStartsOn: 1 });
  const ateDomingo = dia(fimDaSemana);
  const ateDomingoQueVem = dia(addDays(fimDaSemana, 7));

  const faixas = {
    atrasadas: { titulo: 'Atrasadas', cor: '#E2445C', demandas: [] as Demand[] },
    hoje: { titulo: 'Hoje', cor: '#00C875', demandas: [] as Demand[] },
    semana: { titulo: 'Esta semana', cor: '#579BFC', demandas: [] as Demand[] },
    proxima: { titulo: 'Próxima semana', cor: '#A25DDC', demandas: [] as Demand[] },
    depois: { titulo: 'Mais para frente', cor: '#FDAB3D', demandas: [] as Demand[] },
    semPrazo: { titulo: 'Sem prazo', cor: '#9D99B9', demandas: [] as Demand[] },
    concluidas: { titulo: 'Concluídas e canceladas', cor: '#7F7F7F', demandas: [] as Demand[], concluidas: true },
  };

  for (const d of [...demandas].sort(compararPorPrazo)) {
    const prazo = prazoDe(d);
    const faixa = estaConcluida(d, gruposPorId)
      ? faixas.concluidas
      : !prazo
        ? faixas.semPrazo
        : prazo < hoje
          ? faixas.atrasadas
          : prazo === hoje
            ? faixas.hoje
            : prazo <= ateDomingo
              ? faixas.semana
              : prazo <= ateDomingoQueVem
                ? faixas.proxima
                : faixas.depois;
    faixa.demandas.push(d);
  }
  return Object.values(faixas).filter((f) => f.demandas.length > 0);
}

// Tarefa | setor | status | comentários | pessoa | prioridade | prazo
const GRID = 'minmax(0,1fr) 128px 150px 52px 104px 96px 84px';

const Linha = ({
  demand,
  grupo,
  concluida,
  comentarios,
  onClick,
}: {
  demand: Demand;
  grupo: DemandGroup | undefined;
  concluida: boolean;
  comentarios: number;
  onClick: () => void;
}) => {
  const api = useDemandLabels();
  // Setor que usa Status por etiqueta (Gravações) mostra a etiqueta; os demais, o grupo, que é o status deles.
  const usaEtiqueta = flagsFor(api.settings, demand.to_department).show_status_labels;
  const etiqueta = usaEtiqueta ? api.labels.find((l) => l.id === demand.status_label_id) : undefined;
  const status = usaEtiqueta
    ? etiqueta && { nome: etiqueta.name, cor: etiqueta.color }
    : { nome: grupo?.name ?? 'Sem grupo', cor: grupo?.color ?? '#C4C4C4' };
  // Concluída não está atrasada: sem o destaque vermelho no prazo.
  const prazo = concluida ? null : getDeadlineStatus(demand.deadline, grupo?.pauses_deadline ?? false);
  const prioridade = priorityConfig[demand.priority];
  const pessoas = demand.assignees ?? [];
  const primeira = pessoas[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className="grid min-h-[38px] w-full border-t text-left text-sm transition-colors hover:bg-muted/40"
      style={{ gridTemplateColumns: GRID }}
    >
      <span className="flex items-center truncate px-3 py-2">
        <span className="truncate">{demand.title}</span>
      </span>

      <span className="flex items-center truncate border-l px-2 text-xs text-muted-foreground">
        <span className="truncate">{demand.to_department}</span>
      </span>

      <span
        className="flex items-center justify-center border-l px-2 text-xs font-medium"
        style={status ? { backgroundColor: status.cor, color: corDoTexto(status.cor) } : undefined}
      >
        {status && <span className="truncate">{status.nome}</span>}
      </span>

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
    </button>
  );
};

const SecaoFaixa = ({
  faixa,
  gruposPorId,
  commentCounts,
  onDemandClick,
}: {
  faixa: FaixaDePrazo;
  gruposPorId: Map<string, DemandGroup>;
  commentCounts: Record<string, number>;
  onDemandClick: (demand: Demand) => void;
}) => {
  // As concluídas começam recolhidas: são as que mais acumulam.
  const [aberta, setAberta] = useState(!faixa.concluidas);

  return (
    <section className="space-y-1.5">
      <button type="button" onClick={() => setAberta((v) => !v)} className="flex items-center gap-2">
        {aberta ? (
          <ChevronDown className="h-4 w-4" style={{ color: faixa.cor }} />
        ) : (
          <ChevronRight className="h-4 w-4" style={{ color: faixa.cor }} />
        )}
        <h3 className="text-sm font-semibold" style={{ color: faixa.cor }}>
          {faixa.titulo}
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">{faixa.demandas.length}</span>
      </button>

      {aberta && (
        <div className="overflow-x-auto rounded-md border" style={{ borderLeft: `4px solid ${faixa.cor}` }}>
          <div style={{ minWidth: 720 }}>
            <div className="grid bg-muted/30 text-xs text-muted-foreground" style={{ gridTemplateColumns: GRID }}>
              <span className="px-3 py-1.5">Tarefa</span>
              <span className="flex items-center border-l px-2">Setor</span>
              <span className="flex items-center justify-center border-l">Status</span>
              <span className="border-l" />
              <span className="flex items-center justify-center border-l">Pessoa</span>
              <span className="flex items-center justify-center border-l">Prioridade</span>
              <span className="flex items-center justify-center border-l">Prazo</span>
            </div>
            {faixa.demandas.map((demand) => (
              <Linha
                key={demand.id}
                demand={demand}
                grupo={demand.group_id ? gruposPorId.get(demand.group_id) : undefined}
                concluida={faixa.concluidas === true}
                comentarios={commentCounts[demand.id] ?? 0}
                onClick={() => onDemandClick(demand)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

/** "Minha área de trabalho": tudo em que a pessoa é responsável, de todos os setores, pelo prazo. */
const MinhaAreaDeTrabalho = ({ demands, groups, commentCounts, onDemandClick }: MinhaAreaDeTrabalhoProps) => {
  const gruposPorId = new Map(groups.map((g) => [g.id, g]));
  const faixas = separarPorPrazo(demands, gruposPorId);

  if (faixas.length === 0) {
    return (
      <Card className="space-y-2 p-8 text-center">
        <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="font-medium">Nada na sua área de trabalho</p>
        <p className="text-sm text-muted-foreground">
          As demandas que você abrir ou que te atribuírem aparecem aqui, da mais urgente para a menos urgente.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {faixas.map((faixa) => (
        <SecaoFaixa
          key={faixa.titulo}
          faixa={faixa}
          gruposPorId={gruposPorId}
          commentCounts={commentCounts}
          onDemandClick={onDemandClick}
        />
      ))}
    </div>
  );
};

export default MinhaAreaDeTrabalho;
