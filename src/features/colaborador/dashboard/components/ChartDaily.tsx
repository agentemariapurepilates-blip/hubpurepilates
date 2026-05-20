// Port de "Dashboard Ads - Unidades"/src/app/dashboard/_components/chart-daily.tsx.
// Removido o "use client" (Vite é todo client-side).

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

type Row = { date: string; spend: number; results: number };

export function ChartDaily({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <div className="text-sm text-pure-gray">Sem dados para o período.</div>;
  const useBars = rows.length <= 14;

  if (useBars) {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7D7C7C' }} tickFormatter={(d) => d.slice(5)} />
          <YAxis yAxisId="spend" tick={{ fontSize: 11, fill: '#7D7C7C' }} />
          <YAxis yAxisId="results" orientation="right" tick={{ fontSize: 11, fill: '#7D7C7C' }} />
          <Tooltip />
          <Bar yAxisId="spend" dataKey="spend" name="Gasto (R$)" fill="#C12030" />
          <Bar yAxisId="results" dataKey="results" name="Aulas experimentais" fill="#231F20" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7D7C7C' }} tickFormatter={(d) => d.slice(5)} />
        <YAxis yAxisId="spend" tick={{ fontSize: 11, fill: '#7D7C7C' }} />
        <YAxis yAxisId="results" orientation="right" tick={{ fontSize: 11, fill: '#7D7C7C' }} />
        <Tooltip />
        <Line yAxisId="spend" dataKey="spend" name="Gasto (R$)" stroke="#C12030" dot={false} />
        <Line yAxisId="results" dataKey="results" name="Aulas experimentais" stroke="#231F20" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
