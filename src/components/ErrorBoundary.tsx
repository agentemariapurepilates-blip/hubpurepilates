import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Nome da área protegida, usado no texto de erro. Ex.: "Dashboard". */
  area?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Captura erros de render das rotas que envolve e mostra uma mensagem no lugar
 * de derrubar o Hub inteiro.
 *
 * Existe porque as rotas são carregadas com `lazy()`: quando o módulo de uma
 * rota falha ao ser avaliado (por exemplo, o cliente Supabase dos indicadores
 * lança se faltarem as variáveis do .env.local), a promise rejeitada do
 * `lazy()` vira um throw durante o render. Sem um error boundary acima, o React
 * desmonta a raiz e o usuário fica com a tela branca, sem nem o menu lateral.
 *
 * O fallback é renderizado dentro do MainLayout justamente para o usuário não
 * perder a navegação e conseguir sair da tela quebrada por conta própria.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] erro capturado:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    const { area, children } = this.props;

    if (!error) return children;

    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12">
          <div className="card-pure p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
              <div className="space-y-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-semibold">
                    Não foi possível carregar {area ? `a área de ${area}` : 'esta página'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    O resto do Hub continua funcionando — use o menu ao lado para ir
                    para outra tela. Se o erro persistir, avise a equipe de tecnologia
                    com a mensagem abaixo.
                  </p>
                </div>

                <pre className="whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  {error.message || 'Erro desconhecido.'}
                </pre>

                <Button onClick={() => window.location.reload()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
}

export default ErrorBoundary;
