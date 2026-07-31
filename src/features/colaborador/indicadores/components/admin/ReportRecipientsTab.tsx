import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Mail, Settings } from 'lucide-react';
import { useReportRecipients, useReportSettings } from '../../hooks/useReportSettings';
import { AvisoDaFonte } from './AvisoDaFonte';

// Aba somente consulta: quem recebe o relatório diário e como o envio está
// configurado. Portada do painel do Cloudflare sem nenhum caminho de escrita.
//
// O QUE SAIU DA ORIGEM (e por quê)
// - Cartão "Pré-visualização do Relatório" e o modal do PDF: geravam o
//   relatório por edge function. Sem o botão, o cartão ficava vazio — então
//   saiu inteiro, em vez de virar uma casca.
// - "Enviar Teste" e "Adicionar Email" (com o diálogo): disparo e criação.
// - Botão de excluir destinatário e a coluna que só existia para ele.
// - Os Switch de "Envio automático" e de "Ativo" viraram Badge: o estado
//   continua visível, só não é mais clicável.
// - Os Select de hora e minuto viraram o horário escrito.
//
// O QUE FICOU: o horário e a ativação do envio, a lista completa de
// destinatários com o estado de cada um, e os estados de carregando e vazio.
//
// UM ESTADO QUE A ORIGEM NÃO CHEGAVA A TER: lá o `.single()` estourava quando
// report_settings estava vazia. Aqui a linha ausente é leitura normal, então a
// aba mostra o padrão do sistema — mas marcado como padrão, nunca disfarçado
// de configuração salva.

/** Horário do envio no formato HH:MM, com os padrões da origem quando falta a linha. */
function horarioDeEnvio(hora: number | undefined, minuto: number | undefined): string {
  const hh = String(hora ?? 8).padStart(2, '0');
  const mm = String(minuto ?? 0).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function ReportRecipientsTab() {
  const {
    data: recipients,
    isLoading: loadingRecipients,
    error: erroRecipients,
  } = useReportRecipients();
  const { data: settings, isLoading: loadingSettings, error: erroSettings } = useReportSettings();

  // Basta uma das duas consultas falhar para a aba não ter o que mostrar: as
  // duas leem o mesmo banco pela mesma chave, então falham juntas.
  const erro = erroRecipients ?? erroSettings;
  if (erro) return <AvisoDaFonte erro={erro} />;

  if (loadingRecipients || loadingSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // A tabela report_settings pode vir vazia. Nesse caso os valores mostrados
  // não são a configuração salva — são o padrão embutido no código. Numa aba
  // cujo trabalho é dizer como o envio está configurado, apresentar um sem
  // marcar seria a pior falha possível: a pessoa lê "08:00" e vai embora
  // achando que existe um horário salvo.
  const semConfiguracaoSalva = !settings;
  const envioAtivado = settings?.enabled ?? true;

  return (
    <div className="space-y-6">
      {/* Configurações de envio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Envio
          </CardTitle>
          <CardDescription>Horário e ativação do envio automático diário</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Envio automático:</span>
              <Badge variant={envioAtivado ? 'default' : 'secondary'}>
                {envioAtivado ? 'Ativado' : 'Desativado'}
              </Badge>
              {semConfiguracaoSalva && (
                <span className="text-xs text-muted-foreground">(padrão)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Horário:</span>
              <span className="font-mono tabular-nums">
                {horarioDeEnvio(settings?.send_hour, settings?.send_minute)}
              </span>
              <span className="text-sm text-muted-foreground">(Brasília)</span>
              {semConfiguracaoSalva && (
                <span className="text-xs text-muted-foreground">(padrão)</span>
              )}
            </div>
          </div>

          {semConfiguracaoSalva && (
            <p className="text-xs text-muted-foreground">
              Nenhuma configuração salva no banco — os valores acima são o padrão do sistema, não
              o que está gravado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Destinatários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Destinatários
          </CardTitle>
          <CardDescription>Emails que receberão o relatório diário</CardDescription>
        </CardHeader>
        <CardContent>
          {recipients?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum destinatário configurado</p>
              <p className="text-sm">
                O cadastro de emails é feito no Painel de Indicadores.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-24 text-center">Ativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients?.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="font-medium">{recipient.email}</TableCell>
                    <TableCell className="text-muted-foreground">{recipient.name || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={recipient.active ? 'default' : 'secondary'}>
                        {recipient.active ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Informações */}
      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
        <p className="font-medium mb-2">Informações importantes:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>O relatório inclui dados do dashboard (já são D-1)</li>
          <li>Se houver erro ao buscar dados, o email não será enviado</li>
          <li>
            Esta aba é somente consulta: alterar destinatários, horário ou enviar teste continua
            no Painel de Indicadores
          </li>
        </ul>
      </div>
    </div>
  );
}
