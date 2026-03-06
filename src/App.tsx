import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import ManualSistema from "./pages/ManualSistema";
import NotFound from "./pages/NotFound";

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
            <Route path="/" element={<Index />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/novidades" element={<NovidadesDoMes />} />
            <Route path="/avisos" element={<Avisos />} />
            <Route path="/calendario-marketing" element={<CalendarioMarketing />} />
            <Route path="/midias-sociais" element={<MidiasSociais />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/pedidos-demanda" element={<PedidosDemanda />} />
            <Route path="/notificacoes" element={<Notificacoes />} />
            <Route path="/artes-prontas" element={<ArtesProntas />} />
            <Route path="/materiais-implantacao" element={<MateriaisImplantacao />} />
            <Route path="/parcerias" element={<Parcerias />} />
            <Route path="/manual-sistema" element={<ManualSistema />} />
            <Route path="/admin/usuarios" element={<AdminUsuarios />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
}

export default App;
