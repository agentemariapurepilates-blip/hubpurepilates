import { useMemo, useState } from 'react';
import { AlertTriangle, FileDown, Info, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DivisorDaFaixa,
  FaixaDaMarca,
  NumeroDaFaixa,
} from '@/components/FaixaDaMarca';

import {
  LIDO_EM,
  MESES_COM_PDM,
  NOME_DA_PLATAFORMA,
  PLATAFORMAS,
  avaliarMes,
  avaliarMesTotal,
  avaliarSemanas,
  cargasDesalinhadas,
  detalheDoMeta,
  horizonteComum,
  situacao,
  ultimoDiaDe,
  type Avaliacao,
  type Comparacao,
  type Plataforma,
  type Situacao,
} from './lib/avaliacao';

const reais = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const rotuloDoMes = (mes: string) => {
  const [ano, numero] = mes.split('-').map(Number);
  return `${MESES[numero - 1]} de ${ano}`;
};

const nomeDoMes = (mes: string) => MESES[Number(mes.split('-')[1]) - 1];

const diaCurto = (data: string) => {
  const [, mes, dia] = data.split('-');
  return `${dia}/${mes}`;
};

const valor = (c: Pick<Comparacao, 'dinheiro'>, n: number) =>
  c.dinheiro ? reais.format(n) : inteiro.format(Math.round(n));

/**
 * Uma cor por faixa.
 *
 * `acima` é âmbar, e não verde, de propósito: gastar 130% do planejado está
 * tão fora do plano quanto gastar 70%, e pintar isso de verde ensinaria a ler
 * estouro de verba como acerto.
 */
const CORES: Record<Situacao, string> = {
  acima: 'text-amber-700 dark:text-amber-400',
  'no-alvo': 'text-emerald-700 dark:text-emerald-400',
  abaixo: 'text-amber-700 dark:text-amber-400',
  'muito-abaixo': 'text-destructive',
};

const FUNDOS: Record<Situacao, string> = {
  acima: 'border-amber-500/30 bg-amber-500/5',
  'no-alvo': 'border-emerald-500/30 bg-emerald-500/5',
  abaixo: 'border-amber-500/30 bg-amber-500/5',
  'muito-abaixo': 'border-destructive/30 bg-destructive/5',
};

function Atingimento({ pct, forte }: { pct: number | null; forte?: boolean }) {
  const s = situacao(pct);
  if (pct === null || s === null) return <span className="text-muted-foreground">—</span>;

  return (
    <span className={`tabular-nums ${CORES[s]} ${forte ? 'font-heading font-bold' : 'font-medium'}`}>
      {inteiro.format(Math.round(pct))}%
    </span>
  );
}

