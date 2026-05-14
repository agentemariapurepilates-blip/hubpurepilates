import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import NovidadesDoMes from "./pages/NovidadesDoMes";
import Perfil from "./pages/Perfil";
import CalendarioMarketing from "./pages/CalendarioMarketing";
import MidiasSociais from "./pages/MidiasSociais";
import AdminUsuarios from "./pages/AdminUsuarios";
import AguardandoAprovacao from "./pages/AguardandoAprovacao";
import PedidosDemanda from "./pages/PedidosDemanda";
import Notificacoes from "./pages/Notificacoes";
import ArtesProntas from "./pages/ArtesProntas";
import Avisos from "./pages/Avisos";
import MateriaisImplantacao from "./pages/MateriaisImplantacao";
import Parcerias from "./pages/Parcerias";
import TutorialMarketing from "./pages/TutorialMarketing";
import ManualSistema from "./pages/ManualSistema";
import PureDesign from "./pages/PureDesign";
import PureDesignEditor from "./pages/PureDesignEditor";
import NotFound from "./pages/NotFound";
import AgenteInstagramFacebook from "./pages/AgenteInstagramFacebook";
import AgenteTikTok from "./pages/AgenteTikTok";
import MemoriaAgente from "./pages/MemoriaAgente";
import AgenteMonitoramentoMetricas from "./pages/AgenteMonitoramentoMetricas";
import SaudeDeMarca from "./pages/SaudeDeMarca";
import AuthCallbackMeta from "./pages/AuthCallbackMeta";
import AuthCallbackTikTok from "./pages/AuthCallbackTikTok";

const queryClient = new QueryClient();

function App() {
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            <Route path="/manual-sistema" element={<ProtectedRoute><ManualSistema /></ProtectedRoute>} />
            <Route path="/pure-design" element={<ProtectedRoute><PureDesign /></ProtectedRoute>} />
            <Route path="/pure-design/:id" element={<ProtectedRoute><PureDesignEditor /></ProtectedRoute>} />
            <Route path="/agente-instagram-facebook" element={<ProtectedRoute><AgenteInstagramFacebook /></ProtectedRoute>} />
            <Route path="/agente-instagram-facebook/memoria" element={<ProtectedRoute><MemoriaAgente /></ProtectedRoute>} />
            <Route path="/agente-tiktok" element={<ProtectedRoute><AgenteTikTok /></ProtectedRoute>} />
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
              element={<ProtectedRoute requireAdmin><SaudeDeMarca /></ProtectedRoute>}
            />
            <Route path="/auth/callback/meta" element={<AuthCallbackMeta />} />
            <Route path="/auth/callback/tiktok" element={<AuthCallbackTikTok />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
}

export default App;
