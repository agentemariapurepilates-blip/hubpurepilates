import { useQuery } from '@tanstack/react-query';
import { lerTabelaDeIndicadores, OPCOES_DE_CONSULTA } from '../lib/indicadoresProxy';

// Somente consulta. As mutações da origem (adicionar/remover destinatário,
// salvar horário, enviar teste, gerar preview) não foram portadas: a área de
// Dashboard não escreve no banco de indicadores.

/** Quem recebe o relatório diário por e-mail. */
export interface ReportRecipient {
  id: number;
  email: string;
  name: string | null;
  active: boolean;
  created_at: string;
}

/** Configuração do envio automático. A tabela tem uma única linha. */
export interface ReportSettings {
  id: number;
  send_hour: number;
  send_minute: number;
  enabled: boolean;
  updated_at: string;
}

export function useReportRecipients() {
  return useQuery({
    queryKey: ['indicadores_report-recipients'],
    queryFn: () =>
      lerTabelaDeIndicadores<ReportRecipient>('report_recipients', { order: 'created_at.asc' }),
    ...OPCOES_DE_CONSULTA,
  });
}

export function useReportSettings() {
  return useQuery({
    queryKey: ['indicadores_report-settings'],
    queryFn: async () => {
      // A origem usa `.single()`, que estoura se a tabela estiver vazia. Aqui a
      // linha ausente é um estado normal de leitura: devolve null e a tela
      // mostra os valores padrão em vez de um erro que ninguém sabe resolver.
      const linhas = await lerTabelaDeIndicadores<ReportSettings>('report_settings', { limit: 1 });
      return linhas[0] ?? null;
    },
    ...OPCOES_DE_CONSULTA,
  });
}
