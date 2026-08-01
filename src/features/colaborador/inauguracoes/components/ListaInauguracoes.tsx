import { useEffect, useState } from 'react';
import { format, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { AlertTriangle, CalendarIcon, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';
import { useEditarInauguracao, useExcluirInauguracao, useInauguracoes } from '../hooks/useInauguracoes';
import { podeAlterar } from '../lib/prazo';
import type { InauguracaoRequest, NovaInauguracao } from '../types';

// Diálogo de edição escrito com os próprios campos em vez de reaproveitar
// <NovaInauguracaoForm>: aquele formulário chama useCriarInauguracao()
// internamente e inicializa solicitante_nome/email a partir do usuário
// logado — ambos incompatíveis com "editar um registro já existente" (que
// precisa de useEditarInauguracao() + valores vindos do item, não do
// usuário atual). Adaptar o formulário para os dois modos deixaria a
// tipagem e os efeitos mais confusos do que duplicar os 5 campos aqui,
// seguindo o padrão de src/components/demands/EditDemandDialog.tsx
// (estado local + useEffect que carrega os dados do item quando abre).

type CampoTexto = 'nomeUnidade' | 'unidadeId' | 'endereco' | 'solicitanteNome' | 'solicitanteEmail';

type Erros = Partial<Record<CampoTexto | 'dataInauguracao', string>>;

// Mesma regra usada em NovaInauguracaoForm — não existe um helper
// compartilhado para isso ainda.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function camposDoItem(item: InauguracaoRequest): Record<CampoTexto, string> {
  return {
    nomeUnidade: item.nome_unidade,
    unidadeId: item.unidade_id,
    endereco: item.endereco,
    solicitanteNome: item.solicitante_nome,
    solicitanteEmail: item.solicitante_email,
  };
}

function EditarInauguracaoDialog({
  item,
  open,
  onOpenChange,
}: {
  item: InauguracaoRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const editarInauguracao = useEditarInauguracao();

  const [campos, setCampos] = useState<Record<CampoTexto, string>>({
    nomeUnidade: '',
    unidadeId: '',
    endereco: '',
    solicitanteNome: '',
    solicitanteEmail: '',
  });
  const [dataInauguracao, setDataInauguracao] = useState<Date | undefined>(undefined);
  const [erros, setErros] = useState<Erros>({});

  // Recarrega os campos toda vez que o diálogo abre para um item — mesmo
  // item reaberto depois de editar outro não deve manter estado velho.
  useEffect(() => {
    if (item && open) {
      setCampos(camposDoItem(item));
      setDataInauguracao(parseISO(item.data_inauguracao));
      setErros({});
    }
  }, [item, open]);

  const atualizarCampo = (campo: CampoTexto) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCampos((atual) => ({ ...atual, [campo]: e.target.value }));
  };

  function validar(): Erros {
    const novosErros: Erros = {};

    if (!campos.nomeUnidade.trim()) novosErros.nomeUnidade = 'Informe o nome da unidade.';
    if (!campos.unidadeId.trim()) novosErros.unidadeId = 'Informe o ID da unidade.';
    if (!campos.endereco.trim()) novosErros.endereco = 'Informe o endereço.';
    if (!campos.solicitanteNome.trim()) novosErros.solicitanteNome = 'Informe o nome do solicitante.';

    if (!campos.solicitanteEmail.trim()) {
      novosErros.solicitanteEmail = 'Informe o e-mail do solicitante.';
    } else if (!EMAIL_REGEX.test(campos.solicitanteEmail.trim())) {
      novosErros.solicitanteEmail = 'E-mail em formato inválido.';
    }

    if (!dataInauguracao) novosErros.dataInauguracao = 'Informe a data de inauguração.';

    return novosErros;
  }

  function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;

    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const alteracoes: Partial<NovaInauguracao> = {
      nome_unidade: campos.nomeUnidade.trim(),
      unidade_id: campos.unidadeId.trim(),
      endereco: campos.endereco.trim(),
      solicitante_nome: campos.solicitanteNome.trim(),
      solicitante_email: campos.solicitanteEmail.trim(),
      data_inauguracao: format(dataInauguracao as Date, 'yyyy-MM-dd'),
    };

    editarInauguracao.mutate(
      { id: item.id, ...alteracoes },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar solicitação de inauguração</DialogTitle>
        </DialogHeader>

        <form onSubmit={aoEnviar} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome-unidade">Nome da unidade</Label>
            <Input
              id="edit-nome-unidade"
              value={campos.nomeUnidade}
              onChange={atualizarCampo('nomeUnidade')}
              aria-invalid={!!erros.nomeUnidade}
            />
            {erros.nomeUnidade && <p className="text-sm text-destructive">{erros.nomeUnidade}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-unidade-id">ID da unidade</Label>
            <Input
              id="edit-unidade-id"
              value={campos.unidadeId}
              onChange={atualizarCampo('unidadeId')}
              aria-invalid={!!erros.unidadeId}
            />
            {erros.unidadeId && <p className="text-sm text-destructive">{erros.unidadeId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-endereco">Endereço</Label>
            <Input
              id="edit-endereco"
              value={campos.endereco}
              onChange={atualizarCampo('endereco')}
              aria-invalid={!!erros.endereco}
            />
            {erros.endereco && <p className="text-sm text-destructive">{erros.endereco}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-solicitante-nome">Nome do solicitante</Label>
              <Input
                id="edit-solicitante-nome"
                value={campos.solicitanteNome}
                onChange={atualizarCampo('solicitanteNome')}
                aria-invalid={!!erros.solicitanteNome}
              />
              {erros.solicitanteNome && (
                <p className="text-sm text-destructive">{erros.solicitanteNome}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-solicitante-email">E-mail do solicitante</Label>
              <Input
                id="edit-solicitante-email"
                type="email"
                value={campos.solicitanteEmail}
                onChange={atualizarCampo('solicitanteEmail')}
                aria-invalid={!!erros.solicitanteEmail}
              />
              {erros.solicitanteEmail && (
                <p className="text-sm text-destructive">{erros.solicitanteEmail}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data de inauguração</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dataInauguracao && 'text-muted-foreground',
                  )}
                  aria-invalid={!!erros.dataInauguracao}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInauguracao
                    ? format(dataInauguracao, 'dd/MM/yyyy', { locale: ptBR })
                    : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataInauguracao}
                  onSelect={setDataInauguracao}
                  disabled={(date) => startOfDay(date) < startOfDay(new Date())}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {erros.dataInauguracao && (
              <p className="text-sm text-destructive">{erros.dataInauguracao}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={editarInauguracao.isPending}>
              {editarInauguracao.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Lista as solicitações de inauguração e, para cada uma, decide se mostra
 * Editar/Excluir ou a frase de contato — a regra das 48h fica visível aqui.
 *
 * Quem PROTEGE de verdade é a RLS do banco (ver useEditarInauguracao /
 * useExcluirInauguracao): esta tela só explica a regra antes de o usuário
 * tentar, e deixa o erro do hook aparecer se banco e interface discordarem
 * (ex.: relógio do navegador adiantado).
 *
 * `aoIrParaNova` é opcional — quando informado (ver Inauguracoes.tsx), o
 * estado vazio ganha um atalho para a aba "Nova solicitação"; sem ele, o
 * componente continua utilizável sozinho (ex.: um teste que só monta a
 * lista) e mostra só o texto.
 */
export function ListaInauguracoes({ aoIrParaNova }: { aoIrParaNova?: () => void }) {
  const { isAdmin } = useAuth();
  const { data: inauguracoes, isLoading, isError, error } = useInauguracoes();
  const excluirInauguracao = useExcluirInauguracao();

  const [itemEmEdicao, setItemEmEdicao] = useState<InauguracaoRequest | null>(null);
  const [editarAberto, setEditarAberto] = useState(false);

  function abrirEdicao(item: InauguracaoRequest) {
    setItemEmEdicao(item);
    setEditarAberto(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="metric-card flex items-start gap-3 border-destructive/40 bg-destructive/5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const lista = inauguracoes ?? [];

  if (lista.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Nenhuma solicitação ainda.</p>
        {aoIrParaNova && (
          <Button variant="outline" size="sm" onClick={aoIrParaNova}>
            Nova solicitação
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {lista.map((item) => {
          const liberado = isAdmin || podeAlterar(item.data_inauguracao);

          return (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{item.nome_unidade}</div>
                  <div className="text-sm text-muted-foreground">ID da unidade: {item.unidade_id}</div>
                  <div className="text-sm text-muted-foreground">{item.endereco}</div>
                  <div className="text-sm text-muted-foreground">
                    Solicitante: {item.solicitante_nome} ({item.solicitante_email})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Inauguração:{' '}
                    {format(parseISO(item.data_inauguracao), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </div>

                {liberado ? (
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => abrirEdicao(item)}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Editar
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="mr-1 h-4 w-4" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir solicitação?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A solicitação de inauguração de "{item.nome_unidade}" será excluída.
                            Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => excluirInauguracao.mutate(item.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <p className="shrink-0 text-sm text-muted-foreground sm:text-right">
                    Para alterar, entre em contato com o marketing.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EditarInauguracaoDialog item={itemEmEdicao} open={editarAberto} onOpenChange={setEditarAberto} />
    </>
  );
}
