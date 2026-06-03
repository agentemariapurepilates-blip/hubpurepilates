// Lógica de análise do Pure Monitor (portada de analytics.js do repo pure-monitor).
// Roda no cliente sobre as menções lidas da tabela monitor_mentions.

export interface Mention {
  id: string;
  source: string;
  channel: 'terceiros' | 'nossas' | 'midia' | string;
  category: string | null;
  subtype: string | null;
  author: string | null;
  body: string;
  url: string | null;
  published_at: string;
  reach: number;
  rating: number | null;
  sentiment_label: 'positivo' | 'neutro' | 'negativo' | string;
  sentiment_score: number | null;
  sentiment_irony: boolean;
  resolved: boolean;
}

export type SentimentLabel = 'positivo' | 'neutro' | 'negativo';

export const CHANNELS = {
  terceiros: { label: 'Redes sociais de terceiros', icon: '🌐' },
  nossas: { label: 'Nossas redes sociais', icon: '📲' },
  midia: { label: 'Pure na Mídia', icon: '📰' },
} as const;

export type ChannelKey = keyof typeof CHANNELS;

export interface Breakdown { positivo: number; neutro: number; negativo: number }

export function sentimentBreakdown(mentions: Mention[]): Breakdown {
  const b: Breakdown = { positivo: 0, neutro: 0, negativo: 0 };
  for (const m of mentions) {
    if (m.sentiment_label === 'positivo') b.positivo++;
    else if (m.sentiment_label === 'negativo') b.negativo++;
    else b.neutro++;
  }
  return b;
}

export function netSentiment(mentions: Mention[]): number {
  if (!mentions.length) return 0;
  const b = sentimentBreakdown(mentions);
  return Math.round(((b.positivo - b.negativo) / mentions.length) * 100);
}

export interface HealthComponent { label: string; weight: number; value: number; desc: string }
export interface Health { score: number; grade: string; nss: number; components: HealthComponent[] }

export function brandHealthScore(mentions: Mention[]): Health {
  if (!mentions.length) {
    return { score: 0, grade: 'sem dados', nss: 0, components: [] };
  }
  const b = sentimentBreakdown(mentions);
  const nss = netSentiment(mentions);
  const sentimentComponent = (nss + 100) / 2;
  const positiveRatio = (b.positivo / mentions.length) * 100;
  const negReach = mentions
    .filter((m) => m.sentiment_label === 'negativo')
    .reduce((s, m) => s + (m.reach || 0), 0);
  const totReach = mentions.reduce((s, m) => s + (m.reach || 0), 0) || 1;
  const engagementComponent = 100 - Math.min(100, (negReach / totReach) * 100);

  const score = Math.round(
    sentimentComponent * 0.6 + positiveRatio * 0.25 + engagementComponent * 0.15,
  );

  let grade = 'crítico';
  if (score >= 80) grade = 'excelente';
  else if (score >= 65) grade = 'saudável';
  else if (score >= 50) grade = 'atenção';
  else if (score >= 35) grade = 'frágil';

  const components: HealthComponent[] = [
    { label: 'Sentimento geral', weight: 60, value: Math.round(sentimentComponent),
      desc: 'equilíbrio entre elogios e críticas (sentimento líquido reescalado de 0 a 100)' },
    { label: 'Proporção de positivas', weight: 25, value: Math.round(positiveRatio),
      desc: '% das menções que são elogios' },
    { label: 'Impacto das negativas', weight: 15, value: Math.round(engagementComponent),
      desc: 'quanto as críticas repercutem — 100 = críticas com pouco alcance' },
  ];

  return { score, grade, nss, components };
}

export function channelOf(m: Mention): ChannelKey {
  if (m.channel === 'terceiros' || m.channel === 'nossas' || m.channel === 'midia') {
    return m.channel;
  }
  if (m.source === 'noticias') return 'midia';
  if (m.source === 'google') return 'nossas';
  if (m.source === 'instagram' && m.category === 'comentario') return 'nossas';
  return 'terceiros';
}

export function channelCounts(mentions: Mention[]): Record<ChannelKey, number> {
  const c: Record<ChannelKey, number> = { terceiros: 0, nossas: 0, midia: 0 };
  for (const m of mentions) c[channelOf(m)]++;
  return c;
}

export interface Alert {
  id: string;
  level: 'alto' | 'médio';
  channel: ChannelKey;
  channelLabel: string;
  type: string;
  text: string;
  author: string | null;
  source: string;
  reach: number;
  url: string | null;
  at: string;
  resolved: boolean;
}

function alertType(m: Mention, channel: ChannelKey): string {
  if (m.category === 'avaliacao') return 'avaliação negativa';
  if (m.category === 'comentario') return 'comentário negativo';
  if (channel === 'midia') return 'publicação negativa na mídia';
  return 'menção negativa';
}

export function buildAlerts(mentions: Mention[], includeResolved = false): Alert[] {
  return mentions
    .filter((m) => m.sentiment_label === 'negativo')
    .filter((m) => includeResolved || !m.resolved)
    .map((m) => {
      const channel = channelOf(m);
      return {
        id: m.id,
        level: (m.reach || 0) >= 250 ? 'alto' : 'médio',
        channel,
        channelLabel: CHANNELS[channel].label,
        type: alertType(m, channel),
        text: m.body,
        author: m.author,
        source: m.source,
        reach: m.reach || 0,
        url: m.url && m.url !== '#' ? m.url : null,
        at: m.published_at,
        resolved: m.resolved,
      } as Alert;
    })
    .sort((a, b) => {
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
      if (b.reach !== a.reach) return b.reach - a.reach;
      return new Date(b.at).getTime() - new Date(a.at).getTime();
    });
}

export function filterMentions(
  mentions: Mention[],
  f: { channel?: ChannelKey; source?: string; category?: string; sentiment?: string },
): Mention[] {
  return mentions
    .filter((m) => (f.channel ? channelOf(m) === f.channel : true))
    .filter((m) => (f.source ? m.source === f.source : true))
    .filter((m) => (f.category ? m.category === f.category : true))
    .filter((m) => (f.sentiment ? m.sentiment_label === f.sentiment : true))
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
}

export const SENTIMENT_COLOR: Record<SentimentLabel, string> = {
  positivo: '#AAC338',
  neutro: '#DB9828',
  negativo: '#C12030',
};
