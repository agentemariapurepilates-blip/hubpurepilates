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
import type {
  useAlternarDestinatario,
  useCriarDestinatario,
  useDestinatarios,
  useExcluirDestinatario,
} from '@/features/colaborador/inauguracoes/hooks/useDestinatarios';

// Mesma regra usada em NovaInauguracaoForm/ListaInauguracoes — não existe um
// helper compartilhado para isso ainda.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Erros {
  email?: string;
}

export interface TextosDoPainel {
  /** Título do cartão de cadastro. */
  tituloCadastro: string;
  /** Explica o que a pessoa passa a receber ao entrar na lista. */
  descricaoCadastro: string;
  /** Placeholder do campo de e-mail. */
  exemploEmail: string;
  /** Como o envio se chama nos avisos: "o aviso de inauguração", "o relatório semanal". */
  nomeDoEnvio: string;
  /** Prefixo dos ids dos campos — dois painéis na mesma página não podem colidir. */
  idPrefixo: string;
  /** Renderizado acima do formulário. Usado para dizer que o envio ainda não existe. */
  avisoDeTopo?: React.ReactNode;
}

interface PainelDestinatariosProps {
  hooks: {
    usarLista: typeof useDestinatarios;
    usarCriar: typeof useCriarDestinatario;
    usarAlternar: typeof useAlternarDestinatario;
    usarExcluir: typeof useExcluirDestinatario;
  };
  textos: TextosDoPainel;
}

/**
 * Cadastro e manutenção de uma lista de destinatários de e-mail.
 *
 * Serve as duas listas de /inauguracoes — o aviso diário e o relatório semanal
 * —, que têm exatamente o mesmo comportamento e diferem só no texto e na
 * tabela. Os hooks entram por parâmetro em vez de serem importados aqui, para
 * o componente não conhecer nenhuma das duas.
 *
 * Só admin chega neste painel: os itens do menu somem para colaborador e a RLS
 * das tabelas bloqueia o acesso direto.
 */
export function PainelDestinatarios({ hooks, textos }: PainelDestinatariosProps) {
  const { data: destinatarios, isLoading, isError, error } = hooks.usarLista();
  const criarDestinatario = hooks.usarCriar();
  const alternarDestinatario = hooks.usarAlternar();
  const excluirDestinatario = hooks.usarExcluir();

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
      {textos.avisoDeTopo}

      <Card>
        <CardHeader>
          <CardTitle>{textos.tituloCadastro}</CardTitle>
          <CardDescription>{textos.descricaoCadastro}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={aoEnviar} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${textos.idPrefixo}-email`}>E-mail</Label>
                <Input
                  id={`${textos.idPrefixo}-email`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={textos.exemploEmail}
                  aria-invalid={!!erros.email}
                />
                {erros.email && <p className="text-sm text-destructive">{erros.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${textos.idPrefixo}-nome`}>Nome (opcional)</Label>
                <Input
                  id={`${textos.idPrefixo}-nome`}
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
                Nenhum destinatário cadastrado. <strong>Sem destinatário ativo,
                {' '}{textos.nomeDoEnvio} não é enviado</strong> — ninguém vai receber e-mail até
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
                  Nenhum destinatário está ativo no momento.{' '}
                  <strong>{textos.nomeDoEnvio} não será enviado</strong> até que pelo menos um
                  seja ativado.
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
                            receber {textos.nomeDoEnvio}. Essa ação não pode ser desfeita.
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
