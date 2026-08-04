import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisTab } from './components/admin/AnalysisTab';
import { ClusterGeneratorTab } from './components/admin/ClusterGeneratorTab';
import { CamposTab } from './components/admin/CamposTab';
import { CalculatedMetricsTab } from './components/admin/CalculatedMetricsTab';
import { IndicatorOrderTab } from './components/admin/IndicatorOrderTab';
import { GlobalGoalsTab } from './components/admin/GlobalGoalsTab';
import { UnidadesTab } from './components/admin/UnidadesTab';
import { ReportRecipientsTab } from './components/admin/ReportRecipientsTab';
import { IntegrationStatusTab } from './components/admin/IntegrationStatusTab';

// Tela de administração do Painel de Indicadores, em modo somente consulta.
// Reúne as abas que mostram a configuração hoje mantida no painel publicado
// em pure-pilates-insights.pages.dev. Nenhuma aba grava no banco — ver a
// trava de sem-escrita.test.ts na raiz da feature.
//
// As duas últimas abas (Relatório e Integração) leem tabelas protegidas do
// projeto de indicadores, que só abrem com a chave de serviço. Elas não usam o
// cliente supabase do navegador: buscam pelo proxy do servidor de
// desenvolvimento, onde a chave fica. Ver lib/indicadoresProxy.ts.

// As abas Relatório e Integração leem tabelas que exigem chave de serviço, e por
// isso buscam pelo proxy `/api-dev/indicadores` do servidor de desenvolvimento
// (ver vite.config.ts). Esse proxy tem `apply: 'serve'` — NAO existe no build de
// produção. Em produção as duas requisições cairiam num caminho inexistente e as
// abas mostrariam erro, entao elas simplesmente nao aparecem la.
//
// Para liberá-las em produção seria preciso uma Edge Function no Supabase fazendo
// o mesmo papel do proxy: guardar a chave de serviço do lado do servidor e devolver
// só o JSON. Enquanto isso não existir, esconder é melhor que mostrar quebrado.
const TEM_PROXY_LOCAL = import.meta.env.DEV;

export default function Administracao() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
          <p className="text-muted-foreground">Configuração do Painel de Indicadores</p>
        </div>

        <Tabs defaultValue="analise">
          {/* Em telas estreitas as abas rolam horizontalmente em vez de
              quebrar linha ou estourar a largura da página. */}
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="analise">Análise</TabsTrigger>
            <TabsTrigger value="clusters">Clusters</TabsTrigger>
            <TabsTrigger value="campos">Campos</TabsTrigger>
            <TabsTrigger value="calculadas">Calculadas</TabsTrigger>
            <TabsTrigger value="ordenacao">Ordenação</TabsTrigger>
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="unidades">Unidades</TabsTrigger>
            {TEM_PROXY_LOCAL && <TabsTrigger value="relatorio">Relatório</TabsTrigger>}
            {TEM_PROXY_LOCAL && <TabsTrigger value="integracao">Integração</TabsTrigger>}
          </TabsList>

          <TabsContent value="analise">
            <AnalysisTab />
          </TabsContent>
          <TabsContent value="clusters">
            <ClusterGeneratorTab />
          </TabsContent>
          <TabsContent value="campos">
            <CamposTab />
          </TabsContent>
          <TabsContent value="calculadas">
            <CalculatedMetricsTab />
          </TabsContent>
          <TabsContent value="ordenacao">
            <IndicatorOrderTab />
          </TabsContent>
          <TabsContent value="metas">
            <GlobalGoalsTab />
          </TabsContent>
          <TabsContent value="unidades">
            <UnidadesTab />
          </TabsContent>
          {TEM_PROXY_LOCAL && (
            <TabsContent value="relatorio">
              <ReportRecipientsTab />
            </TabsContent>
          )}
          {TEM_PROXY_LOCAL && (
            <TabsContent value="integracao">
              <IntegrationStatusTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
