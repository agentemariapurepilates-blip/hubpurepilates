import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useAlternarDestinatario,
  useCriarDestinatario,
  useDestinatarios,
  useExcluirDestinatario,
} from '../hooks/useDestinatarios';

// Mesma regra usada em NovaInauguracaoForm/ListaInauguracoes — não existe um
// helper compartilhado para isso ainda.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Erros {
  email?: string;
}

/**
 * Aba "Destinatários" de /inauguracoes — quem recebe o aviso de inauguração
 * por e-mail (workflow do n8n, todo dia às 3h). Só admin chega aqui: a aba
 * em si já é escondida do colaborador em Inauguracoes.tsx, e a RLS da tabela
 * (ver a migration) bloqueia qualquer tentativa de acesso direto.
 */
export function DestinatariosTab() {
  const { data: destinatarios, isLoading, isError, error } = useDestinatarios();
  const criarDestinatario = useCriarDestinatario();
  const alternarDestinatario = useAlternarDestinatario();
  const excluirDestinatario = useExcluirDestinatario();

  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [erros, setErros] = useState<Erros>({});

  function validar(): Erros {
    const novosErros: Erros = {};

    if (!email.trim()) {
      novosErros.email = 'Informe o e-mail.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      novosErros.email = 'E-mail em formato inválido.';
    }

    return novosErros;
  }

  function aoEnviar(e: React.FormEvent) {
    e.preventDefault();

    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    criarDestinatario.mutate(
      { email: email.trim(), nome: nome.trim() || null },
      {
        onSuccess: () => {
          setEmail('');
          setNome('');
          setErros({});
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Novo destinatário</CardTitle>
          <CardDescription>
            Quem estiver aqui e ativo recebe o e-mail de aviso no dia da inauguração de cada
            unidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={aoEnviar} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destinatario-email">E-mail</Label>
                <Input
                  id="destinatario-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marketing@purepilates.com.br"
                  aria-invalid={!!erros.email}
                />
                {erros.email && <p className="text-sm text-destructive">{erros.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinatario-nome">Nome (opcional)</Label>
                <Input
                  id="destinatario-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Fulana"
                />
              </div>
            </div>

            <Button type="submit" disabled={criarDestinatario.isPending}>
              {criarDestinatario.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Adicionar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {isError && (
        <div className="metric-card flex items-start gap-3 border-destructive/40 bg-destructive/5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      )}

      {!isLoading && !isError && (() => {
        const lista = destinatarios ?? [];
        const nenhumAtivo = lista.every((d) => !d.ativo);

        if (lista.length === 0) {
          return (
            <div className="metric-card flex items-start gap-3 border-warning/40 bg-warning/5">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <p className="text-sm text-muted-foreground">
                Nenhum destinatário cadastrado. <strong>Sem destinatário ativo, o aviso de
                inauguração não é enviado</strong> — o marketing não vai receber e-mail nenhum até
                que alguém seja adicionado aqui.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {nenhumAtivo && (
              <div className="metric-card flex items-start gap-3 border-warning/40 bg-warning/5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <p className="text-sm text-muted-foreground">
                  Nenhum destinatário está ativo no momento. <strong>O aviso de inauguração não
                  será enviado</strong> até que pelo menos um seja ativado.
                </p>
              </div>
            )}

            {lista.map((destinatario) => (
              <Card key={destinatario.id}>
                <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{destinatario.email}</div>
                    {destinatario.nome && (
                      <div className="text-sm text-muted-foreground">{destinatario.nome}</div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={destinatario.ativo}
                        onCheckedChange={(checked) =>
                          alternarDestinatario.mutate({ id: destinatario.id, ativo: checked })
                        }
                        aria-label={
                          destinatario.ativo
                            ? `Desativar ${destinatario.email}`
                            : `Ativar ${destinatario.email}`
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {destinatario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="mr-1 h-4 w-4" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir destinatário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O e-mail "{destinatario.email}" será removido da lista e deixará de
                            receber o aviso de inauguração. Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => excluirDestinatario.mutate(destinatario.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
