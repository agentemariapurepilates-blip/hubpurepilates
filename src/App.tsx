import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// PÃ¡ginas lazy-loaded â€” cada uma vira um chunk separado, baixado sÃ³ ao visitar
// Geral (todo mundo vÃª)
const Index = lazy(() => import("./features/geral/home/Index"));
const NovidadesDoMes = lazy(() => import("./features/geral/timeline/NovidadesDoMes"));
const Avisos = lazy(() => import("./features/geral/avisos/Avisos"));
const NovidadesPreview = lazy(() => import("./features/geral/avisos/NovidadesPreview"));
const TutorialMarketing = lazy(() => import("./features/geral/marketing/TutorialMarketing"));
const CalendarioMarketing = lazy(() => import("./features/geral/marketing/CalendarioMarketing"));
const MidiasSociais = lazy(() => import("./features/geral/marketing/MidiasSociais"));
const QuantoValeDomingo = lazy(() => import("./features/geral/domingos/QuantoValeDomingo"));
const MateriaisImplantacao = lazy(() => import("./features/geral/artes/MateriaisImplantacao"));
const PureDesign = lazy(() => import("./features/geral/artes/PureDesign"));
const PureDesignEditor = lazy(() => import("./features/geral/artes/PureDesignEditor"));
const Parcerias = lazy(() => import("./features/geral/parcerias/Parcerias"));
const ManualSistema = lazy(() => import("./features/geral/manual/ManualSistema"));
const Tutoriais = lazy(() => import("./features/geral/tutoriais/Tutoriais"));
const AutorizarMidiaAdicional = lazy(() => import("./features/geral/midia-adicional/AutorizarMidiaAdicional"));
const MinhasSolicitacoes = lazy(() => import("./features/geral/midia-adicional/MinhasSolicitacoes"));
const Perfil = lazy(() => import("./features/geral/conta/Perfil"));
const Notificacoes = lazy(() => import("./features/geral/conta/Notificacoes"));
const Auth = lazy(() => import("./features/geral/auth/Auth"));
const AguardandoAprovacao = lazy(() => import("./features/geral/auth/AguardandoAprovacao"));
const AuthCallbackMeta = lazy(() => import("./features/geral/auth/AuthCallbackMeta"));
const AuthCallbackTikTok = lazy(() => import("./features/geral/auth/AuthCallbackTikTok"));

// Colaborador (colab + admin)
const Feed = lazy(() => import("./features/colaborador/feed-sede/Feed"));
const PedidosDemanda = lazy(() => import("./features/colaborador/demandas/PedidosDemanda"));
const MidiaAdicionalUnidades = lazy(() => import("./features/colaborador/unidades/MidiaAdicionalUnidades"));
const ColabMidiasSociais = lazy(() => import("./features/colaborador/marketing/ColabMidiasSociais"));
const DashboardMidiaAdicional = lazy(() => import("./features/colaborador/dashboard/DashboardMidiaAdicional"));
const Inauguracoes = lazy(() => import("./features/colaborador/inauguracoes/Inauguracoes"));

// Painel de Indicadores (banco Supabase separado â€” ver integrations/supabase/indicadores.ts)
const IndicadoresVisaoGeral = lazy(() => import("./features/colaborador/indicadores/VisaoGeral"));
const IndicadoresTop10Unidades = lazy(() => import("./features/colaborador/indicadores/Top10Unidades"));
const IndicadoresVisaoDiaria = lazy(() => import("./features/colaborador/indicadores/VisaoDiaria"));
const IndicadoresCronologia = lazy(() => import("./features/colaborador/indicadores/Cronologia"));
const IndicadoresClusters = lazy(() => import("./features/colaborador/indicadores/ClustersMatriculados"));
const IndicadoresAdministracao = lazy(() => import("./features/colaborador/indicadores/Administracao"));
const AgenteDesign = lazy(() => import("./features/colaborador/agentes/agente-design/AgenteDesign"));
const GerarFoto = lazy(() => import("./features/colaborador/agentes/agente-design/GerarFoto"));
const CriacaoLayout = lazy(() => import("./features/colaborador/agentes/agente-design/CriacaoLayout"));
const AgenteMonitoramentoMetricas = lazy(() => import("./features/colaborador/monitoramento/AgenteMonitoramentoMetricas"));
const SaudeDeMarca = lazy(() => import("./features/colaborador/monitoramento/SaudeDeMarca"));
const PureMonitor = lazy(() => import("./features/colaborador/monitoramento/PureMonitor"));
const GerarCertificados = lazy(() => import("./features/colaborador/academy/GerarCertificados"));
const GerarContratos = lazy(() => import("./features/colaborador/academy/GerarContratos"));

