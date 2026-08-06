import { useEffect, useMemo, useState } from 'react';
import { format, subMonths } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RelatoriosDeCluster } from '@/features/colaborador/relatorio-clusters/RelatoriosDeCluster';
import MainLayout from '@/components/layout/MainLayout';
import { TimelineFilters } from './components/TimelineFilters';
import {
  ControlesDeCluster,
  FORMATOS_DA_REDE,
  FORMATOS_DA_UNIDADE,
  type FormatoDaRede,
  type FormatoDaUnidade,
} from './components/ControlesDeCluster';
import { ComparacaoDeMeses } from './components/ComparacaoDeMeses';
import { useUnits } from './hooks/useUnits';
import { useClustersMatriculados } from './hooks/useClustersMatriculados';
import {
  clusterDe,
  descricaoDaFaixa,
  emPercentual,
  FAIXAS,
  type PontoDaUnidade,
  type PontoDoMes,
} from './lib/clusters-matriculados';

const formatador = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

const chaveDa = (numero: number) => `cluster${numero}` as keyof PontoDoMes;

const eixoY = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 12,
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
 * Clusters de matriculados.
 *
 * Agrupa as unidades pela quantidade de alunos matriculados e mostra, mês a
 * mês, quantas unidades caem em cada faixa. O valor de cada mês é o do último
 * dia com dado — o indicador é estoque, então somar os dias contaria o mesmo
 * aluno várias vezes (ver lib/clusters-matriculados.ts).
 */
