import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { cn } from '@/lib/utils';
import { useCriarInauguracao } from '../hooks/useInauguracoes';
import { podeAgendarPara } from '../lib/prazo';
import type { NovaInauguracao } from '../types';

// Formulário de 6 campos — não precisa de react-hook-form/zod (ambos existem
// no projeto, mas para este tamanho o useState puro é mais simples e segue o
// mesmo padrão de src/components/demands/CreateDemandDialog.tsx, inclusive
// para o seletor de data (Calendar + Popover).

type CampoTexto =
  | 'nomeUnidade'
  | 'unidadeId'
  | 'endereco'
  | 'solicitanteNome'
  | 'solicitanteEmail';

type Erros = Partial<Record<CampoTexto | 'dataInauguracao', string>>;

// Mesmo espírito da validação de e-mail já usada no Hub (ver
// AuthContext.validatePureEmail): não tenta cobrir o RFC inteiro, só barrar o
// caso comum de e-mail digitado errado.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function nomeInicial(user: ReturnType<typeof useAuth>['user']): string {
  const nome = user?.user_metadata?.full_name;
  return typeof nome === 'string' ? nome : '';
}

export function NovaInauguracaoForm({ aoSalvar }: { aoSalvar?: () => void }) {
  const { user } = useAuth();
  const criarInauguracao = useCriarInauguracao();

  const camposIniciais = (): Record<CampoTexto, string> => ({
    nomeUnidade: '',
    unidadeId: '',
    endereco: '',
    solicitanteNome: nomeInicial(user),
    solicitanteEmail: user?.email ?? '',
  });

  const [campos, setCampos] = useState<Record<CampoTexto, string>>(camposIniciais);
  const [dataInauguracao, setDataInauguracao] = useState<Date | undefined>(undefined);
  const [erros, setErros] = useState<Erros>({});

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

    if (!dataInauguracao) {
      novosErros.dataInauguracao = 'Informe a data de inauguração.';
    } else if (!podeAgendarPara(format(dataInauguracao, 'yyyy-MM-dd'))) {
      // A data precisa ser posterior a hoje. Uma inauguração marcada para o
      // mesmo dia da solicitação nasceria sem aviso: o e-mail ao marketing sai
      // às 03:00 do dia da inauguração, horário que já teria passado.
      //
      // Quem decide de fato é a RLS da tabela (ver a migration); isto aqui
      // evita a viagem até o banco e explica o motivo na hora.
      novosErros.dataInauguracao = 'A inauguração precisa ser a partir de amanhã.';
    }

    return novosErros;
  }

  function limparFormulario() {
    setCampos(camposIniciais());
    setDataInauguracao(undefined);
    setErros({});
  }

  function aoEnviar(e: React.FormEvent) {
    e.preventDefault();

    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const nova: NovaInauguracao = {
      nome_unidade: campos.nomeUnidade.trim(),
      unidade_id: campos.unidadeId.trim(),
      endereco: campos.endereco.trim(),
      solicitante_nome: campos.solicitanteNome.trim(),
      solicitante_email: campos.solicitanteEmail.trim(),
      data_inauguracao: format(dataInauguracao as Date, 'yyyy-MM-dd'),
    };

    criarInauguracao.mutate(nova, {
      onSuccess: () => {
        limparFormulario();
        aoSalvar?.();
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova solicitação de inauguração</CardTitle>
        <CardDescription>
          Preencha os dados da unidade para avisar o marketing. A inauguração precisa ser a partir
          de amanhã, e você pode editar a solicitação até as 23:59 do dia anterior à data marcada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={aoEnviar} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome-unidade">Nome da unidade</Label>
            <Input
              id="nome-unidade"
              value={campos.nomeUnidade}
              onChange={atualizarCampo('nomeUnidade')}
              placeholder="Ex.: Pure Pilates Moema"
              aria-invalid={!!erros.nomeUnidade}
            />
            {erros.nomeUnidade && <p className="text-sm text-destructive">{erros.nomeUnidade}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unidade-id">ID da unidade</Label>
            <Input
              id="unidade-id"
              value={campos.unidadeId}
              onChange={atualizarCampo('unidadeId')}
              placeholder="Ex.: 1234"
              aria-invalid={!!erros.unidadeId}
            />
            {erros.unidadeId && <p className="text-sm text-destructive">{erros.unidadeId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={campos.endereco}
              onChange={atualizarCampo('endereco')}
              placeholder="Rua, número, bairro, cidade"
              aria-invalid={!!erros.endereco}
            />
            {erros.endereco && <p className="text-sm text-destructive">{erros.endereco}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="solicitante-nome">Nome do solicitante</Label>
              <Input
                id="solicitante-nome"
                value={campos.solicitanteNome}
                onChange={atualizarCampo('solicitanteNome')}
                aria-invalid={!!erros.solicitanteNome}
              />
              {erros.solicitanteNome && (
                <p className="text-sm text-destructive">{erros.solicitanteNome}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="solicitante-email">E-mail do solicitante</Label>
              <Input
                id="solicitante-email"
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
                  // Mesma função da validação e da RLS: hoje e o passado saem
                  // desabilitados, e o usuário nem chega a escolher uma data
                  // que o banco recusaria.
                  disabled={(date) => !podeAgendarPara(format(date, 'yyyy-MM-dd'))}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {erros.dataInauguracao && (
              <p className="text-sm text-destructive">{erros.dataInauguracao}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={criarInauguracao.isPending}>
            {criarInauguracao.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Registrar inauguração'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
