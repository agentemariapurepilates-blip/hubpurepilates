import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Páginas lazy-loaded — cada uma vira um chunk separado, baixado só ao visitar
// Geral (todo mundo vê)
const Index = lazy(() => import("./features/geral/home/Index"));
const NovidadesDoMes = lazy(() => import("./features/geral/timeline/NovidadesDoMes"));
const Avisos = lazy(() => import("./features/geral/avisos/Avisos"));
const TutorialMarketing = lazy(() => import("./features/geral/marketing/TutorialMarketing"));
const CalendarioMarketing = lazy(() => import("./features/geral/marketing/CalendarioMarketing"));
const MidiasSociais = lazy(() => import("./features/geral/marketing/MidiasSociais"));
const ArtesProntas = lazy(() => import("./features/geral/artes/ArtesProntas"));
const MateriaisImplantacao = lazy(() => import("./features/geral/artes/MateriaisImplantacao"));
const PureDesign = lazy(() => import("./features/geral/artes/PureDesign"));
const PureDesignEditor = lazy(() => import("./features/geral/artes/PureDesignEditor"));
const Parcerias = lazy(() => import("./features/geral/parcerias/Parcerias"));
const ManualSistema = lazy(() => import("./features/geral/manual/ManualSistema"));
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
const AgenteInstagramFacebook = lazy(() => import("./features/colaborador/agentes/AgenteInstagramFacebook"));
const AgenteTikTok = lazy(() => import("./features/colaborador/agentes/AgenteTikTok"));
const MemoriaAgente = lazy(() => import("./features/colaborador/agentes/MemoriaAgente"));
const AgenteDesign = lazy(() => import("./features/colaborador/agentes/agente-design/AgenteDesign"));
const GerarFoto = lazy(() => import("./features/colaborador/agentes/agente-design/GerarFoto"));
const AgenteMonitoramentoMetricas = lazy(() => import("./features/colaborador/monitoramento/AgenteMonitoramentoMetricas"));
const SaudeDeMarca = lazy(() => import("./features/colaborador/monitoramento/SaudeDeMarca"));

// Admin (só admin)
const AdminUsuarios = lazy(() => import("./features/admin/usuarios/AdminUsuarios"));

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
            <Route path="/artes-prontas" element={<ProtectedRoute><ArtesProntas /></ProtectedRoute>} />
            <Route path="/materiais-implantacao" element={<ProtectedRoute><MateriaisImplantacao /></ProtectedRoute>} />
            <Route path="/parcerias" element={<ProtectedRoute><Parcerias /></ProtectedRoute>} />
            <Route path="/tutorial-marketing" element={<ProtectedRoute><TutorialMarketing /></ProtectedRoute>} />
            <Route path="/autorizar-midia-adicional" element={<ProtectedRoute><AutorizarMidiaAdicional /></ProtectedRoute>} />
            <Route path="/midia-adicional/unidades" element={<ProtectedRoute><MidiaAdicionalUnidades /></ProtectedRoute>} />
            <Route path="/minha-area/minhas-solicitacoes" element={<ProtectedRoute><MinhasSolicitacoes /></ProtectedRoute>} />
            <Route path="/manual-sistema" element={<ProtectedRoute><ManualSistema /></ProtectedRoute>} />
            <Route path="/pure-design" element={<ProtectedRoute><PureDesign /></ProtectedRoute>} />
            <Route path="/pure-design/:id" element={<ProtectedRoute><PureDesignEditor /></ProtectedRoute>} />
            <Route path="/agente-instagram-facebook" element={<ProtectedRoute><AgenteInstagramFacebook /></ProtectedRoute>} />
            <Route path="/agente-instagram-facebook/memoria" element={<ProtectedRoute><MemoriaAgente /></ProtectedRoute>} />
            <Route path="/agente-tiktok" element={<ProtectedRoute><AgenteTikTok /></ProtectedRoute>} />
            <Route path="/agente-design" element={<ProtectedRoute><GerarFoto /></ProtectedRoute>} />
            <Route path="/agente-design/gerar-foto" element={<ProtectedRoute><GerarFoto /></ProtectedRoute>} />
            <Route path="/agente-design/avatares" element={<ProtectedRoute><AgenteDesign /></ProtectedRoute>} />
            {/* Backward compat — redireciona pra nova URL */}
            <Route path="/agente-design/criacao-fotos" element={<ProtectedRoute><GerarFoto /></ProtectedRoute>} />
            {/* Backward compat: redirect legado */}
            <Route path="/agente-planejamento-editorial" element={<ProtectedRoute><AgenteInstagramFacebook /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute requireAdmin><AdminUsuarios /></ProtectedRoute>} />
            {/* TODO: voltar para `requireAdmin` antes do release. Liberado temporariamente para preview. */}
            <Route
              path="/agente-monitoramento/metricas"
              element={<ProtectedRoute><AgenteMonitoramentoMetricas /></ProtectedRoute>}
            />
            <Route
              path="/agente-monitoramento/saude-de-marca"
              element={<ProtectedRoute><SaudeDeMarca /></ProtectedRoute>}
            />
            <Route path="/auth/callback/meta" element={<AuthCallbackMeta />} />
            <Route path="/auth/callback/tiktok" element={<AuthCallbackTikTok />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
}

export default App;