// Admin (sÃ³ admin)
const AdminUsuarios = lazy(() => import("./features/admin/usuarios/AdminUsuarios"));
const MidiaAdicional = lazy(() => import("./features/admin/midia-adicional/MidiaAdicional"));
const MidiaAdicionalUnidade = lazy(() => import("./features/admin/midia-adicional/MidiaAdicionalUnidade"));
const MidiaAdicionalSyncLogs = lazy(() => import("./features/admin/midia-adicional/MidiaAdicionalSyncLogs"));

// Sistema
const NotFound = lazy(() => import("./pages/NotFound"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

function App() {
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          {/* DOIS boundaries, de propÃ³sito.
              O externo nÃ£o usa MainLayout: se o que quebrar for o prÃ³prio
              layout (ou a rota de login, que nÃ£o tem menu), um fallback que
              dependesse dele quebraria junto e a tela ficaria branca de novo.
              O interno usa, para o usuÃ¡rio manter a navegaÃ§Ã£o e conseguir sair
              da tela quebrada sozinho.

              Cobrem TODAS as rotas. Antes sÃ³ o Dashboard tinha boundary, e em
              03/08/2026 a aba InauguraÃ§Ãµes ficou totalmente em branco quando o
              chunk dela nÃ£o carregou, enquanto o Dashboard mostrou o aviso. */}
          <ErrorBoundary withLayout={false}>
          <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/aguardando-aprovacao" element={<AguardandoAprovacao />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/novidades" element={<ProtectedRoute><NovidadesDoMes /></ProtectedRoute>} />
            <Route path="/avisos" element={<ProtectedRoute><Avisos /></ProtectedRoute>} />
            <Route path="/calendario-marketing" element={<ProtectedRoute><CalendarioMarketing /></ProtectedRoute>} />
            <Route path="/midias-sociais" element={<ProtectedRoute><MidiasSociais /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/pedidos-demanda" element={<ProtectedRoute><PedidosDemanda /></ProtectedRoute>} />
            <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
            {/* Artes Prontas foi descontinuada â€” tudo agora em Pure Design. */}
            <Route path="/artes-prontas" element={<Navigate to="/pure-design?tab=prontas" replace />} />
            <Route path="/materiais-implantacao" element={<ProtectedRoute><MateriaisImplantacao /></ProtectedRoute>} />
            <Route path="/parcerias" element={<ProtectedRoute><Parcerias /></ProtectedRoute>} />
            <Route path="/tutorial-marketing" element={<ProtectedRoute><TutorialMarketing /></ProtectedRoute>} />
            <Route path="/autorizar-midia-adicional" element={<ProtectedRoute><AutorizarMidiaAdicional /></ProtectedRoute>} />
            <Route path="/midia-adicional/unidades" element={<ProtectedRoute><MidiaAdicionalUnidades /></ProtectedRoute>} />
            <Route path="/minha-area/minhas-solicitacoes" element={<ProtectedRoute><MinhasSolicitacoes /></ProtectedRoute>} />
            <Route path="/manual-sistema" element={<ProtectedRoute><ManualSistema /></ProtectedRoute>} />
            <Route path="/tutoriais" element={<ProtectedRoute><Tutoriais /></ProtectedRoute>} />
            <Route path="/pure-design" element={<ProtectedRoute><PureDesign /></ProtectedRoute>} />
            <Route path="/pure-design/:id" element={<ProtectedRoute><PureDesignEditor /></ProtectedRoute>} />
            <Route path="/agente-design" element={<ProtectedRoute><GerarFoto /></ProtectedRoute>} />
            <Route path="/agente-design/gerar-foto" element={<ProtectedRoute><GerarFoto /></ProtectedRoute>} />
            <Route path="/agente-design/avatares" element={<ProtectedRoute><AgenteDesign /></ProtectedRoute>} />
            <Route path="/agente-design/criacao-layout" element={<ProtectedRoute><CriacaoLayout /></ProtectedRoute>} />
            <Route path="/academy/gerar-certificados" element={<ProtectedRoute requireColaborador><GerarCertificados /></ProtectedRoute>} />
            <Route path="/academy/gerar-contratos" element={<ProtectedRoute requireColaborador><GerarContratos /></ProtectedRoute>} />
            <Route path="/colaborador/midias-sociais/:brand" element={<ProtectedRoute requireColaborador><ColabMidiasSociais /></ProtectedRoute>} />
            {/* InauguraÃ§Ãµes virou seÃ§Ã£o do menu, com uma rota por item. O
                /inauguracoes sozinho continua existindo e leva para a primeira
                delas â€” Ã© o link que jÃ¡ foi divulgado e estÃ¡ no PDF do guia. */}
            <Route path="/inauguracoes" element={<Navigate to="/inauguracoes/nova" replace />} />
            <Route path="/inauguracoes/nova" element={<ProtectedRoute requireColaborador><Inauguracoes /></ProtectedRoute>} />
            <Route path="/inauguracoes/solicitacoes" element={<ProtectedRoute requireColaborador><Inauguracoes /></ProtectedRoute>} />
            <Route path="/inauguracoes/destinatarios" element={<ProtectedRoute requireColaborador><Inauguracoes /></ProtectedRoute>} />
            <Route path="/inauguracoes/relatorio" element={<ProtectedRoute requireColaborador><Inauguracoes /></ProtectedRoute>} />
            {/* Backward compat â€” redireciona pra nova URL */}
            <Route path="/agente-design/criacao-fotos" element={<ProtectedRoute><GerarFoto /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute requireAdmin><AdminUsuarios /></ProtectedRoute>} />
            <Route path="/minha-area/dashboard" element={<ProtectedRoute><DashboardMidiaAdicional /></ProtectedRoute>} />
            {/* As telas de Dashboard dependem de um segundo banco Supabase, configurado
                por variÃ¡veis do .env.local. Sem elas o mÃ³dulo lanÃ§a na avaliaÃ§Ã£o, e como
                as rotas sÃ£o lazy() isso viraria tela branca no Hub inteiro. O boundary
                segura qualquer erro de render das telas abaixo e mostra a mensagem. */}
            <Route element={<ErrorBoundary area="Dashboard"><Outlet /></ErrorBoundary>}>
              <Route path="/dashboard/visao-geral" element={<ProtectedRoute requireAdmin><IndicadoresVisaoGeral /></ProtectedRoute>} />
              <Route path="/dashboard/top-10-unidades" element={<ProtectedRoute requireAdmin><IndicadoresTop10Unidades /></ProtectedRoute>} />
              <Route path="/dashboard/visao-diaria" element={<ProtectedRoute requireAdmin><IndicadoresVisaoDiaria /></ProtectedRoute>} />
              <Route path="/dashboard/cronologia" element={<ProtectedRoute requireAdmin><IndicadoresCronologia /></ProtectedRoute>} />
              <Route path="/dashboard/clusters-matriculados" element={<ProtectedRoute requireAdmin><IndicadoresClusters /></ProtectedRoute>} />
              <Route path="/dashboard/administracao" element={<ProtectedRoute requireAdmin><IndicadoresAdministracao /></ProtectedRoute>} />
            </Route>
            <Route path="/minha-area/midia-adicional" element={<ProtectedRoute requireAdmin><MidiaAdicional /></ProtectedRoute>} />
            <Route path="/minha-area/midia-adicional/sync-logs" element={<ProtectedRoute requireAdmin><MidiaAdicionalSyncLogs /></ProtectedRoute>} />
            <Route path="/minha-area/midia-adicional/:slug" element={<ProtectedRoute requireAdmin><MidiaAdicionalUnidade /></ProtectedRoute>} />
            {/* TODO: voltar para `requireAdmin` antes do release. Liberado temporariamente para preview. */}
            <Route
              path="/agente-monitoramento/metricas"
              element={<ProtectedRoute><AgenteMonitoramentoMetricas /></ProtectedRoute>}
            />
            <Route
              path="/agente-monitoramento/saude-de-marca"
              element={<ProtectedRoute><SaudeDeMarca /></ProtectedRoute>}
            />
            <Route
              path="/agente-monitoramento/pure-monitor"
              element={<ProtectedRoute><PureMonitor /></ProtectedRoute>}
            />
            <Route path="/auth/callback/meta" element={<AuthCallbackMeta />} />
            <Route path="/auth/callback/tiktok" element={<AuthCallbackTikTok />} />
            {/* Landing pÃºblica do estudo "Quanto vale um domingo?" (linkada de um aviso) */}
            <Route path="/teste-quanto-vale-domingo" element={<QuantoValeDomingo />} />
            {/* Preview SÃ“ EM DEV, sem login â€” sai do build de produÃ§Ã£o automaticamente. */}
            {import.meta.env.DEV && (
              <Route path="/preview/novidades" element={<NovidadesPreview />} />
            )}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
}

export default App;
