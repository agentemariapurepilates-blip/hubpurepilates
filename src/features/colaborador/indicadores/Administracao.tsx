import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisTab } from './components/admin/AnalysisTab';
import { ClusterGeneratorTab } from './components/admin/ClusterGeneratorTab';
import { CamposTab } from './components/admin/CamposTab';
import { CalculatedMetricsTab } from './components/admin/CalculatedMetricsTab';
import { IndicatorOrderTab } from './components/admin/IndicatorOrderTab';
import { GlobalGoalsTab } from './components/admin/GlobalGoalsTab';
import { UnidadesTab } from './components/admin/UnidadesTab';

// Tela de administração do Painel de Indicadores, em modo somente consulta.
// Reúne as 7 abas que mostram a configuração hoje mantida no painel publicado
// em pure-pilates-insights.pages.dev. Nenhuma aba grava no banco — ver a
// trava de sem-escrita.test.ts na raiz da feature.

export default function Administracao() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
          <p className="text-muted-foreground">Configuração do Painel de Indicadores</p>
        </div>

        {/* Banner de somente consulta: sem ele, quem procura o botão de salvar
            conclui que a tela está quebrada. */}
        <div className="bg-pure-red/5 border border-pure-red/20 text-pure-black text-sm rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="font-bold text-pure-red shrink-0">Somente consulta</span>
          <span className="text-pure-gray">
            Esta área mostra a configuração do Painel de Indicadores. Para alterar qualquer
            coisa, use o painel em <code>pure-pilates-insights.pages.dev</code>.
          </span>
        </div>

        <Tabs defaultValue="analise">
          {/* Em telas estreitas as 7 abas rolam horizontalmente em vez de
              quebrar linha ou estourar a largura da página. */}
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="analise">Análise</TabsTrigger>
            <TabsTrigger value="clusters">Clusters</TabsTrigger>
            <TabsTrigger value="campos">Campos</TabsTrigger>
            <TabsTrigger value="calculadas">Calculadas</TabsTrigger>
            <TabsTrigger value="ordenacao">Ordenação</TabsTrigger>
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="unidades">Unidades</TabsTrigger>
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
        </Tabs>
      </div>
    </MainLayout>
  );
}
