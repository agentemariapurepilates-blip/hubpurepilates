import { useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Radar, RefreshCw, ExternalLink, Loader2, CheckCircle2, Undo2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import {
  type Mention, type ChannelKey, CHANNELS, SENTIMENT_COLOR,
  brandHealthScore, sentimentBreakdown, netSentiment, channelCounts, channelOf,
  buildAlerts, filterMentions, volumeTimeline, type Alert,
} from './lib/pureMonitorAnalytics';

const SOURCE_LABEL: Record<string, string> = {
  instagram: 'Instagram', google: 'Google', x: 'X', noticias: 'Notícias',
  reddit: 'Reddit', youtube: 'YouTube',
};

function healthColor(score: number) {
  if (score >= 65) return SENTIMENT_COLOR.positivo;
  if (score >= 50) return SENTIMENT_COLOR.neutro;
  return SENTIMENT_COLOR.negativo;
}
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR');

export default function PureMonitor() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [lastCollect, setLastCollect] = useState<string | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('monitor_mentions')
      .select('*')
      .order('published_at', { ascending: false });
    if (error) toast.error('Erro ao carregar menções: ' + error.message);
    const rows = (data ?? []) as Mention[];
    setMentions(rows);
    setLastCollect(rows[0]?.published_at ?? null);
    setLoading(false);
  }

  async function collectNow() {
    setCollecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('pure-monitor-collect');
      if (error) throw error;
      const r = data as { collected?: number; inserted?: number; instagram?: boolean };
      toast.success(`Coleta concluída: +${r.inserted ?? 0} novas (${r.collected ?? 0} verificadas)`);
      await load();
    } catch (e) {
      toast.error('Falha na coleta: ' + (e as Error).message);
    } finally {
      setCollecting(false);
    }
  }

  async function setResolved(id: string, resolved: boolean) {
    const { error } = await supabase
      .from('monitor_mentions')
      .update({ resolved, resolved_at: resolved ? new Date().toISOString() : null })
      .eq('id', id);
    if (error) { toast.error('Não foi possível atualizar: ' + error.message); return; }
    setMentions((prev) => prev.map((m) => (m.id === id ? { ...m, resolved } : m)));
  }

  const health = useMemo(() => brandHealthScore(mentions), [mentions]);
  const breakdown = useMemo(() => sentimentBreakdown(mentions), [mentions]);
  const nss = useMemo(() => netSentiment(mentions), [mentions]);
  const counts = useMemo(() => channelCounts(mentions), [mentions]);
  const openAlerts = useMemo(() => buildAlerts(mentions).length, [mentions]);
  const timeline = useMemo(() => volumeTimeline(mentions, 30), [mentions]);

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Radar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Pure Monitor</h1>
              <p className="text-muted-foreground">
                Social listening &amp; saúde de marca
                {lastCollect && ` · atualizado ${fmtDate(lastCollect)}`}
              </p>
            </div>
          </div>
          <Button onClick={collectNow} disabled={collecting}>
            {collecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Coletar agora
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : mentions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <Radar className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="font-medium">Nenhuma menção ainda</p>
              <p className="text-sm text-muted-foreground">
                Clique em <strong>Coletar agora</strong> para buscar menções no Instagram e na mídia.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="saude">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="saude">Saúde da marca</TabsTrigger>
              <TabsTrigger value="terceiros">Redes de terceiros {counts.terceiros > 0 && <Badge variant="secondary" className="ml-1">{counts.terceiros}</Badge>}</TabsTrigger>
              <TabsTrigger value="nossas">Nossas redes {counts.nossas > 0 && <Badge variant="secondary" className="ml-1">{counts.nossas}</Badge>}</TabsTrigger>
              <TabsTrigger value="midia">Pure na Mídia {counts.midia > 0 && <Badge variant="secondary" className="ml-1">{counts.midia}</Badge>}</TabsTrigger>
              <TabsTrigger value="alertas">Alertas {openAlerts > 0 && <Badge variant="destructive" className="ml-1">{openAlerts}</Badge>}</TabsTrigger>
            </TabsList>

            {/* SAÚDE DA MARCA */}
            <TabsContent value="saude" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-5xl font-bold leading-none" style={{ color: healthColor(health.score) }}>
                      {health.score}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">Brand Health Score</div>
                    <Badge className="mt-2 capitalize" variant="secondary">{health.grade}</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-5xl font-bold leading-none" style={{ color: nss >= 0 ? SENTIMENT_COLOR.positivo : SENTIMENT_COLOR.negativo }}>
                      {nss > 0 ? '+' : ''}{nss}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">Sentimento líquido</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      <span style={{ color: SENTIMENT_COLOR.positivo }}>{breakdown.positivo} pos</span> ·{' '}
                      <span style={{ color: SENTIMENT_COLOR.neutro }}>{breakdown.neutro} neutras</span> ·{' '}
                      <span style={{ color: SENTIMENT_COLOR.negativo }}>{breakdown.negativo} neg</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-5xl font-bold leading-none">{mentions.length}</div>
                    <div className="text-sm text-muted-foreground mt-2">Menções monitoradas</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {counts.terceiros} terceiros · {counts.nossas} nossas · {counts.midia} mídia
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-lg">Como lemos o Brand Health Score</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Índice de 0 a 100 que resume a saúde da marca, combinando 3 fatores:
                  </p>
                  <div className="grid gap-4 md:grid-cols-3">
                    {health.components.map((c) => (
                      <div key={c.label}>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-medium">{c.label}</span>
                          <span className="text-xs text-muted-foreground">pesa {c.weight}%</span>
                        </div>
                        <div className="text-xl font-bold mt-1">{c.value}<span className="text-xs text-muted-foreground font-normal">/100</span></div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                          <div className="h-full" style={{ width: `${c.value}%`, background: healthColor(c.value) }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t text-xs">
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">0–34 crítico</span>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">35–49 frágil</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700">50–64 atenção</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">65–79 saudável</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">80–100 excelente</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Tendência — volume por dia</CardTitle></CardHeader>
                <CardContent>
                  {timeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados suficientes ainda.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={timeline} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="positivo" name="Positivo" stackId="s" fill={SENTIMENT_COLOR.positivo} />
                        <Bar dataKey="neutro" name="Neutro" stackId="s" fill={SENTIMENT_COLOR.neutro} />
                        <Bar dataKey="negativo" name="Negativo" stackId="s" fill={SENTIMENT_COLOR.negativo} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {(['terceiros', 'nossas', 'midia'] as ChannelKey[]).map((ch) => (
              <TabsContent key={ch} value={ch} className="mt-4">
                <ChannelView channel={ch} mentions={mentions.filter((m) => channelOf(m) === ch)} />
              </TabsContent>
            ))}

            <TabsContent value="alertas" className="mt-4">
              <AlertsView mentions={mentions} onResolve={setResolved} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}

// ── Tela de canal ──
function ChannelView({ channel, mentions }: { channel: ChannelKey; mentions: Mention[] }) {
  const [source, setSource] = useState('all');
  const [sentiment, setSentiment] = useState('all');
  const b = sentimentBreakdown(mentions);
  const nss = netSentiment(mentions);

  const sources = Array.from(new Set(mentions.map((m) => m.source)));
  const filtered = filterMentions(mentions, {
    source: source === 'all' ? undefined : source,
    sentiment: sentiment === 'all' ? undefined : sentiment,
  });

  const intro: Record<ChannelKey, string> = {
    terceiros: 'Quando outros perfis marcam @purepilatesbr em publicações no Instagram.',
    nossas: 'Comentários nos posts das nossas contas oficiais.',
    midia: 'Menções na internet em geral — notícias e portais (Google Notícias).',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">{CHANNELS[channel].icon}</span>
        <div>
          <h2 className="text-lg font-semibold">{CHANNELS[channel].label}</h2>
          <p className="text-sm text-muted-foreground">{intro[channel]}</p>
        </div>
      </div>
      {channel === 'terceiros' && (
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
          ℹ️ Aqui aparecem as publicações que <strong>marcam @purepilatesbr</strong>. Posts que usam
          só a hashtag <strong>#purepilates</strong> (sem marcar a conta) exigem a aprovação
          "Instagram Public Content Access" da Meta (App Review) — por isso ainda não entram.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="menções" value={mentions.length} />
        <Kpi label="positivas" value={b.positivo} color={SENTIMENT_COLOR.positivo} />
        <Kpi label="negativas" value={b.negativo} color={SENTIMENT_COLOR.negativo} />
        <Kpi label="sentimento líquido" value={`${nss > 0 ? '+' : ''}${nss}`} color={nss >= 0 ? SENTIMENT_COLOR.positivo : SENTIMENT_COLOR.negativo} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {sources.length > 1 && (
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Fonte" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fontes</SelectItem>
              {sources.map((s) => <SelectItem key={s} value={s}>{SOURCE_LABEL[s] ?? s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={sentiment} onValueChange={setSentiment}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Sentimento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os sentimentos</SelectItem>
            <SelectItem value="positivo">Positivo</SelectItem>
            <SelectItem value="neutro">Neutro</SelectItem>
            <SelectItem value="negativo">Negativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0
          ? <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma menção encontrada.</p>
          : filtered.slice(0, 80).map((m) => <MentionCard key={m.id} m={m} />)}
      </div>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <Card>
      <CardContent className="py-4 text-center">
        <div className="text-2xl font-bold" style={color ? { color } : undefined}>{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

function MentionCard({ m }: { m: Mention }) {
  const color = SENTIMENT_COLOR[m.sentiment_label as keyof typeof SENTIMENT_COLOR] ?? SENTIMENT_COLOR.neutro;
  return (
    <div className="rounded-lg border bg-card p-3 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 flex-wrap">
        <Badge variant="outline" className="capitalize" style={{ color, borderColor: color }}>{m.sentiment_label}</Badge>
        <span>{SOURCE_LABEL[m.source] ?? m.source}</span>
        {m.author && <span>· @{m.author}</span>}
        <span>· {fmtDate(m.published_at)}</span>
        {m.reach > 0 && <span>· {m.reach} interações</span>}
      </div>
      <div className="text-sm">{m.body}</div>
      {m.url && (
        <a href={m.url} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
          Ver publicação <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

// ── Tela de alertas ──
function AlertsView({ mentions, onResolve }: { mentions: Mention[]; onResolve: (id: string, resolved: boolean) => void }) {
  const [showResolved, setShowResolved] = useState(false);
  const alerts = useMemo(() => buildAlerts(mentions, showResolved), [mentions, showResolved]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Tudo que é <strong>negativo</strong> entra aqui — com link para a publicação — e permanece até ser marcado como resolvido.
        </p>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={showResolved} onCheckedChange={setShowResolved} /> mostrar resolvidos
        </label>
      </div>

      {alerts.length === 0
        ? <p className="text-sm text-muted-foreground py-12 text-center">Nenhum alerta ativo. 🎉</p>
        : alerts.map((a) => <AlertCard key={a.id} a={a} onResolve={onResolve} />)}
    </div>
  );
}

function AlertCard({ a, onResolve }: { a: Alert; onResolve: (id: string, resolved: boolean) => void }) {
  const dot = a.level === 'alto' ? 'bg-red-500' : 'bg-amber-500';
  return (
    <div className={`rounded-lg border p-3 flex gap-3 ${a.resolved ? 'opacity-60' : ''}`}>
      <span className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
      <div className="flex-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> {a.type} · {a.channelLabel} · {fmtDate(a.at)}
        </div>
        <div className="text-sm mt-1">{a.text}</div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {a.url
            ? <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Ver publicação <ExternalLink className="h-3 w-3" /></a>
            : <span className="text-xs text-muted-foreground italic">sem link disponível</span>}
          {a.resolved
            ? <Button size="sm" variant="ghost" onClick={() => onResolve(a.id, false)}><Undo2 className="h-3.5 w-3.5" /> Reabrir</Button>
            : <Button size="sm" variant="outline" onClick={() => onResolve(a.id, true)}><CheckCircle2 className="h-3.5 w-3.5" /> Marcar resolvido</Button>}
        </div>
      </div>
    </div>
  );
}
