import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, Book, CheckCircle, XCircle } from 'lucide-react';
import {
  estatisticasDeIntegracao,
  ultimaSincronizacaoBemSucedida,
  useIntegrationLogs,
} from '../../hooks/useIntegrationLogs';
import { AvisoDaFonte } from './AvisoDaFonte';

// Aba somente consulta: como está a integração que alimenta o banco de
// indicadores e o histórico das últimas execuções.
//
// O QUE SAIU DA ORIGEM (e por quê)
// - Botão "Atualizar" do histórico: em uma aba de consulta, um botão com esse
//   nome ao lado de "integração" se lê como "sincronizar agora". O React Query
//   já rebusca sozinho ao voltar para a aba.
// - Botão de copiar o endpoint: dependia de um toast, que esta feature não
//   usa em lugar nenhum. A URL continua visível e selecionável.
//
// O QUE FICOU: os quatro cartões de status, a configuração da API com a
// documentação completa do endpoint (é referência, não comando), o histórico
// das últimas execuções com erro por linha, e os estados de carregando e vazio.

const ENDPOINT_URL = 'https://bweyyihedqnckbtzbkie.supabase.co/functions/v1/receive-data';

/** Quantas execuções o histórico carrega. */
const EXECUCOES_NO_HISTORICO = 20;

