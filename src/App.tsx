import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Metricas from "./pages/Metricas";
import Perfil from "./pages/Perfil";
import CalendarioMarketing from "./pages/CalendarioMarketing";
import MidiasSociais from "./pages/MidiasSociais";
import AdminUsuarios from "./pages/AdminUsuarios";
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
            <Route path="/" element={<Index />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/calendario-marketing" element={<CalendarioMarketing />} />
            <Route path="/midias-sociais" element={<MidiasSociais />} />
            <Route path="/metricas" element={<Metricas />} />
            <Route path="/perfil" element={<Perfil />} />
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