export default function ClustersMatriculados() {
  const hoje = new Date();
  const [deMes, setDeMes] = useState(format(subMonths(hoje, 5), 'yyyy-MM'));
  const [ateMes, setAteMes] = useState(format(hoje, 'yyyy-MM'));
  const [unidade, setUnidade] = useState<number | null>(null);
  const [formatoRede, setFormatoRede] = useState<FormatoDaRede>('empilhado');
  const [formatoUnidade, setFormatoUnidade] = useState<FormatoDaUnidade>('linha');
  const [comparando, setComparando] = useState(false);
  const [noRelatorio, setNoRelatorio] = useState(false);
  const [parDeMeses, setParDeMeses] = useState<[string, string] | null>(null);

  const { isAdmin } = useAuth();
  const { data: unidades } = useUnits();
  const { pontos, trajetoria, meses, isLoading, mesesComFalha } = useClustersMatriculados(
    deMes,
    ateMes,
    unidade,
  );

  // Ao trocar o período, o par de meses comparados vira as duas pontas do novo
  // intervalo. Sem isto, um mês que saiu do período continuaria selecionado e a
  // comparação mostraria um gráfico vazio sem explicar por quê.
  useEffect(() => {
    if (meses.length >= 2) setParDeMeses([meses[0], meses[meses.length - 1]]);
    else setParDeMeses(null);
  }, [meses]);

  const nomeDaUnidade = unidade
    ? unidades?.find((u) => u.id === unidade)?.name ?? `Unidade ${unidade}`
    : undefined;

  const dadosDoGrafico = useMemo(
    () => (formatoRede === 'percentual' ? pontos.map(emPercentual) : pontos),
    [pontos, formatoRede],
  );

  const ultimo = pontos[pontos.length - 1];
  const totalZerados = pontos.reduce((soma, p) => soma + p.zerados, 0);

  const pontoA = parDeMeses ? pontos.find((p) => p.mes === parDeMeses[0]) : undefined;
  const pontoB = parDeMeses ? pontos.find((p) => p.mes === parDeMeses[1]) : undefined;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clusters de Matriculados</h1>
            <p className="text-muted-foreground">
              {noRelatorio
                ? 'Quem recebe os relatórios de cluster por e-mail'
                : 'Quantas unidades há em cada faixa de alunos matriculados, mês a mês'}
            </p>
          </div>
          {/* A granularidade fica fixa em mês — a regra pede "valor de cada
              mês", e oferecer "por dia" prometeria algo que a tela não faz.
              Some no modo relatório: período e unidade não filtram uma lista de
              destinatários. */}
          {!noRelatorio && (
          <TimelineFilters
            granularity="month"
            onGranularityChange={() => {}}
            hideGranularity
            fromMonth={deMes}
            toMonth={ateMes}
            onRangeChange={(de, ate) => { setDeMes(de); setAteMes(ate); }}
            selectedUnit={unidade}
            onUnitChange={setUnidade}
            units={unidades}
            unitName={nomeDaUnidade}
          />
          )}
        </div>

        {/* As duas visões têm seletor de formato, mas com opções diferentes:
            "Empilhado" e "Percentual" não existem para uma unidade só — não há
            distribuição para empilhar nem participação para calcular. A
            comparação de meses também é exclusiva da rede, pelo mesmo motivo:
            comparar a contagem de uma unidade daria 1 contra 1. */}
        {unidade ? (
          <ControlesDeCluster<FormatoDaUnidade>
            opcoes={FORMATOS_DA_UNIDADE}
            formato={formatoUnidade}
            onFormatoChange={setFormatoUnidade}
            relatorio={isAdmin ? { ativa: noRelatorio, onAtivaChange: setNoRelatorio } : undefined}
          />
        ) : (
          <ControlesDeCluster<FormatoDaRede>
            opcoes={FORMATOS_DA_REDE}
            formato={formatoRede}
            onFormatoChange={setFormatoRede}
            comparacao={{
              ativa: comparando,
              onAtivaChange: setComparando,
              meses,
              mesA: parDeMeses?.[0] ?? '',
              mesB: parDeMeses?.[1] ?? '',
              onMesesChange: (a, b) => setParDeMeses([a, b]),
            }}
            relatorio={isAdmin ? { ativa: noRelatorio, onAtivaChange: setNoRelatorio } : undefined}
          />
        )}

        {!noRelatorio && (
        <div className="flex flex-wrap gap-2">
          {FAIXAS.map((faixa) => (
            <div
              key={faixa.numero}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
            >
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: faixa.cor }} aria-hidden />
              <span className="text-sm font-medium">{faixa.rotulo}</span>
              <span className="text-xs text-muted-foreground">
                {descricaoDaFaixa(faixa)} matriculados
              </span>
            </div>
          ))}
        </div>
        )}

        {!noRelatorio && mesesComFalha.length > 0 && (
          <div className="metric-card flex items-start gap-3 border-destructive/40 bg-destructive/5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar {mesesComFalha.length === 1 ? 'o mês' : 'os meses'}{' '}
              {mesesComFalha.join(', ')}. O gráfico mostra os demais.
            </p>
          </div>
        )}

        {noRelatorio && isAdmin ? (
          <RelatoriosDeCluster />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : unidade ? (
          <TrajetoriaDaUnidade dados={trajetoria} nome={nomeDaUnidade ?? ''} formato={formatoUnidade} />
        ) : comparando && pontoA && pontoB ? (
          <ComparacaoDeMeses a={pontoA} b={pontoB} />
        ) : (
          <>
            <GraficoDaRede dados={dadosDoGrafico} formato={formatoRede} ultimo={ultimo} />
            <TabelaDeClusters pontos={pontos} />
            {totalZerados > 0 && (
              <p className="text-xs text-muted-foreground">
                Observação: {formatador.format(totalZerados)} registro(s) do período estão com zero
                matriculados. Pela regra eles pertencem ao Cluster 5, mas zero normalmente
                significa unidade sem dado, e não unidade sem alunos.
              </p>
            )}
          </>
        )}

      </div>
    </MainLayout>
  );
}

const TITULOS: Record<FormatoDaRede, { titulo: string; explicacao: string }> = {
  empilhado: {
    titulo: 'Unidades por cluster',
    explicacao: 'A altura da barra é o total de unidades com dado no mês; cada fatia é uma faixa.',
  },
  percentual: {
    titulo: 'Participação de cada cluster',
    explicacao:
      'A mesma distribuição em proporção. Como o número de unidades muda entre os meses, um cluster pode ganhar unidades e ainda assim perder participação — é isso que esta visão mostra e a de contagem esconde.',
  },
  linhas: {
    titulo: 'Evolução de cada cluster',
    explicacao: 'Cada faixa como uma linha — mostra qual está crescendo e qual está encolhendo.',
  },
};

