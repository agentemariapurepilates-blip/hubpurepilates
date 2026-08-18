import { useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertTriangle,
  Download,
  FlaskConical,
  Loader2,
  Lock,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { agruparPorConjunto, filtrarLeads, SEM_CONJUNTO, type LeadRH } from './lib/leads';
import { baixarConjunto, baixarPlanilha } from './lib/planilha';
import { StatusDaAtualizacao } from './components/StatusDaAtualizacao';
import {
  useAutorizados,
  useGerenciarAutorizados,
  useLeadsRH,
  usePodeVerLeads,
} from './hooks/useLeadsRH';

const inteiro = new Intl.NumberFormat('pt-BR');

const dataHora = (iso: string) => {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano} ${iso.slice(11, 16)}`;
};

/**
 * Leads RH — os candidatos que chegaram pelos formulários de recrutamento.
 *
 * Separados por conjunto de anúncio, que é onde mora o nome da unidade. Cada
 * conjunto vira uma seção aqui e uma aba na planilha, para quem cuida do RH de
 * uma unidade trabalhar só a lista dela.
 *
 * O acesso é definido na própria tela, na aba Autorizados. Quem garante é a RLS
 * do banco: esconder a tela no menu não impediria ninguém de chamar a API
 * direto, então a regra mora na tabela e a tela apenas explica.
 */
export default function LeadsRH() {
  const { isAdmin } = useAuth();
  const { data, isLoading, error } = useLeadsRH();
  const acesso = usePodeVerLeads();

  const [busca, setBusca] = useState('');
  const [incluirTestes, setIncluirTestes] = useState(false);
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');

  const leads = data?.leads ?? [];

  const filtrados = useMemo(
    () => filtrarLeads(leads, { busca, incluirTestes, de: de || undefined, ate: ate || undefined }),
    [leads, busca, incluirTestes, de, ate],
  );

  const grupos = useMemo(() => agruparPorConjunto(filtrados), [filtrados]);
  const testes = useMemo(() => leads.filter((l) => l.ehTeste).length, [leads]);

  const baixar = () => {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarPlanilha(filtrados, hoje);
    toast({
      title: 'Planilha gerada',
      description: `${filtrados.length} candidatos em ${grupos.length} abas, uma por conjunto.`,
    });
  };

  const baixarUm = (grupo: (typeof grupos)[number]) => {
    const rotulo = grupo.unidade ?? grupo.conjuntoNome;
    baixarConjunto(grupo.leads, rotulo, new Date().toISOString().slice(0, 10));
    toast({
      title: `Planilha de ${rotulo}`,
      description: `${grupo.leads.length} candidatos.`,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Leads RH</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Os candidatos que chegaram pelos formulários de recrutamento do Meta, separados
                pelo conjunto de anúncio — que é onde está a unidade.
              </p>
            </div>
          </div>

          {acesso.pode ? (
            <Button onClick={baixar} disabled={filtrados.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Baixar planilha
            </Button>
          ) : null}
        </div>

        <section className="space-y-4">
            {data?.tabelasAusentes && !data.previa ? (
              <Alert className="border-amber-500/40">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>O módulo ainda não foi instalado no banco</AlertTitle>
                <AlertDescription className="space-y-1">
                  <p>
                    As tabelas <code className="rounded bg-muted px-1 text-xs">rh_leads</code> e{' '}
                    <code className="rounded bg-muted px-1 text-xs">rh_leads_autorizados</code> ainda
                    não existem. A migration está escrita em{' '}
                    <code className="rounded bg-muted px-1 text-xs">
                      supabase/migrations/20260818140000_leads_rh.sql
                    </code>{' '}
                    e não foi aplicada, porque o trabalho foi pedido em modo local.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    A tela abaixo já está pronta: assim que a migration rodar e a sincronização
                    acontecer, os leads aparecem aqui sem nenhuma outra mudança.
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}

            {data?.previa ? (
              <Alert className="border-primary/40 bg-primary/[0.03]">
                <FlaskConical className="h-4 w-4" />
                <AlertTitle>Prévia local — candidatos reais, sincronização ainda não ligada</AlertTitle>
                <AlertDescription>
                  Os {leads.length} candidatos abaixo vieram da conta do Meta em{' '}
                  {data.capturadoEm
                    ? new Date(data.capturadoEm).toLocaleString('pt-BR')
                    : '—'}{' '}
                  e estão congelados num arquivo local. Para a lista passar a se atualizar sozinha,
                  falta aplicar a migration e publicar a função de sincronização.
                </AlertDescription>
              </Alert>
            ) : null}

            {acesso.pode ? (
              <StatusDaAtualizacao
                leads={leads}
                ultimaSincronizacao={data?.sincronizadoEm ?? data?.capturadoEm ?? null}
                ehPrevia={Boolean(data?.previa)}
                agendada={Boolean(data?.agendada)}
              />
            ) : null}

            {error && !data?.tabelasAusentes ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Não foi possível ler os leads</AlertTitle>
                <AlertDescription>{String((error as Error).message)}</AlertDescription>
              </Alert>
            ) : null}

            {!acesso.pode && !data?.tabelasAusentes ? (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertTitle>Você não está na lista de autorizados</AlertTitle>
                <AlertDescription>
                  Estes leads trazem nome, telefone e e-mail de candidatos, e por isso a lista de quem
                  pode vê-los é fechada. Peça a um administrador para incluir seu e-mail na aba
                  Autorizados.
                </AlertDescription>
              </Alert>
            ) : null}

            {acesso.pode ? (
              <>
                <Card>
                  <CardContent className="flex flex-wrap items-end gap-4 pt-6">
                    <div className="min-w-[16rem] flex-1">
                      <Label htmlFor="busca" className="text-xs text-muted-foreground">
                        Buscar
                      </Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="busca"
                          value={busca}
                          onChange={(e) => setBusca(e.target.value)}
                          placeholder="nome, e-mail, telefone ou unidade"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="de" className="text-xs text-muted-foreground">
                        De
                      </Label>
                      <Input
                        id="de"
                        type="date"
                        value={de}
                        max={ate || undefined}
                        onChange={(e) => setDe(e.target.value)}
                        className="mt-1 w-[9.5rem]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ate" className="text-xs text-muted-foreground">
                        Até
                      </Label>
                      <Input
                        id="ate"
                        type="date"
                        value={ate}
                        min={de || undefined}
                        onChange={(e) => setAte(e.target.value)}
                        className="mt-1 w-[9.5rem]"
                      />
                    </div>

                    {testes > 0 ? (
                      <div className="flex items-center gap-2 pb-2">
                        <Switch
                          id="testes"
                          checked={incluirTestes}
                          onCheckedChange={setIncluirTestes}
                        />
                        <Label htmlFor="testes" className="text-sm">
                          Mostrar os {testes} leads de teste
                        </Label>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Indicador rotulo="Leads" valor={inteiro.format(filtrados.length)} />
                  <Indicador
                    rotulo="Pessoas distintas"
                    valor={inteiro.format(
                      new Set(
                        filtrados.map((l) => (l.email ?? l.telefone ?? l.id).toLowerCase()),
                      ).size,
                    )}
                    nota="a mesma pessoa costuma se candidatar mais de uma vez"
                  />
                  <Indicador rotulo="Conjuntos" valor={inteiro.format(grupos.length)} />
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : grupos.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-sm text-muted-foreground">
                      {leads.length === 0 ? (
                        'Nenhum lead sincronizado ainda.'
                      ) : testes === leads.length && !incluirTestes ? (
                        // O caso de hoje: o único lead que a API entrega é o de
                        // teste do Meta, e o filtro o esconde por padrão. Sem
                        // dizer isso, a tela mostra "0" logo abaixo de um aviso
                        // que fala em 1 lead — e parece defeito.
                        <>
                          {leads.length === 1
                            ? 'O único lead disponível é um lead de teste do Meta, escondido por padrão.'
                            : `Os ${leads.length} leads disponíveis são de teste do Meta, escondidos por padrão.`}{' '}
                          Ligue a chave acima para vê-{leads.length === 1 ? 'lo' : 'los'}.
                        </>
                      ) : (
                        'Nenhum lead corresponde ao filtro.'
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Accordion type="multiple" className="space-y-3">
                    {grupos.map((grupo) => (
                      <AccordionItem
                        key={grupo.conjuntoNome}
                        value={grupo.conjuntoNome}
                        className="rounded-xl border px-4"
                      >
                        {/* O botão fica FORA do gatilho: dentro dele seria
                            <button> dentro de <button> (HTML inválido) e o
                            texto do botão entraria no nome acessível do
                            accordion.

                            As três faixas têm largura fixa de propósito. Com
                            larguras automáticas, o badge de "pessoas" só
                            aparece em alguns conjuntos e empurra a seta e o
                            download para posições diferentes em cada linha —
                            a coluna de botões fica serrilhada e o olho perde a
                            referência ao descer a lista. */}
                        {/* `[&>h3]` alcança o <Header> que o Radix põe entre
                            este flex e o gatilho. Sem esticar esse h3, o
                            `flex-1` do gatilho não tem efeito: ele encolhe
                            até o conteúdo, e a seta e o download param em
                            posições diferentes em cada linha. */}
                        <div className="flex items-center gap-3 [&>h3]:min-w-0 [&>h3]:flex-1">
                          <AccordionTrigger className="min-w-0 flex-1 hover:no-underline">
                            <div className="flex min-w-0 flex-1 items-center gap-3 pr-2 text-left">
                              <span className="shrink-0 font-semibold">
                                {grupo.unidade ?? grupo.conjuntoNome}
                              </span>
                              {grupo.conjuntoNome !== SEM_CONJUNTO ? (
                                <span className="truncate font-mono text-xs text-muted-foreground">
                                  {grupo.conjuntoNome}
                                </span>
                              ) : null}

                              <span className="ml-auto flex shrink-0 items-center gap-2">
                                <Badge variant="secondary" className="w-24 justify-center tabular-nums">
                                  {inteiro.format(grupo.leads.length)} leads
                                </Badge>
                                {/* O espaço é reservado mesmo quando não há
                                    duplicata: sem isso as linhas com e sem
                                    "pessoas" desalinham entre si. */}
                                <span className="w-28 text-right">
                                  {grupo.distintos !== grupo.leads.length ? (
                                    <Badge variant="outline" className="tabular-nums">
                                      {grupo.distintos} pessoas
                                    </Badge>
                                  ) : null}
                                </span>
                              </span>
                            </div>
                          </AccordionTrigger>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 shrink-0 p-0"
                            onClick={() => baixarUm(grupo)}
                            aria-label={`Baixar planilha de ${grupo.unidade ?? grupo.conjuntoNome}`}
                            title="Baixar só este conjunto"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>

                        <AccordionContent>
                          <TabelaDeLeads leads={grupo.leads} />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </>
            ) : null}
        </section>

        {isAdmin ? (
          <Secao
            titulo="Autorizados"
            descricao="Administradores entram sempre. Aqui você libera colaboradores específicos."
          >
            <PainelDeAutorizados />
          </Secao>
        ) : null}
      </div>
    </MainLayout>
  );
}

/**
 * Uma seção da página.
 *
 * A tela era de abas e virou página única: dá para comparar o custo por
 * unidade com a lista de candidatos daquela unidade sem trocar de contexto.
 * O preço é uma página longa, e é por isso que cada seção tem título e
 * separador — sem eles, um bloco emenda no outro e some a hierarquia que a
 * aba dava de graça.
 */
function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t pt-6 first:border-t-0 first:pt-0">
      <div>
        <h2 className="font-heading text-lg font-bold tracking-tight">{titulo}</h2>
        <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">{descricao}</p>
      </div>
      {children}
    </section>
  );
}

function Indicador({ rotulo, valor, nota }: { rotulo: string; valor: string; nota?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{rotulo}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{valor}</CardTitle>
      </CardHeader>
      {nota ? (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">{nota}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function TabelaDeLeads({ leads }: { leads: LeadRH[] }) {
  const perguntas = useMemo(() => {
    const vistas: string[] = [];
    leads.forEach((l) =>
      l.respostas.forEach((r) => {
        if (!vistas.includes(r.pergunta)) vistas.push(r.pergunta);
      }),
    );
    return vistas;
  }, [leads]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Unidade escolhida</TableHead>
            {perguntas.map((p) => (
              <TableHead key={p}>{p}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {dataHora(lead.criadoEm)}
              </TableCell>
              <TableCell className="font-medium">
                {lead.nome ?? '—'}
                {lead.ehTeste ? (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    teste
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs">
                {lead.telefone ?? '—'}
              </TableCell>
              <TableCell className="text-xs">{lead.email ?? '—'}</TableCell>
              <TableCell className="text-sm">{lead.unidadeEscolhida ?? '—'}</TableCell>
              {perguntas.map((p) => (
                <TableCell key={p} className="max-w-[18rem] text-sm">
                  {lead.respostas.find((r) => r.pergunta === p)?.resposta ?? '—'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PainelDeAutorizados() {
  const { data, isLoading } = useAutorizados();
  const { adicionar, alternarAtivo, remover } = useGerenciarAutorizados();
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault();
    if (!email.trim()) return;
    adicionar.mutate(
      { email, nome },
      {
        onSuccess: () => {
          toast({ title: 'Acesso concedido', description: email.trim().toLowerCase() });
          setEmail('');
          setNome('');
        },
        onError: (e) =>
          toast({
            title: 'Não foi possível conceder o acesso',
            description: (e as Error).message,
            variant: 'destructive',
          }),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quem pode ver os candidatos</CardTitle>
        <CardDescription>
          <strong>Todos os administradores já têm acesso</strong>, sem precisar estar na lista.
          Use o campo abaixo para liberar colaboradores específicos — os dados trazem nome,
          telefone e e-mail de candidatos, então a lista é fechada. A regra vale no banco, e não
          só nesta tela: esconder o menu não impediria ninguém de chamar a API direto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={enviar} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[16rem] flex-1">
            <Label htmlFor="email-autorizado" className="text-xs text-muted-foreground">
              E-mail
            </Label>
            <Input
              id="email-autorizado"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pessoa@purepilates.com.br"
              className="mt-1"
            />
          </div>
          <div className="min-w-[12rem] flex-1">
            <Label htmlFor="nome-autorizado" className="text-xs text-muted-foreground">
              Nome (opcional)
            </Label>
            <Input
              id="nome-autorizado"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={adicionar.isPending || !email.trim()}>
            {adicionar.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Dar acesso
          </Button>
        </form>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data?.tabelasAusentes ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            A lista aparece aqui depois que a migration for aplicada.
          </p>
        ) : data && data.lista.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.lista.map((pessoa) => (
                <TableRow key={pessoa.id}>
                  <TableCell className="font-medium">{pessoa.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {pessoa.nome ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={pessoa.ativo}
                      onCheckedChange={(ativo) => alternarAtivo.mutate({ id: pessoa.id, ativo })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remover.mutate(pessoa.id)}
                      aria-label={`Remover ${pessoa.email}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum colaborador liberado. Por ora, só os administradores veem os candidatos.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
