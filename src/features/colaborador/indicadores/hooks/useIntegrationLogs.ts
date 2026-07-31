import { useQuery } from '@tanstack/react-query';
import { lerTabelaDeIndicadores, OPCOES_DE_CONSULTA } from '../lib/indicadoresProxy';

/** Uma execução da integração que alimenta o banco de indicadores. */
export interface IntegrationLog {
  id: number;
  source: string;
  status: string;
  records_received: number | null;
  records_imported: number | null;
  records_failed: number | null;
  error_details: Record<string, unknown> | null;
  request_ip: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
}

/** Quantas execuções entram no cálculo da taxa de sucesso, como na origem. */
const EXECUCOES_NA_TAXA = 10;

export function useIntegrationLogs(limit: number = 20) {
  return useQuery({
    queryKey: ['indicadores_integration-logs', limit],
    queryFn: () =>
      lerTabelaDeIndicadores<IntegrationLog>('integration_logs', {
        order: 'started_at.desc',
        limit,
      }),
    ...OPCOES_DE_CONSULTA,
  });
}

// A origem resolvia os dois blocos abaixo com consultas próprias (`.eq(...)`,
// `.limit(1)`). O proxy só devolve a tabela ordenada e cortada — não aceita
// filtro —, então a derivação passa a ser feita sobre a mesma lista já lida.
// Uma requisição em vez de três, e os cartões nunca discordam da tabela logo
// abaixo deles.

/**
 * Última execução bem-sucedida.
 * Diferença conhecida em relação à origem: procura só entre as execuções
 * carregadas. Se nenhuma das últimas `limit` deu certo, o cartão mostra
 * "Nenhuma" mesmo que exista um sucesso mais antigo no banco.
 */
export function ultimaSincronizacaoBemSucedida(
  logs: IntegrationLog[] | undefined,
): IntegrationLog | null {
  if (!logs?.length) return null;
  const sucessos = logs.filter((log) => log.status === 'success');
  if (!sucessos.length) return null;

  // A origem ordenava por completed_at; a lista chega ordenada por started_at.
  // Reordena para que o cartão mostre mesmo a conclusão mais recente.
  return [...sucessos].sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))[0];
}

export interface EstatisticasDeIntegracao {
  lastStatus: string | null;
  isOperational: boolean;
  successRate: number;
  recentErrors: number;
}

/** Resumo das últimas execuções, para os cartões do topo da aba. */
export function estatisticasDeIntegracao(
  logs: IntegrationLog[] | undefined,
): EstatisticasDeIntegracao {
  const recentes = (logs ?? []).slice(0, EXECUCOES_NA_TAXA);
  const ultimo = recentes[0];
  const sucessos = recentes.filter((log) => log.status === 'success').length;
  const erros = recentes.filter((log) => log.status === 'error').length;

  return {
    lastStatus: ultimo?.status ?? null,
    isOperational: ultimo?.status === 'success' || ultimo?.status === 'partial',
    successRate: recentes.length > 0 ? (sucessos / recentes.length) * 100 : 0,
    recentErrors: erros,
  };
}