/** Realizado, meta e atingimento de um indicador. */
function Indicador({ c }: { c: Comparacao }) {
  const s = situacao(c.atingimento);

  return (
    <div className={`rounded-lg border p-3 ${s ? FUNDOS[s] : ''}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {c.nome}
        </span>
        <Atingimento pct={c.atingimento} forte />
      </div>
      <p className="mt-1 font-heading text-lg font-bold tabular-nums leading-tight">
        {valor(c, c.realizado)}
      </p>
      <p className="text-xs text-muted-foreground">meta {valor(c, c.planejado)}</p>
    </div>
  );
}

/** Realizado / meta / % de um indicador, em três células de tabela. */
function Celulas({ a, chave }: { a: Avaliacao; chave: Comparacao['chave'] }) {
  const c = a.comparacoes.find((x) => x.chave === chave)!;

  return (
    <>
      <TableCell className="text-right tabular-nums">{valor(c, c.realizado)}</TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {valor(c, c.planejado)}
      </TableCell>
      <TableCell className="text-right">
        <Atingimento pct={c.atingimento} />
      </TableCell>
    </>
  );
}

/**
 * A avaliação do plano de mídia: mês a mês e semana a semana, nas duas
 * plataformas.
 *
 * O PDM diz o que era para acontecer; Meta e Google dizem o que aconteceu.
 * Esta tela é a subtração dos dois — e a razão de mostrar as plataformas
 * separadas é que elas erram o plano em direções opostas.
 */
export default function AvaliacaoDeMidia() {
  const [mesEscolhido, setMesEscolhido] = useState(MESES_COM_PDM[0] ?? '');
  const [plataformaDaSemana, setPlataformaDaSemana] = useState<Plataforma>('meta');
  const [gerando, setGerando] = useState(false);

  const baixarRelatorio = async () => {
    setGerando(true);
    try {
      // O gerador é pesado (jsPDF, o logo, as fontes) e só faz sentido no
      // clique: carregá-lo com a tela atrasaria a abertura de quem nunca vai
      // baixar nada.
      const { gerarRelatorioDaAvaliacao, nomeDoArquivo } = await import('./lib/avaliacaoPdf');
      const blob = await gerarRelatorioDaAvaliacao({
        mes: mesEscolhido,
        meses: MESES_COM_PDM,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeDoArquivo(mesEscolhido);
      link.click();
      URL.revokeObjectURL(url);
    } catch (erro) {
      toast({
        title: 'Não foi possível gerar o relatório',
        description: erro instanceof Error ? erro.message : String(erro),
        variant: 'destructive',
      });
    } finally {
      setGerando(false);
    }
  };

  const meses = useMemo(
    () =>
      MESES_COM_PDM.map((mes) => ({
        mes,
        porPlataforma: PLATAFORMAS.map((p) => avaliarMes(mes, p)).filter(
          (a): a is Avaliacao => a !== null,
        ),
        total: avaliarMesTotal(mes),
      })),
    [],
  );

  const doMes = useMemo(
    () => ({
      porPlataforma: PLATAFORMAS.map((p) => avaliarMes(mesEscolhido, p)).filter(
        (a): a is Avaliacao => a !== null,
      ),
      total: avaliarMesTotal(mesEscolhido),
      detalheMeta: (() => {
        const meta = avaliarMes(mesEscolhido, 'meta');
        return meta ? detalheDoMeta(`${mesEscolhido}-01`, meta.ate) : null;
      })(),
    }),
    [mesEscolhido],
  );

  const semanas = useMemo(
    () => avaliarSemanas(mesEscolhido, plataformaDaSemana),
    [mesEscolhido, plataformaDaSemana],
  );

  const emCurso = meses.find((m) => m.total?.emCurso) ?? meses[0];
  const totalAgora = emCurso?.total;
  const verbaAgora = totalAgora?.comparacoes.find((c) => c.chave === 'verba');

  if (!totalAgora || !doMes.total) {
    return (
      <MainLayout>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Sem dados para avaliar</AlertTitle>
          <AlertDescription>
            Rode <code>node scripts/gera-pdm.mjs</code> e{' '}
            <code>node scripts/atualiza-realizado.mjs</code>.
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <FaixaDaMarca
          sobretitulo="Dashboard · Pure Pilates"
          titulo="Avaliação de mídia"
          descricao="O plano da Rise contra o que Meta e Google entregaram — mês a mês e semana a semana."
          acoes={
            <>
              <Button
                size="sm"
                variant="secondary"
                className="text-primary"
                onClick={baixarRelatorio}
                disabled={gerando}
              >
                {gerando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                {gerando ? 'Gerando…' : 'Baixar relatório'}
              </Button>
              <Select value={mesEscolhido} onValueChange={setMesEscolhido}>
                <SelectTrigger className="w-[190px] bg-white/15 text-white ring-0 focus:ring-white/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES_COM_PDM.map((m) => (
                    <SelectItem key={m} value={m}>
                      {rotuloDoMes(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        >
          <DivisorDaFaixa />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <NumeroDaFaixa
              valor={nomeDoMes(emCurso.mes)}
              rotulo="Mês em curso"
              nota={`${totalAgora.diasCorridos} de ${totalAgora.diasNoMes} dias`}
            />
            <NumeroDaFaixa
              valor={`${inteiro.format(Math.round(verbaAgora?.atingimento ?? 0))}%`}
              rotulo="Plano no ritmo"
              nota={`${reais.format(verbaAgora?.realizado ?? 0)} de ${reais.format(verbaAgora?.planejado ?? 0)}`}
            />
            {emCurso.porPlataforma.map((a) => {
              const v = a.comparacoes.find((c) => c.chave === 'verba')!;
              return (
                <NumeroDaFaixa
                  key={a.plataforma}
                  valor={`${inteiro.format(Math.round(v.atingimento ?? 0))}%`}
                  rotulo={NOME_DA_PLATAFORMA[a.plataforma!]}
                  nota={`${reais.format(v.realizado)} até ${diaCurto(a.ate)}`}
                />
              );
            })}
          </div>
        </FaixaDaMarca>

        {cargasDesalinhadas() ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Uma das cargas está parada</AlertTitle>
            <AlertDescription className="text-sm leading-relaxed">
              {PLATAFORMAS.map((p) => `${NOME_DA_PLATAFORMA[p]} até ${diaCurto(ultimoDiaDe(p))}`).join(
                ' · ',
              )}
              . Cada plataforma é avaliada até onde o dado dela vai, e o{' '}
              <strong>total do mês para em {diaCurto(horizonteComum())}</strong> — somar períodos
              diferentes daria um total que não é de mês nenhum. Enquanto a carga não voltar, o
              total do mês em curso fica congelado nessa data.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Avaliação mensal</CardTitle>
            <CardDescription>
              Cada plataforma contra a sua fatia do PDM. Mês em curso é comparado só com a parte do
              plano correspondente aos dias já corridos.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead className="text-right">Verba</TableHead>
                    <TableHead className="text-right">Meta</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Conversões</TableHead>
                    <TableHead className="text-right">Meta</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meses.flatMap(({ mes, porPlataforma, total }) => {
                    const escolhido = mes === mesEscolhido;
                    const linhas = porPlataforma.map((a, i) => (
                      <TableRow
                        key={`${mes}-${a.plataforma}`}
                        className={escolhido ? 'bg-primary/[0.04]' : undefined}
                      >
                        {i === 0 ? (
                          <TableCell rowSpan={porPlataforma.length + 1} className="align-top">
                            <button
                              type="button"
                              className="text-left font-medium hover:underline"
                              onClick={() => setMesEscolhido(mes)}
                            >
                              {rotuloDoMes(mes)}
                            </button>
                          </TableCell>
                        ) : null}
                        <TableCell className="text-sm text-muted-foreground">
                          {NOME_DA_PLATAFORMA[a.plataforma!]}
                          {a.emCurso ? (
                            <span className="block text-xs">até {diaCurto(a.ate)}</span>
                          ) : null}
                        </TableCell>
                        <Celulas a={a} chave="verba" />
                        <Celulas a={a} chave="conversoes" />
                      </TableRow>
                    ));

                    if (total) {
                      linhas.push(
                        <TableRow
                          key={`${mes}-total`}
                          className={`border-b-2 font-medium ${escolhido ? 'bg-primary/[0.06]' : 'bg-muted/40'}`}
                        >
                          <TableCell className="text-sm">
                            Total
                            {total.emCurso ? (
                              <span className="block text-xs font-normal text-muted-foreground">
                                até {diaCurto(total.ate)}
                              </span>
                            ) : null}
                          </TableCell>
                          <Celulas a={total} chave="verba" />
                          <Celulas a={total} chave="conversoes" />
                        </TableRow>,
                      );
                    }

                    return linhas;
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        <div className="grid gap-4 lg:grid-cols-2">
          {doMes.porPlataforma.map((a) => (
            <Card key={a.plataforma}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {NOME_DA_PLATAFORMA[a.plataforma!]}
                    </CardTitle>
                    <CardDescription>
                      {rotuloDoMes(a.mes)} · {a.diasCorridos} de {a.diasNoMes} dias
                      {a.emCurso ? `, até ${diaCurto(a.ate)}` : ''}
                    </CardDescription>
                  </div>
                  {a.projecao ? (
                    <Badge variant="outline" className="gap-1.5">
                      {a.projecao.verba < a.planoCheio.verba ? (
                        <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      Fecha em {reais.format(a.projecao.verba)}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {a.comparacoes.map((c) => (
                    <Indicador key={c.chave} c={c} />
                  ))}
                </div>
                {a.plataforma === 'meta' && doMes.detalheMeta ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Das conversões do Meta,{' '}
                    <strong>{inteiro.format(doMes.detalheMeta.agendamentos)}</strong> são
                    agendamentos de aula e{' '}
                    <strong>{inteiro.format(doMes.detalheMeta.leads)}</strong> são leads de
                    formulário (RH, Academy, franquias).
                  </p>
                ) : null}
                {a.plataforma === 'google' ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    O Google devolve a conversão como um número só, sem separar agendamento de
                    lead. A quebra não existe no dado — não é omissão da tela.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Avaliação semanal</CardTitle>
                <CardDescription>
                  Semanas de segunda a domingo. O PDM planeja o mês, não a semana — a meta de cada
                  uma é a fatia proporcional aos dias dela que caem dentro do mês.
                </CardDescription>
              </div>
              <div className="flex shrink-0 gap-1 rounded-lg border p-1">
                {PLATAFORMAS.map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={plataformaDaSemana === p ? 'default' : 'ghost'}
                    onClick={() => setPlataformaDaSemana(p)}
                  >
                    {NOME_DA_PLATAFORMA[p]}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Semana</TableHead>
                    <TableHead className="text-right">Verba</TableHead>
                    <TableHead className="text-right">Meta</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Conversões</TableHead>
                    <TableHead className="text-right">Meta</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semanas.map((s) => {
                    const v = s.comparacoes.find((c) => c.chave === 'verba')!;
                    const c = s.comparacoes.find((x) => x.chave === 'conversoes')!;

                    return (
                      <TableRow key={s.de}>
                        <TableCell>
                          <span className="font-medium tabular-nums">
                            {diaCurto(s.de)} a {diaCurto(s.ate)}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {s.diasNoMes} {s.diasNoMes === 1 ? 'dia' : 'dias'} no mês
                            {s.completa ? '' : ' · em andamento'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {reais.format(v.realizado)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {reais.format(v.planejado)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Atingimento pct={v.atingimento} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {inteiro.format(c.realizado)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {inteiro.format(Math.round(c.planejado))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Atingimento pct={c.atingimento} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Plano:{' '}
          <code className="rounded bg-muted px-1 py-0.5">
            RISE_PURE-PILATES_PDM_BRANDPERFORMANCE_Q425Q126_11319
          </code>
          . Realizado: SmartAds, que sincroniza Meta e Google — conferido contra a API do Meta antes
          de virar fonte. Lido em {new Date(LIDO_EM).toLocaleDateString('pt-BR')}.{' '}
          <code className="rounded bg-muted px-1 py-0.5">
            node scripts/atualiza-realizado.mjs
          </code>{' '}
          atualiza.
        </p>
      </div>
    </MainLayout>
  );
}