function GraficoDaRede({
  dados,
  formato,
  ultimo,
}: {
  dados: PontoDoMes[];
  formato: FormatoDaRede;
  ultimo: PontoDoMes | undefined;
}) {
  const ehPercentual = formato === 'percentual';
  const sufixo = ehPercentual ? '%' : ' unidades';
  const formatarValor = (v: number) =>
    ehPercentual ? `${decimal.format(v)}%` : `${formatador.format(v)} unidades`;

  return (
    <div className="metric-card">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{TITULOS[formato].titulo}</h2>
        {ultimo && (
          <span className="text-sm text-muted-foreground">
            {formatador.format(ultimo.total)} unidades em {ultimo.rotulo}
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{TITULOS[formato].explicacao}</p>

      <ResponsiveContainer width="100%" height={360}>
        {formato === 'linhas' ? (
          <LineChart data={dados} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="rotulo" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
            <YAxis {...eixoY} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [formatarValor(v), n]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {FAIXAS.map((f) => (
              <Line
                key={f.numero}
                type="monotone"
                dataKey={chaveDa(f.numero)}
                name={f.rotulo}
                stroke={f.cor}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        ) : ehPercentual ? (
          // Área empilhada a 100%: a proporção é uma composição que soma o
          // todo, e área comunica isso melhor que barras separadas.
          <AreaChart data={dados} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} stackOffset="expand">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="rotulo" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
            <YAxis {...eixoY} tickFormatter={(v: number) => `${Math.round(v * 100)}%`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${decimal.format(v)}%`, n]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {FAIXAS.map((f) => (
              <Area
                key={f.numero}
                type="monotone"
                dataKey={chaveDa(f.numero)}
                name={f.rotulo}
                stackId="clusters"
                stroke={f.cor}
                fill={f.cor}
              />
            ))}
          </AreaChart>
        ) : (
          <BarChart data={dados} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="rotulo" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
            <YAxis {...eixoY} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [formatarValor(v), n]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {FAIXAS.map((f) => (
              <Bar key={f.numero} dataKey={chaveDa(f.numero)} name={f.rotulo} stackId="clusters" fill={f.cor} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
      <span className="sr-only">{sufixo}</span>
    </div>
  );
}

function TabelaDeClusters({ pontos }: { pontos: PontoDoMes[] }) {
  return (
    <div className="metric-card overflow-x-auto">
      <h2 className="mb-4 text-lg font-semibold">Números do período</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Mês</th>
            {FAIXAS.map((f) => (
              <th key={f.numero} className="pb-2 pr-4 text-right font-medium">{f.rotulo}</th>
            ))}
            <th className="pb-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {pontos.map((p) => (
            <tr key={p.mes} className="border-b border-border/50 last:border-0">
              <td className="py-2 pr-4 font-medium">{p.rotulo}</td>
              {FAIXAS.map((f) => (
                <td key={f.numero} className="py-2 pr-4 text-right tabular-nums">
                  {formatador.format(Number(p[chaveDa(f.numero)]))}
                </td>
              ))}
              <td className="py-2 text-right font-semibold tabular-nums">
                {formatador.format(p.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Ponto da linha pintado com a cor do cluster daquele mês.
 *
 * É o que faz a linha continuar dizendo "em que faixa a unidade está", e não só
 * "quantos alunos ela tem": a mudança de cor marca a troca de cluster sem
 * precisar consultar a legenda.
 */
function PontoColorido({ cx, cy, payload }: { cx?: number; cy?: number; payload?: PontoDaUnidade }) {
  if (cx === undefined || cy === undefined || !payload?.cluster) return null;
  return (
    <circle cx={cx} cy={cy} r={5} fill={FAIXAS[payload.cluster - 1].cor} stroke="hsl(var(--card))" strokeWidth={2} />
  );
}

/** O mesmo ponto, um pouco maior — na visão de faixa ele é o próprio dado. */
function PontoDeFaixa({ cx, cy, payload }: { cx?: number; cy?: number; payload?: PontoDaUnidade }) {
  if (cx === undefined || cy === undefined || !payload?.cluster) return null;
  return (
    <circle cx={cx} cy={cy} r={7} fill={FAIXAS[payload.cluster - 1].cor} stroke="hsl(var(--card))" strokeWidth={2} />
  );
}

/**
 * Com uma unidade selecionada, contar "unidades por cluster" daria sempre 1.
 * O que interessa é a trajetória: quantos matriculados por mês e em que faixa
 * isso a coloca.
 */
const EXPLICACAO_DA_UNIDADE: Record<FormatoDaUnidade, string> = {
  linha:
    'Matriculados mês a mês. Cada ponto tem a cor do cluster daquele mês — a troca de cor é a troca de faixa.',
  barras:
    'O mesmo valor em barras, cada uma pintada com a cor do cluster daquele mês.',
  faixa:
    'Em que cluster a unidade esteve, sem o valor absoluto. O Cluster 1 fica no topo, então a linha subindo significa unidade maior.',
};

function TrajetoriaDaUnidade({
  dados,
  nome,
  formato,
}: {
  dados: PontoDaUnidade[];
  nome: string;
  formato: FormatoDaUnidade;
}) {
  const comValor = dados.filter((p) => p.valor !== null);
  const atual = comValor[comValor.length - 1];
  const primeiro = comValor[0];
  const variacao = atual && primeiro ? (atual.valor as number) - (primeiro.valor as number) : null;

  return (
    <div className="space-y-6">
      <div className="metric-card">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">{nome}</h2>
          {atual && (
            <span className="text-sm text-muted-foreground">
              {formatador.format(atual.valor as number)} matriculados em {atual.rotulo} —{' '}
              <span className="font-semibold" style={{ color: FAIXAS[(atual.cluster as number) - 1].cor }}>
                Cluster {atual.cluster}
              </span>
            </span>
          )}
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {EXPLICACAO_DA_UNIDADE[formato]}
          {formato !== 'faixa' && variacao !== null && primeiro && (
            <> No período: {variacao > 0 ? '+' : ''}{formatador.format(variacao)} desde {primeiro.rotulo}.</>
          )}
        </p>

        <ResponsiveContainer width="100%" height={320}>
          {formato === 'barras' ? (
            <BarChart data={dados} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="rotulo" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis {...eixoY} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(valor: number) => [
                  `${formatador.format(valor)} matriculados — Cluster ${clusterDe(valor)}`,
                  'Matriculados',
                ]}
              />
              <Bar dataKey="valor" name="Matriculados" radius={[4, 4, 0, 0]}>
                {dados.map((p) => (
                  <Cell key={p.mes} fill={p.cluster ? FAIXAS[p.cluster - 1].cor : 'hsl(var(--muted))'} />
                ))}
              </Bar>
            </BarChart>
          ) : formato === 'faixa' ? (
            // Margem superior maior: o Cluster 1 fica no topo do domínio, e com
            // 8px o rótulo "C1" era cortado pela borda do gráfico.
            <LineChart data={dados} margin={{ top: 24, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="rotulo" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              {/* Eixo invertido: o Cluster 1 é a faixa mais alta de alunos, mas
                  o menor número. Sem `reversed`, "melhorar de cluster" desceria
                  no gráfico e leria como piora. */}
              <YAxis
                {...eixoY}
                reversed
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={(v: number) => `C${v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(valor: number) => [`Cluster ${valor}`, 'Faixa']}
              />
              <Line
                type="stepAfter"
                dataKey="cluster"
                name="Cluster"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                connectNulls={false}
                dot={<PontoDeFaixa />}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          ) : (
            <LineChart data={dados} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="rotulo" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis {...eixoY} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(valor: number) => [
                  `${formatador.format(valor)} matriculados — Cluster ${clusterDe(valor)}`,
                  'Matriculados',
                ]}
              />
              <Line
                type="monotone"
                dataKey="valor"
                name="Matriculados"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                // `connectNulls` fica falso: mês sem dado precisa virar lacuna,
                // e não uma reta ligando dois meses distantes como se houvesse
                // medição no meio.
                connectNulls={false}
                dot={<PontoColorido />}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="metric-card overflow-x-auto">
        <h2 className="mb-4 text-lg font-semibold">Mês a mês</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Mês</th>
              <th className="pb-2 pr-4 text-right font-medium">Matriculados</th>
              <th className="pb-2 text-right font-medium">Cluster</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((p) => (
              <tr key={p.mes} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-4 font-medium">{p.rotulo}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {p.valor === null ? '—' : formatador.format(p.valor)}
                </td>
                <td className="py-2 text-right">
                  {p.cluster === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span className="font-semibold" style={{ color: FAIXAS[p.cluster - 1].cor }}>
                      Cluster {p.cluster}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
