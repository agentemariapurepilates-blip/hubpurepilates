import { useEffect, type ReactNode } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { Capitulo, RenderPagina } from './Revista';
import { PAGINAS_EDICAO_1 } from './edicao-1';
import { CAPITULOS as CAPITULOS_EDICAO_1 } from './edicao-1/materias';
import './entre-molas.css';

// O que a estante e a revista compartilham: fontes, o palco em tela cheia e o
// registro das páginas de cada edição.

/** Páginas e capítulos de cada edição, pelo endereço (slug) de edicoes.ts. */
export const CONTEUDO_POR_EDICAO: Record<string, { paginas: RenderPagina[]; capitulos: Capitulo[] }> = {
  'edicao-1': { paginas: PAGINAS_EDICAO_1, capitulos: CAPITULOS_EDICAO_1 },
};

// Fontes editoriais carregadas só quando a Entre Molas abre.
const FONTES =
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;800&display=swap';

function useFontesDaRevista() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONTES}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONTES;
    document.head.appendChild(link);
  }, []);
}

/** Ocupa toda a área ao lado do menu, de ponta a ponta. */
export const Palco = ({ children, className }: { children: ReactNode; className?: string }) => {
  useFontesDaRevista();
  const { isColaborador, isAdmin } = useAuth();
  // A barra de notificações (h-14) só existe para colaborador/admin; no celular
  // sempre há a barra do menu.
  const comBarra = isColaborador || isAdmin;
  return (
    <MainLayout>
      <div
        lang="pt-BR"
        className={cn(
          'em-stage fixed bottom-0 left-0 right-0 z-30 lg:left-64',
          comBarra ? 'top-14' : 'top-14 lg:top-0',
          className,
        )}
      >
        {children}
      </div>
    </MainLayout>
  );
};
