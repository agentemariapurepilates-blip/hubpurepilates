import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { compararMeses, rotuloDoMes, type PontoDoMes } from '../lib/clusters-matriculados';

const formatador = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/**
 * Dois meses lado a lado, cluster a cluster.
 *
 * Mostra a diferença ABSOLUTA e a de PARTICIPAÇÃO juntas de propósito: quando o
 * total de unidades muda entre os dois meses, as duas contam histórias
 * diferentes e olhar só uma leva à conclusão errada.
 */
export function ComparacaoDeMeses({ a, b }: { a: PontoDoMes; b: PontoDoMes }) {
  const linhas = compararMeses(a, b);
  const rotuloA = rotuloDoMes(a.mes);
  const rotuloB = rotuloDoMes(b.mes);

  const dados = linhas.map((l) => ({ rotulo: l.rotulo, [rotuloA]: l.a, [rotuloB]: l.b, cor: l.cor }));

  return (
    <div className="space-y-6">
      <div className="metric-card">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">
            {rotuloA} comparado com {rotuloB}
          </h2>
          <span className="text-sm text-muted-foreground">
            {formatador.format(a.total)} → {formatador.format(b.total)} unidades
          </span>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          {/* Barras lado a lado, e não empilhadas: aqui o que interessa é a
              altura de um mês contra a do outro dentro do mesmo cluster. */}
          <BarChart data={dados} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="rotulo" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(valor: number, nome: string) => [`${formatador.format(valor)} unidades`, nome]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey={rotuloA} fill="#b9bec4" radius={[4, 4, 0, 0]} />
            <Bar dataKey={rotuloB} fill="#c5203c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="metric-card overflow-x-auto">
        <h2 className="mb-4 text-lg font-semibold">O que mudou</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Cluster</th>
              <th className="pb-2 pr-4 text-right font-medium">{rotuloA}</th>
              <th className="pb-2 pr-4 text-right font-medium">{rotuloB}</th>
              <th className="pb-2 pr-4 text-right font-medium">Diferença</th>
              <th className="pb-2 text-right font-medium">Participação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const variacaoPct = Math.round((l.pctB - l.pctA) * 10) / 10;
              return (
                <tr key={l.numero} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: l.cor }} aria-hidden />
                      {l.rotulo}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatador.format(l.a)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatador.format(l.b)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    <Variacao valor={l.diferenca} sufixo=" un." />
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    <span className="text-muted-foreground">
                      {pct.format(l.pctA)}% → {pct.format(l.pctB)}%
                    </span>{' '}
                    <Variacao valor={variacaoPct} sufixo=" p.p." />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Seta e cor para a variação.
 *
 * Verde/vermelho NÃO seriam honestos aqui: ganhar unidades no Cluster 5 (as
 * menores) não é bom, e perder no Cluster 1 não é neutro. A direção é fato; o
 * juízo é de quem lê.
 */
function Variacao({ valor, sufixo }: { valor: number; sufixo: string }) {
  if (valor === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <ArrowRight className="h-3 w-3" aria-hidden />0{sufixo}
      </span>
    );
  }

  const Icone = valor > 0 ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-1 font-medium">
      <Icone className="h-3 w-3" aria-hidden />
      {valor > 0 ? '+' : ''}
      {pct.format(valor)}
      {sufixo}
    </span>
  );
}
