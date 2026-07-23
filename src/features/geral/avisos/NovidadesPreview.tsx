import { Megaphone } from 'lucide-react';
import NovidadesPureSystemCard from '@/components/avisos/NovidadesPureSystemCard';

// Página de PREVIEW (sem login). Registrada só em ambiente de desenvolvimento
// (ver App.tsx / import.meta.env.DEV) — não existe no build de produção.
// Serve para validar visualmente o card + carrossel sem passar pelo ProtectedRoute.
const NovidadesPreview = () => {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-3xl px-2 sm:px-4">
        <div className="mb-4 rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          Preview de desenvolvimento — sem login. Esta rota (<code>/preview/novidades</code>) só existe em
          {' '}<code>dev</code> e não vai para produção.
        </div>

        <div className="mb-6 flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold sm:text-2xl">Parcerias e Avisos</h1>
        </div>

        <NovidadesPureSystemCard />
      </div>
    </div>
  );
};

export default NovidadesPreview;
