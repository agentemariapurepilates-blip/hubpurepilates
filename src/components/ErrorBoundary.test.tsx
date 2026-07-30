import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { lazy, Suspense, type ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

// O MainLayout depende do AuthContext e do cliente Supabase do Hub — nada disso
// é o alvo aqui. O que importa é que o fallback é renderizado dentro dele.
vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

const MENSAGEM_ENV =
  'VITE_INDICADORES_SUPABASE_URL e VITE_INDICADORES_SUPABASE_ANON_KEY precisam estar no .env.local.';

beforeEach(() => {
  // React loga o erro capturado no console; silenciar mantém a saída do teste limpa.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('mostra a mensagem do erro quando um chunk lazy() falha, em vez de tela branca', async () => {
    // Reproduz o Achado 3: o módulo do cliente de indicadores lança na avaliação
    // quando faltam as variáveis do .env.local, e a promise do lazy() rejeita.
    const TelaQuebrada = lazy(() => Promise.reject(new Error(MENSAGEM_ENV)));

    const { container } = render(
      <Suspense fallback={<span>carregando</span>}>
        <ErrorBoundary area="Dashboard">
          <TelaQuebrada />
        </ErrorBoundary>
      </Suspense>,
    );

    expect(await screen.findByText(MENSAGEM_ENV)).toBeInTheDocument();
    expect(screen.getByText(/Não foi possível carregar a área de Dashboard/)).toBeInTheDocument();
    // A raiz continua montada — era exatamente isso que a tela branca perdia.
    expect(container).not.toBeEmptyDOMElement();
  });

  it('mantém a navegação do Hub renderizando o fallback dentro do MainLayout', () => {
    const Explode = () => {
      throw new Error('erro qualquer de runtime');
    };

    render(
      <ErrorBoundary area="Dashboard">
        <Explode />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    expect(screen.getByText('erro qualquer de runtime')).toBeInTheDocument();
  });

  it('não interfere quando não há erro', () => {
    render(
      <ErrorBoundary>
        <p>conteúdo normal</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('conteúdo normal')).toBeInTheDocument();
    expect(screen.queryByTestId('main-layout')).not.toBeInTheDocument();
  });
});
