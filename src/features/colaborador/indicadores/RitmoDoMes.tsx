import { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Download, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useMesesComMeta } from './hooks/useMesesComMeta';
import {
  METRICAS_COM_META,
  useRitmoDeVariosMeses,
  useRitmoDoMes,
  type MetricaDeRitmo,
} from './hooks/useRitmoDoMes';
import type { Bloco, Ritmo } from './lib/ritmo';
import { baixarCsv, montarArquivoDoRitmo, type IndicadorExportado } from './lib/ritmoCsv';

const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const umaCasa = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

const DIAS_DA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const rotuloDoMes = (mes: string) => {
  const [ano, numero] = mes.split('-').map(Number);
  return `${MESES[numero - 1]} de ${ano}`;
};

const rotuloCurto = (mes: string) => {
  const [ano, numero] = mes.split('-').map(Number);
  return `${MESES[numero - 1].slice(0, 3)}/${String(ano).slice(-2)}`;
};

const diaCurto = (data: string) => data.slice(8, 10);

const percentual = (valor: number | null) =>
  valor === null ? '—' : `${umaCasa.format(valor * 100)}%`;

/**
 * Acima disto a curva da meta deixa de descrever o mês.
 *
 * Não é um número universal: veio do histórico. Aulas experimentais ficou entre
 * 10% e 12% nos meses fechados, e é o indicador cuja diarização está madura.
 * 15% dá folga para a variação normal e ainda separa quem está fora.
 */
const LIMITE_DE_ADERENCIA = 0.15;

const eixo = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
} as const;

/**
 * Ritmo do mês — MTD, semana e previsão de fechamento, sobre a meta diarizada.
 *
 * TUDO NA MESMA TELA, DE PROPÓSITO: os quatro indicadores com meta aparecem
 * juntos, um bloco abaixo do outro. A versão anterior tinha um seletor de
 * indicador, e comparar experimentais com matrículas exigia clicar e guardar o
 * número anterior de cabeça — que é justamente o tipo de comparação que se faz
 * o tempo todo nesta tela. O preço é uma página longa; o ganho é não precisar
 * lembrar de nada.
 *
 * O que esta tela responde, e as outras do Dashboard não: "no ritmo de hoje, o
 * mês fecha na meta?". Visão Geral mostra o total, Visão Diária mostra um dia,
 * Cronologia mostra a série — nenhuma compara o acumulado do mês com o
 * acumulado da meta no MESMO ponto do mês, que é a única comparação justa
 * enquanto o mês está aberto.
 *
 * A diarização não é inventada aqui: `daily_goals` já traz meta por dia, e o
 * estudo de comportamento (documentado em `lib/ritmo.ts`) mostrou que a curva
 * dela acompanha o realizado com 10% a 12% de divergência.
 */