export function IntegrationStatusTab() {
  const { data: logs, isLoading: logsLoading, error: erro } = useIntegrationLogs(EXECUCOES_NO_HISTORICO);
  const [docsOpen, setDocsOpen] = useState(false);

  // Só derivam depois que a lista chega: enquanto carrega, os cartões mostram
  // "-" em vez de zeros que parecem dado de verdade.
  const latestSync = useMemo(() => (logs ? ultimaSincronizacaoBemSucedida(logs) : undefined), [logs]);
  const stats = useMemo(() => (logs ? estatisticasDeIntegracao(logs) : undefined), [logs]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Sucesso</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Erro</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Parcial</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Processando</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
  };

  if (erro) return <AvisoDaFonte erro={erro} />;

  return (
    <div className="space-y-6">
      {/* Cartões de status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status da Integração</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats?.isOperational ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-semibold text-green-500">Operacional</span>
                </>
              ) : stats?.lastStatus === 'error' ? (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-semibold text-red-500">Erro</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold text-muted-foreground">Sem dados</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Última Sincronização</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm">
              {latestSync?.completed_at ? formatDate(latestSync.completed_at) : 'Nenhuma'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Último Import</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-lg">
              {latestSync?.records_imported ?? '-'}{' '}
              <span className="text-sm font-normal text-muted-foreground">registros</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Sucesso (10 últimos)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-lg">{stats?.successRate?.toFixed(0) ?? '-'}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuração da API */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuração da API</CardTitle>
          <CardDescription>
            Informações do envio automático de dados para o Painel de Indicadores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Endpoint URL</span>
            <code className="px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
              {ENDPOINT_URL}
            </code>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">API Key</span>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                ••••••••••••••••
              </code>
              <p className="text-xs text-muted-foreground self-center">
                Configurada nas secrets do Supabase
              </p>
            </div>
          </div>

          <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Book className="h-4 w-4" />
                Ver Documentação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Documentação da API de Integração</DialogTitle>
                <DialogDescription>Manual para envio automático de dados</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <section>
                  <h4 className="font-semibold mb-2">Endpoint</h4>
                  <code className="block px-3 py-2 bg-muted rounded-md font-mono text-xs break-all">
                    POST {ENDPOINT_URL}
                  </code>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Headers Obrigatórios</h4>
                  <pre className="px-3 py-2 bg-muted rounded-md font-mono text-xs overflow-x-auto">
{`X-API-Key: {sua_chave_api}
Content-Type: application/json`}
                  </pre>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Formato do Body</h4>
                  <pre className="px-3 py-2 bg-muted rounded-md font-mono text-xs overflow-x-auto">
{`{
  "rows": [
    {
      "ID_Unidade": 67,
      "Data": "2024-12-11",
      "cli_matriculados_total": 150,
      "cli_matriculados_diretos": 120,
      "cli_matriculas_total": 10,
      "cli_matriculas_planos": 5,
      "cli_matriculas_agregadores": 3,
      "cli_matriculas_pacotes": 1,
      "cli_matriculas_purepass": 1,
      "cli_matriculas_12meses": 2,
      "cli_perdas_planos_total": 3,
      "cli_perdas_planos": 2,
      "cli_perdas_agregadores": 1,
      "cli_perdas_pacotes": 0,
      "cli_perdas_purepass": 0,
      "cli_experimentais": 15,
      "cli_experimentais_validos": 10,
      "cli_experimentais_presenca": 8,
      "cli_experimentais_gympass": 5,
      "cli_experimentais_franq": 2,
      "cli_experimentais_bot": 3,
      "cli_experimentais_auto_atend": 4,
      "cli_pacotes_ativos": 25,
      "cli_purepass_ativos": 10,
      "cli_gympass": 50,
      "cli_classpass": 20,
      "cli_totalpass": 15,
      "cli_purepass": 10,
      "cli_gympass_booking": 30,
      "cli_gympass_booking_aberto": 25,
      "cli_gympass_booking_1_aberto": 15,
      "cli_gympass_booking_2_aberto": 10,
      "cli_aulas_avulsas": 40,
      "cli_aulas_avulsas_aberto": 35,
      "fin_receitas": 25000.50,
      "fin_despesas": 15000.00,
      "fin_receitas_agregadores": 5000.00,
      "fin_receitas_booking_1": 2000.00,
      "fin_receitas_booking_2": 1500.00,
      "pla_anu_1x_semana": 10,
      "pla_sem_1x_semana": 5,
      "pla_qua_1x_semana": 8,
      "pla_men_1x_semana": 3,
      "pla_anu_2x_semana": 20,
      "pla_sem_2x_semana": 12,
      "pla_qua_2x_semana": 15,
      "pla_men_2x_semana": 6,
      "pla_anu_3x_semana": 30,
      "pla_sem_3x_semana": 18,
      "pla_qua_3x_semana": 22,
      "pla_men_3x_semana": 9,
      "leads_novos": 25,
      "hist_cadastrados": 100,
      "hist_recados_baixados": 80,
      "hist_recados_nao_baixados": 20,
      "hist_recados_cadastrados": 15,
      "qt_acessos_pagina_unidade": 500,
      "qt_acessos_pagina_aula_exp": 200,
      "qt_vagas_total": 100,
      "qt_vagas_ocupadas": 75,
      "qt_vagas_ocupadas_agreg": 20,
      "qt_cliques_whatsapp": 50,
      "qt_cliques_telefone": 30,
      "qt_cliques_botao_exp": 40,
      "vl_media_desconto": 15.5,
      "qt_booking_medio_clientes": 2.5,
      "vl_ltv_clientes": 3500.00,
      "vl_indice_evolucoes": 85.5,
      "qt_aulas_presenca": 120,
      "qt_aulas_falta": 25,
      "qt_clientes_circulacao": 180,
      "dt_calculo": "2024-12-11T10:30:00Z"
    }
  ]
}`}
                  </pre>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Campos Obrigatórios</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Formato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono">ID_Unidade</TableCell>
                        <TableCell>Integer</TableCell>
                        <TableCell>ID da unidade no sistema</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">Data</TableCell>
                        <TableCell>String</TableCell>
                        <TableCell>YYYY-MM-DD ou DD/MM/YYYY</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Campos Opcionais (Clientes)</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-muted p-2 rounded-md">
                    <span>cli_matriculados_total</span>
                    <span>cli_matriculados_diretos</span>
                    <span>cli_matriculas_total</span>
                    <span>cli_matriculas_planos</span>
                    <span>cli_matriculas_agregadores</span>
                    <span>cli_matriculas_pacotes</span>
                    <span>cli_matriculas_purepass</span>
                    <span>cli_matriculas_12meses</span>
                    <span>cli_perdas_planos_total</span>
                    <span>cli_perdas_planos</span>
                    <span>cli_perdas_agregadores</span>
                    <span>cli_perdas_pacotes</span>
                    <span>cli_perdas_purepass</span>
                    <span>cli_experimentais</span>
                    <span>cli_experimentais_validos</span>
                    <span>cli_experimentais_presenca</span>
                    <span>cli_experimentais_gympass</span>
                    <span>cli_experimentais_franq</span>
                    <span>cli_experimentais_bot</span>
                    <span>cli_experimentais_auto_atend</span>
                    <span>cli_pacotes_ativos</span>
                    <span>cli_purepass_ativos</span>
                    <span>cli_gympass</span>
                    <span>cli_classpass</span>
                    <span>cli_totalpass</span>
                    <span>cli_purepass</span>
                    <span>cli_gympass_booking</span>
                    <span>cli_gympass_booking_aberto</span>
                    <span>cli_gympass_booking_1_aberto</span>
                    <span>cli_gympass_booking_2_aberto</span>
                    <span>cli_aulas_avulsas</span>
                    <span>cli_aulas_avulsas_aberto</span>
                  </div>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Campos Opcionais (Financeiro)</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-muted p-2 rounded-md">
                    <span>fin_receitas</span>
                    <span>fin_despesas</span>
                    <span>fin_receitas_agregadores</span>
                    <span>fin_receitas_booking_1</span>
                    <span>fin_receitas_booking_2</span>
                  </div>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Campos Opcionais (Planos por Frequência)</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-muted p-2 rounded-md">
                    <span>pla_anu_1x_semana</span>
                    <span>pla_sem_1x_semana</span>
                    <span>pla_qua_1x_semana</span>
                    <span>pla_men_1x_semana</span>
                    <span>pla_anu_2x_semana</span>
                    <span>pla_sem_2x_semana</span>
                    <span>pla_qua_2x_semana</span>
                    <span>pla_men_2x_semana</span>
                    <span>pla_anu_3x_semana</span>
                    <span>pla_sem_3x_semana</span>
                    <span>pla_qua_3x_semana</span>
                    <span>pla_men_3x_semana</span>
                  </div>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Campos Opcionais (Leads/Histórico)</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-muted p-2 rounded-md">
                    <span>leads_novos</span>
                    <span>hist_cadastrados</span>
                    <span>hist_recados_baixados</span>
                    <span>hist_recados_nao_baixados</span>
                    <span>hist_recados_cadastrados</span>
                  </div>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Campos Opcionais (Métricas Web/Acesso)</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-muted p-2 rounded-md">
                    <span>qt_acessos_pagina_unidade</span>
                    <span>qt_acessos_pagina_aula_exp</span>
                    <span>qt_vagas_total</span>
                    <span>qt_vagas_ocupadas</span>
                    <span>qt_vagas_ocupadas_agreg</span>
                    <span>qt_cliques_whatsapp</span>
                    <span>qt_cliques_telefone</span>
                    <span>qt_cliques_botao_exp</span>
                  </div>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Campos Opcionais (Valores/Métricas)</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-muted p-2 rounded-md">
                    <span>vl_media_desconto</span>
                    <span>qt_booking_medio_clientes</span>
                    <span>vl_ltv_clientes</span>
                    <span>vl_indice_evolucoes</span>
                  </div>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Campos Opcionais (Aulas/Presença)</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-muted p-2 rounded-md">
                    <span>qt_aulas_presenca</span>
                    <span>qt_aulas_falta</span>
                    <span>qt_clientes_circulacao</span>
                  </div>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Campo de Controle</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-muted p-2 rounded-md">
                    <span>dt_calculo</span>
                    <span className="text-muted-foreground">(timestamp)</span>
                  </div>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Resposta de Sucesso (200)</h4>
                  <pre className="px-3 py-2 bg-muted rounded-md font-mono text-xs overflow-x-auto">
{`{
  "success": true,
  "message": "150 registros importados",
  "imported": 150,
  "failed": 0,
  "log_id": 123,
  "duration_ms": 1500
}`}
                  </pre>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Resposta de Erro (401/500)</h4>
                  <pre className="px-3 py-2 bg-muted rounded-md font-mono text-xs overflow-x-auto">
{`{
  "success": false,
  "error": "Invalid or missing API key"
}`}
                  </pre>
                </section>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Histórico de execuções */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Execuções</CardTitle>
          <CardDescription>Últimas {EXECUCOES_NO_HISTORICO} execuções da integração</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Recebidos</TableHead>
                    <TableHead className="text-right">Importados</TableHead>
                    <TableHead className="text-right">Falhas</TableHead>
                    <TableHead className="text-right">Duração</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className={log.status === 'error' ? 'bg-destructive/5' : ''}>
                      <TableCell className="text-xs">{formatDate(log.started_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.source === 'api' ? 'API' : 'Upload CSV'}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-right">{log.records_received ?? '-'}</TableCell>
                      <TableCell className="text-right">{log.records_imported ?? '-'}</TableCell>
                      <TableCell className="text-right">{log.records_failed ?? '-'}</TableCell>
                      <TableCell className="text-right">
                        {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px]">
                        {log.error_details ? (
                          <span
                            className="text-destructive truncate block"
                            title={JSON.stringify(log.error_details, null, 2)}
                          >
                            {typeof log.error_details === 'object' && log.error_details !== null
                              ? String(
                                  (log.error_details as Record<string, unknown>).message ||
                                    (log.error_details as Record<string, unknown>).error ||
                                    JSON.stringify(log.error_details),
                                )
                              : String(log.error_details)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum registro de integração encontrado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
