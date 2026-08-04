import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Nome da área protegida, usado no texto de erro. Ex.: "Dashboard". */
  area?: string;
  /**
   * Renderiza o fallback dentro do MainLayout (padrão). Passe `false` no
   * boundary mais externo: se o próprio MainLayout for o que está quebrado, um
   * fallback que depende dele quebraria junto e a tela voltaria a ficar branca.
   */
  withLayout?: boolean;
}

/**
 * O erro de um chunk que não carrega tem cara de bug, mas quase sempre é uma
 * versão nova publicada: o navegador está com um index.html antigo pedindo
 * arquivos que mudaram de nome. Recarregar resolve, e a mensagem precisa dizer
 * isso -- em 03/08/2026 os usuários viram "Failed to fetch dynamically imported
 * module" e não tinham como saber o que fazer.
 */
function ehFalhaDeChunk(error: Error): boolean {
  const m = `${error.name} ${error.message}`;
  return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|ChunkLoadError|error loading dynamically imported module/i.test(m);
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
    const { area, children, withLayout = true } = this.props;

    if (!error) return children;

    const deChunk = ehFalhaDeChunk(error);

    const conteudo = (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="card-pure p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-xl font-semibold">
                  {deChunk
                    ? 'Há uma versão nova do Hub'
                    : `Não foi possível carregar ${area ? `a área de ${area}` : 'esta página'}`}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {deChunk
                    ? 'Sua aba está com uma versão antiga carregada. Clique em recarregar para pegar a mais recente — nada do seu trabalho é perdido.'
                    : 'O resto do Hub continua funcionando — use o menu ao lado para ir para outra tela. Se o erro persistir, avise a equipe de tecnologia com a mensagem abaixo.'}
                </p>
              </div>

              {!deChunk && (
                <pre className="whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  {error.message || 'Erro desconhecido.'}
                </pre>
              )}

              {/* `reload(true)` não existe mais nos navegadores atuais, e um
                  reload comum pode reusar o index.html do cache -- que é
                  justamente o que aponta para os arquivos velhos. Trocar o
                  location força uma requisição nova do documento. */}
              <Button
                onClick={() => {
                  if (deChunk) window.location.replace(window.location.href);
                  else window.location.reload();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {deChunk ? 'Recarregar' : 'Tentar novamente'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );

    return withLayout ? <MainLayout>{conteudo}</MainLayout> : conteudo;
  }
}

export default ErrorBoundary;
