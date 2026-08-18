import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleCheck, CircleSlash, Clock, FlaskConical, TriangleAlert } from 'lucide-react';
import { statusDaSincronizacao, tempoDecorrido } from '../lib/sincronizacao';
import type { LeadRH } from '../lib/leads';

/**
 * De quanto em quanto tempo a lista atualiza, e qual o estado agora.
 *
 * Fica no topo da página porque uma lista de candidatos sem data é uma lista em
 * que ninguém confia — e pior, uma em que as pessoas confiam sem saber que está
 * velha. Quem vai ligar para um candidato precisa saber se ele chegou hoje ou
 * no mês passado.
 */
export function StatusDaAtualizacao({
  leads,
  ultimaSincronizacao,
  ehPrevia,
  agendada,
}: {
  leads: LeadRH[];
  ultimaSincronizacao: string | null;
  ehPrevia: boolean;
  agendada: boolean;
}) {
  const status = statusDaSincronizacao({ ultimaSincronizacao, ehPrevia, agendada });

  const datas = leads.map((l) => l.criadoEm).sort();
  const maisAntigo = datas[0];
  const maisNovo = datas[datas.length - 1];

  const dia = (iso?: string) => {
    if (!iso) return '—';
    const [ano, mes, d] = iso.slice(0, 10).split('-');
    return `${d}/${mes}/${ano}`;
  };

  const quando = (data: Date | null) =>
    data
      ? data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '—';

  const aparencia = {
    'em-dia': {
      icone: <CircleCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
      selo: 'Atualizado',
      cor: 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
      borda: 'border-emerald-500/30',
    },
    atrasada: {
      icone: <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      selo: 'Atrasado',
      cor: 'border-amber-500/30 text-amber-700 dark:text-amber-400',
      borda: 'border-amber-500/40',
    },
    'nunca-rodou': {
      icone: <CircleSlash className="h-4 w-4 text-muted-foreground" />,
      selo: 'Nunca rodou',
      cor: 'border-border text-muted-foreground',
      borda: 'border-border',
    },
    previa: {
      icone: <FlaskConical className="h-4 w-4 text-primary" />,
      selo: agendada ? 'Local, diária' : 'Prévia local',
      cor: 'border-primary/30 text-primary',
      borda: 'border-primary/40',
    },
  }[status.estado];

  return (
    <Card className={aparencia.borda}>
      <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-6">
        <Item rotulo="Atualização" icone={<Clock className="h-4 w-4 text-muted-foreground" />}>
          <span className="font-medium">
            {agendada ? 'Diária, às 3h da manhã' : 'Sem agendamento'}
          </span>
        </Item>

        <Item rotulo="Última" icone={aparencia.icone}>
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {status.ultima ? quando(status.ultima) : 'nunca'}
            </span>
            {status.horasDesde !== null ? (
              <span className="text-xs text-muted-foreground">
                {tempoDecorrido(status.horasDesde)}
              </span>
            ) : null}
            <Badge variant="outline" className={aparencia.cor}>
              {aparencia.selo}
            </Badge>
          </span>
        </Item>

        <Item rotulo="Próxima">
          <span className="font-medium">
            {/* Sem agendamento não existe próxima — dizer um horário aqui seria
                prometer uma atualização que não vai acontecer. */}
            {status.proxima ? quando(status.proxima) : 'não agendada'}
          </span>
        </Item>

        <Item rotulo="Candidatos no período">
          <span className="font-medium">
            {dia(maisAntigo)} a {dia(maisNovo)}
          </span>
        </Item>
      </CardContent>
    </Card>
  );
}

function Item({
  rotulo,
  icone,
  children,
}: {
  rotulo: string;
  icone?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <div className="mt-1 flex items-center gap-2 text-sm">
        {icone}
        {children}
      </div>
    </div>
  );
}