export default function RitmoDoMes() {
  const { data: mesesDisponiveis } = useMesesComMeta();

  const [mes, setMes] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  const opcoesDeMes = mesesDisponiveis?.length ? mesesDisponiveis : [mes];

  // Os mesmos quatro `useRitmoDoMes` que os blocos abaixo usam. Não há
  // requisição a mais: o React Query serve os dois pela mesma chave de cache.
  // O pai precisa deles para montar o arquivo — só os blocos filhos os teriam.
  const experimentais = useRitmoDoMes(mes, 'experimentais');
  const presenca = useRitmoDoMes(mes, 'experimentais_presenca');
  const matriculas = useRitmoDoMes(mes, 'matriculas_total');
  const purepass = useRitmoDoMes(mes, 'matriculas_purepass');

  const paraExportar: IndicadorExportado[] = [
    { nome: METRICAS_COM_META[0].nome, consulta: experimentais },
    { nome: METRICAS_COM_META[1].nome, consulta: presenca },
    { nome: METRICAS_COM_META[2].nome, consulta: matriculas },
    { nome: METRICAS_COM_META[3].nome, consulta: purepass },
  ]
    .filter((item) => item.consulta.data)
    .map((item) => ({ nome: item.nome, ritmo: item.consulta.data!.ritmo }));

  const baixar = () => {
    baixarCsv(
      montarArquivoDoRitmo(rotuloDoMes(mes), paraExportar),
      `ritmo-do-mes_${mes}.csv`,
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ritmo do mês</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              MTD, semana e previsão de fechamento dos quatro indicadores com meta, comparados com
              a meta já diarizada. Enquanto o mês está aberto, comparar o acumulado com a meta
              cheia sempre mostra atraso — a comparação justa é com a meta acumulada até o mesmo
              dia.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
            <div className="w-full sm:w-56">
              <label className="text-xs font-medium text-muted-foreground">Mês</label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {opcoesDeMes.map((opcao) => (
                    <SelectItem key={opcao} value={opcao}>
                      {rotuloDoMes(opcao)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={baixar} disabled={paraExportar.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Baixar CSV
            </Button>
          </div>
        </div>

        {METRICAS_COM_META.map((metrica) => (
          <BlocoDoIndicador
            key={metrica.metricKey}
            mes={mes}
            metricKey={metrica.metricKey}
            nome={metrica.nome}
          />
        ))}

        <MatrizDeAderencia mes={mes} />
      </div>
    </MainLayout>
  );
}

/** Um indicador inteiro: os três números e os dois gráficos, sem clique nenhum. */
function BlocoDoIndicador({
  mes,
  metricKey,
  nome,
}: {
  mes: string;
  metricKey: MetricaDeRitmo;
  nome: string;
}) {
  const { data, isLoading, error } = useRitmoDoMes(mes, metricKey);
  const ritmo = data?.ritmo;

  const dados = useMemo(() => {
    if (!ritmo) return [];
    return ritmo.dias.map((dia) => ({
      dia: diaCurto(dia.data),
      diaDaSemana: DIAS_DA_SEMANA[dia.diaDaSemana],
      realizado: dia.realizado,
      meta: dia.meta,
      realizadoAcumulado: dia.realizadoAcumulado,
      metaAcumulada: dia.metaAcumulada,
    }));
  }, [ritmo]);

  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full" style={{ background: 'var(--gradient-primary)' }} />
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-lg font-bold tracking-tight">{nome}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Não foi possível ler este indicador</AlertTitle>
            <AlertDescription>{String((error as Error).message)}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !ritmo ? null : ritmo.ultimoDiaComDado === null ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{rotuloDoMes(mes)} ainda não tem leitura</AlertTitle>
            <AlertDescription>
              A meta está cadastrada ({inteiro.format(ritmo.metaDoMes)}), mas nenhum dia chegou ao
              painel. Sem realizado não há MTD, semana nem previsão.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Indicador sem meta cadastrada. Dizer DESDE QUANDO transforma um
                aviso genérico em algo que dá para cobrar de alguém. */}
            {ritmo.metaDoMes === 0 ? (
              <Alert className="border-amber-500/40">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Sem meta cadastrada para este indicador</AlertTitle>
                <AlertDescription>
                  {data?.ultimoMesComMeta
                    ? `A última meta global deste indicador é de ${rotuloDoMes(data.ultimoMesComMeta)}. `
                    : 'Não há meta global cadastrada para este indicador em nenhum mês. '}
                  Sem meta não há percentual de atingimento
                  {data?.usouHistorico
                    ? ', e a previsão abaixo foi projetada pela forma dos meses anteriores deste próprio indicador.'
                    : '.'}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-3">
              <Numero
                titulo="MTD"
                subtitulo={`do dia 1 a ${diaCurto(ritmo.ultimoDiaComDado)}`}
                explicacao="Acumulado do mês contra a meta acumulada até o mesmo dia."
                bloco={ritmo.mtd}
              />
              <Numero
                titulo="Semana"
                subtitulo={
                  ritmo.semanaDe && ritmo.semanaAte
                    ? `${diaCurto(ritmo.semanaDe)} a ${diaCurto(ritmo.semanaAte)}`
                    : ''
                }
                explicacao="Semana corrente, de segunda ao último dia com dado."
                bloco={ritmo.semana}
              />
              <NumeroDaPrevisao ritmo={ritmo} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Dia a dia
                </p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Barras: realizado. Linha: meta diarizada. O dia 1 é maior de propósito — é assim
                  que a rede consolida, e a meta acompanha.
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="dia" {...eixo} interval={2} tick={{ fontSize: 10 }} />
                    <YAxis {...eixo} width={44} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(valor: number, chave: string) => [inteiro.format(valor), chave]}
                      labelFormatter={(dia, carga) => {
                        const item = carga?.[0]?.payload;
                        return `dia ${dia}${item ? ` · ${item.diaDaSemana}` : ''}`;
                      }}
                    />
                    <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="meta"
                      name="Meta do dia"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Acumulado contra a meta acumulada
                </p>
                <p className="mb-2 text-xs text-muted-foreground">
                  A linha do realizado para no último dia com dado. Acima da meta, o mês está
                  adiantado no ponto em que está.
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="dia" {...eixo} interval={2} tick={{ fontSize: 10 }} />
                    <YAxis {...eixo} width={44} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(valor: number, chave: string) => [inteiro.format(valor), chave]}
                      labelFormatter={(dia) => `dia ${dia}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {ritmo.previsao ? (
                      <ReferenceLine
                        y={ritmo.previsao.valor}
                        stroke="hsl(var(--primary))"
                        strokeDasharray="6 4"
                        label={{
                          value: `previsão ${inteiro.format(Math.round(ritmo.previsao.valor))}`,
                          position: 'insideTopLeft',
                          fill: 'hsl(var(--primary))',
                          fontSize: 10,
                        }}
                      />
                    ) : null}
                    <Line
                      type="monotone"
                      dataKey="metaAcumulada"
                      name="Meta acumulada"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="realizadoAcumulado"
                      name="Realizado acumulado"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Numero({
  titulo,
  subtitulo,
  explicacao,
  bloco,
}: {
  titulo: string;
  subtitulo: string;
  explicacao: string;
  bloco: Bloco;
}) {
  const acima = bloco.atingimento !== null && bloco.atingimento >= 1;

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{titulo}</span>
        <span className="text-xs text-muted-foreground">{subtitulo}</span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-heading text-3xl font-bold tabular-nums">
          {inteiro.format(bloco.realizado)}
        </span>
        {/* "de 0" quando não há meta é pior que nada: parece meta zerada, e o
            que existe é meta não cadastrada. O selo abaixo já diz isso. */}
        {bloco.meta > 0 ? (
          <span className="text-sm text-muted-foreground">de {inteiro.format(bloco.meta)}</span>
        ) : null}
      </div>

      <div className="mt-2">
        <Selo atingimento={bloco.atingimento} sufixo="da meta" acima={acima} />
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{explicacao}</p>
    </div>
  );
}

function NumeroDaPrevisao({ ritmo }: { ritmo: Ritmo }) {
  const previsao = ritmo.previsao;
  if (!previsao) return null;

  const acima = previsao.atingimento !== null && previsao.atingimento >= 1;

  return (
    <div className={`rounded-xl border p-4 ${acima ? 'border-emerald-500/30' : 'border-destructive/30'}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">Previsão de fechamento</span>
        <span className="text-xs text-muted-foreground">
          {percentual(previsao.fracaoDecorrida)} do mês
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-heading text-3xl font-bold tabular-nums">
          {inteiro.format(Math.round(previsao.valor))}
        </span>
        {previsao.meta > 0 ? (
          <span className="text-sm text-muted-foreground">de {inteiro.format(previsao.meta)}</span>
        ) : null}
      </div>

      <div className="mt-2">
        <Selo atingimento={previsao.atingimento} sufixo="da meta do mês" acima={acima} />
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {previsao.metodo === 'curva-da-meta' ? (
          <>
            Projetado pela curva da meta: {percentual(previsao.fracaoDecorrida)} do mês já passou
            segundo a diarização, e o realizado foi dividido por essa fatia. Dividir por dias
            decorridos daria número errado — o dia 1 sozinho vale quase um quinto do mês.
          </>
        ) : previsao.metodo === 'curva-do-historico' ? (
          <>
            Sem meta cadastrada, a forma veio dos três meses anteriores deste próprio indicador:
            {' '}{percentual(previsao.fracaoDecorrida)} do mês já passou segundo esse desenho. É
            comportamento medido, não suposição — mas é do indicador, e não uma meta.
          </>
        ) : (
          <>
            Projetado por regra de três nos dias decorridos, porque não há meta diarizada nem
            histórico aproveitável. É o método fraco: ele supõe que todo dia rende igual, e no
            histórico a segunda rende quase quatro vezes o sábado. Leia como ordem de grandeza.
          </>
        )}
      </p>
    </div>
  );
}

function Selo({
  atingimento,
  sufixo,
  acima,
}: {
  atingimento: number | null;
  sufixo: string;
  acima: boolean;
}) {
  if (atingimento === null) return <Badge variant="outline">sem meta cadastrada</Badge>;

  return (
    <Badge
      variant="outline"
      className={
        acima
          ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
          : 'border-destructive/30 text-destructive'
      }
    >
      {acima ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
      {percentual(atingimento)} {sufixo}
    </Badge>
  );
}

/**
 * Aderência da diarização: os quatro indicadores × quatro meses, numa matriz.
 *
 * Sem isto a previsão seria um número sem procedência — ela usa a curva da meta
 * como forma do mês, então quem lê precisa poder ver o quanto essa curva tem
 * acertado, e em qual indicador ela erra mais.
 *
 * Os quatro `useRitmoDeVariosMeses` estão escritos um a um, e não num laço,
 * porque hook em laço quebra assim que a lista de indicadores mudar de tamanho.
 */
function MatrizDeAderencia({ mes }: { mes: string }) {
  const meses = useMemo(() => {
    const [ano, numero] = mes.split('-').map(Number);
    const anteriores = [3, 2, 1].map((atras) => {
      const d = new Date(ano, numero - 1 - atras, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    return [...anteriores, mes];
  }, [mes]);

  const experimentais = useRitmoDeVariosMeses(meses, 'experimentais');
  const presenca = useRitmoDeVariosMeses(meses, 'experimentais_presenca');
  const matriculas = useRitmoDeVariosMeses(meses, 'matriculas_total');
  const purepass = useRitmoDeVariosMeses(meses, 'matriculas_purepass');

  const colunas = [
    { nome: METRICAS_COM_META[0].nome, consulta: experimentais },
    { nome: METRICAS_COM_META[1].nome, consulta: presenca },
    { nome: METRICAS_COM_META[2].nome, consulta: matriculas },
    { nome: METRICAS_COM_META[3].nome, consulta: purepass },
  ];

  const carregando = colunas.some((c) => c.consulta.isLoading);

  const divergenciaDe = (dados: Ritmo[] | undefined, mesAlvo: string): number | null =>
    dados?.find((r) => r.mes === mesAlvo)?.divergenciaDaCurva ?? null;

  // A conclusão sai da própria matriz, e não de um texto fixo: se a curva
  // melhorar ou piorar num indicador, a frase muda junto. Texto cravado aqui
  // envelheceria calado, que é o pior jeito de envelhecer.
  const veredito = colunas.map((coluna) => {
    const valores = (coluna.consulta.data ?? [])
      .map((r) => r.divergenciaDaCurva)
      .filter((v): v is number => v !== null);
    const media = valores.length
      ? valores.reduce((s, v) => s + v, 0) / valores.length
      : null;
    return { nome: coluna.nome, media };
  });

  const aderentes = veredito.filter((v) => v.media !== null && v.media <= LIMITE_DE_ADERENCIA);
  const fora = veredito.filter((v) => v.media !== null && v.media > LIMITE_DE_ADERENCIA);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comportamento do mês e aderência da diarização</CardTitle>
        <CardDescription className="max-w-4xl">
          A meta já vem diarizada de <code className="rounded bg-muted px-1 text-xs">daily_goals</code>.
          A divergência compara a FORMA das duas curvas: bater 120% da meta todos os dias dá
          divergência zero, porque o mês seguiu a curva — o que ela pega é movimento previsto para
          um dia que veio em outro. Abaixo de 15% a curva está servindo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {carregando ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-medium text-muted-foreground">Mês</th>
                  {colunas.map((coluna) => (
                    <th key={coluna.nome} className="p-2 text-right font-medium">
                      {coluna.nome}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {meses.map((linha) => (
                  <tr key={linha} className="border-b last:border-0">
                    <td className="p-2">
                      <span className="font-medium">{rotuloCurto(linha)}</span>
                      {linha === mes ? (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          mês escolhido
                        </Badge>
                      ) : null}
                    </td>
                    {colunas.map((coluna) => {
                      const valor = divergenciaDe(coluna.consulta.data, linha);
                      return (
                        <td key={coluna.nome} className="p-2 text-right tabular-nums">
                          {valor === null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span
                              className={
                                valor <= LIMITE_DE_ADERENCIA
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-amber-700 dark:text-amber-400'
                              }
                            >
                              {percentual(valor)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!carregando && (aderentes.length > 0 || fora.length > 0) ? (
          <p className="text-sm leading-relaxed">
            {aderentes.length > 0 ? (
              <>
                A curva descreve bem{' '}
                <strong>{aderentes.map((v) => v.nome.toLowerCase()).join(', ')}</strong>
                {fora.length > 0 ? ' ' : '. A previsão desses indicadores pode ser cobrada.'}
              </>
            ) : null}
            {fora.length > 0 ? (
              <>
                {aderentes.length > 0 ? 'e erra mais em ' : 'A curva erra em '}
                <strong>{fora.map((v) => v.nome.toLowerCase()).join(', ')}</strong> — nesses, a
                meta espera movimento num dia e ele vem em outro, então a previsão serve de
                tendência e não de número. Revisar a diarização deles é a próxima melhoria.
              </>
            ) : null}
          </p>
        ) : null}

        <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
          <p className="font-medium">O que o estudo dos meses mostrou</p>
          <ul className="mt-2 space-y-1.5 text-muted-foreground">
            <li>
              · O mês não é plano. Tomando o dia médio como 1,00: segunda 1,58, terça 1,39, quarta
              1,30, quinta 1,08, sexta 0,80, domingo 0,44 e sábado 0,43. O perfil se repete — entre
              janeiro e julho de 2026 ele variou de 5% a 18%.
            </li>
            <li>
              · O dia 1 não é um dia: ele carrega de 9% a 26% do mês (média 19%) e vale de 3 a 10
              dias normais. Na outra ponta, o último dia do mês fica em torno de zero. É movimento
              que só entra na consolidação seguinte.
            </li>
            <li>
              · A meta diarizada já reproduz esse desenho, e por isso serve de base para a
              previsão. Vale confirmar a causa do lote do dia 1 com quem mantém a integração — o
              padrão é estável, mas a explicação ainda não foi confirmada.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
