import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Instagram, Loader2, TrendingDown, TrendingUp } from 'lucide-react';

interface PurePilatesAccount {
  id: string;
  username: string;
  followers_count: number;
  media_count: number;
  profile_picture_url?: string;
  name?: string;
}

interface HistoryRow {
  date: string;
  account_id: string;
  username: string;
  followers_count: number;
  media_count: number;
}

function formatDateShort(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export default function AgenteMonitoramentoMetricas() {
  const [accounts, setAccounts] = useState<PurePilatesAccount[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    void loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoadingAccounts(true);
    setAccountsError(null);
    const { data, error } = await supabase.functions.invoke<{
      accounts: PurePilatesAccount[];
      history: HistoryRow[];
      error?: string;
    }>('fetch-purepilates-metrics');

    if (error || data?.error) {
      setAccountsError(error?.message ?? data?.error ?? 'Erro ao buscar métricas');
    } else if (data?.accounts) {
      setAccounts(data.accounts);
      setHistory(data.history ?? []);
    }
    setLoadingAccounts(false);
  }

  const totals = useMemo(() => {
    const followers = accounts.reduce((sum, a) => sum + a.followers_count, 0);
    const posts = accounts.reduce((sum, a) => sum + a.media_count, 0);
    return { followers, posts };
  }, [accounts]);

  // Soma followers por dia (somando todas as contas no mesmo dia)
  const dailyTotals = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const row of history) {
      byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.followers_count);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));
  }, [history]);

  const weeklyDelta = useMemo(() => {
    if (accounts.length === 0 || dailyTotals.length === 0) return null;
    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const baseline =
      [...dailyTotals].reverse().find((d) => d.date <= sevenDaysAgo && d.date !== today) ??
      dailyTotals.find((d) => d.date !== today);
    if (!baseline) return null;
    const daysAgo = Math.max(
      1,
      Math.round((Date.parse(today) - Date.parse(baseline.date)) / (1000 * 60 * 60 * 24)),
    );
    return { delta: totals.followers - baseline.total, daysAgo };
  }, [accounts.length, dailyTotals, totals.followers]);

  function perAccountDelta(accountId: string, current: number) {
    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const accountHistory = history
      .filter((h) => h.account_id === accountId)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (accountHistory.length === 0) return null;
    const baseline =
      [...accountHistory].reverse().find((h) => h.date <= sevenDaysAgo && h.date !== today) ??
      accountHistory.find((h) => h.date !== today);
    if (!baseline) return null;
    const daysAgo = Math.max(
      1,
      Math.round((Date.parse(today) - Date.parse(baseline.date)) / (1000 * 60 * 60 * 24)),
    );
    return { delta: current - baseline.followers_count, daysAgo };
  }

  const chartData = dailyTotals.map((d) => ({
    date: formatDateShort(d.date),
    seguidores: d.total,
  }));
  const hasChartData = chartData.length >= 2;

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-8 max-w-5xl">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Métricas</h1>
            <p className="text-muted-foreground">
              Monitoramento agregado das contas Pure Pilates no Instagram
            </p>
          </div>
        </div>

        <section className="space-y-3">
          {loadingAccounts ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando métricas…
            </div>
          ) : accountsError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              ⚠ {accountsError}
            </div>
          ) : (
            <Card className="border-t-4 border-pink-600">
              <CardContent className="space-y-5 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
                    <Instagram className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">Pure Pilates · Instagram</p>
                    <p className="text-xs text-muted-foreground">
                      {accounts.length} contas agregadas
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Seguidores (total)</p>
                    <p className="text-4xl font-bold">
                      {totals.followers.toLocaleString('pt-BR')}
                    </p>
                    {weeklyDelta && weeklyDelta.delta !== 0 && (
                      <div
                        className={`mt-1 flex items-center gap-1 text-sm font-medium ${
                          weeklyDelta.delta > 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {weeklyDelta.delta > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {weeklyDelta.delta > 0 ? '+' : ''}
                        {weeklyDelta.delta.toLocaleString('pt-BR')} em {weeklyDelta.daysAgo}d
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Posts (total)</p>
                    <p className="text-4xl font-bold">
                      {totals.posts.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>
          )}
        </section>

        {!loadingAccounts && !accountsError && accounts.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Por conta
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {accounts.map((acc) => {
                const delta = perAccountDelta(acc.id, acc.followers_count);
                return (
                  <Card key={acc.id} className="bg-muted/30">
                    <CardContent className="space-y-2 pt-4">
                      <div className="flex items-center gap-2">
                        {acc.profile_picture_url ? (
                          <img
                            src={acc.profile_picture_url}
                            alt={acc.username}
                            className="h-8 w-8 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100">
                            <Instagram className="h-4 w-4 text-pink-600" />
                          </div>
                        )}
                        <p className="text-sm font-medium leading-tight">@{acc.username}</p>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Seguidores</p>
                          <p className="text-xl font-bold">
                            {acc.followers_count.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Posts</p>
                          <p className="text-xl font-bold">
                            {acc.media_count.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      {delta && delta.delta !== 0 && (
                        <div
                          className={`flex items-center gap-1 text-xs font-medium ${
                            delta.delta > 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {delta.delta > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {delta.delta > 0 ? '+' : ''}
                          {delta.delta.toLocaleString('pt-BR')} em {delta.daysAgo}d
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Evolução de seguidores</h2>
          {!hasChartData ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Acumulando dados — o gráfico aparece quando tiver pelo menos 2 dias de histórico.
              Snapshots rodam todo dia às 00h.
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      formatter={(v: number) => v.toLocaleString('pt-BR')}
                      labelFormatter={(label) => `Dia ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="seguidores"
                      stroke="#db2777"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
