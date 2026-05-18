import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Instagram, Music2, Layers, AlertTriangle } from 'lucide-react';

type Platform = 'instagram' | 'tiktok' | 'total';

interface ThemeItem {
  tema: string;
  volume: number;
  citacao?: string;
}

interface UnitItem {
  unidade: string;
  mencoes: number;
}

interface CriticalAlert {
  tipo: string;
  descricao: string;
  comentario_ids?: string[];
  platform?: string;
}

interface Recommendation {
  prioridade: 'alta' | 'media' | 'baixa';
  o_que: string;
  por_que: string;
  quem: string;
  prazo: string;
}

interface BrandHealthReport {
  id: string;
  period_year: number;
  period_month: number;
  platform: Platform;
  comments_total: number;
  promoters_count: number;
  promoters_pct: number;
  neutrals_count: number;
  neutrals_pct: number;
  detractors_count: number;
  detractors_pct: number;
  excluded_count: number;
  health_score: number;
  net_sentiment: number;
  volume_index: number | null;
  engagement_weighted_sentiment: number | null;
  top_themes_positive: ThemeItem[];
  top_themes_negative: ThemeItem[];
  top_units_positive: UnitItem[];
  top_units_negative: UnitItem[];
  critical_alerts: CriticalAlert[];
  recommendations: Recommendation[];
  limitations: string | null;
  raw_report_md: string | null;
  created_at: string;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  total: 'Consolidado',
};

const PLATFORM_ICON: Record<Platform, typeof Instagram> = {
  instagram: Instagram,
  tiktok: Music2,
  total: Layers,
};

const PLATFORM_ORDER: Platform[] = ['total', 'instagram', 'tiktok'];

function healthBand(score: number): { label: string; tone: string; bg: string } {
  if (score >= 70) return { label: 'Saudável', tone: 'text-emerald-700', bg: 'bg-emerald-100' };
  if (score >= 50) return { label: 'Atenção', tone: 'text-amber-700', bg: 'bg-amber-100' };
  if (score >= 30) return { label: 'Alerta', tone: 'text-orange-700', bg: 'bg-orange-100' };
  return { label: 'Crítico', tone: 'text-red-700', bg: 'bg-red-100' };
}

function priorityBadge(prio: Recommendation['prioridade']) {
  if (prio === 'alta') return 'destructive';
  if (prio === 'media') return 'default';
  return 'secondary';
}

export default function SaudeDeMarca() {
  const [reports, setReports] = useState<BrandHealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    setError(null);

    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          order: (col: string, opts: { ascending: boolean }) => {
            order: (col: string, opts: { ascending: boolean }) => Promise<{
              data: BrandHealthReport[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    })
      .from('brand_health_reports')
      .select('*')
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setReports(data ?? []);
    setLoading(false);
  }

  const grouped = groupByPeriod(reports);

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-6xl">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Saúde de Marca</h1>
            <p className="text-muted-foreground">
              Buzz Monitor · NPS adaptado dos comentários de Instagram e TikTok
            </p>
          </div>
        </div>

        {loading && (
          <div className="text-sm text-muted-foreground">Carregando relatórios…</div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Erro ao carregar relatórios: {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
            <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Nenhum relatório ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Aguardando o workflow do n8n gravar o primeiro relatório mensal.
            </p>
          </div>
        )}

        {grouped.map(({ year, month, items }) => (
          <PeriodCard key={`${year}-${month}`} year={year} month={month} items={items} />
        ))}
      </div>
    </MainLayout>
  );
}

function groupByPeriod(reports: BrandHealthReport[]) {
  const map = new Map<string, { year: number; month: number; items: BrandHealthReport[] }>();
  for (const r of reports) {
    const key = `${r.period_year}-${r.period_month}`;
    if (!map.has(key)) {
      map.set(key, { year: r.period_year, month: r.period_month, items: [] });
    }
    map.get(key)!.items.push(r);
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

function PeriodCard({
  year,
  month,
  items,
}: {
  year: number;
  month: number;
  items: BrandHealthReport[];
}) {
  const sorted = [...items].sort(
    (a, b) => PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform)
  );
  const total = sorted.find((i) => i.platform === 'total') ?? sorted[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {MONTH_NAMES[month - 1]} de {year}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {sorted.map((r) => (
            <PlatformBlock key={r.id} report={r} />
          ))}
        </div>

        <Accordion type="multiple" className="w-full">
          {total.top_themes_positive?.length > 0 && (
            <AccordionItem value="themes-positive">
              <AccordionTrigger>
                Temas positivos ({total.top_themes_positive.length})
              </AccordionTrigger>
              <AccordionContent>
                <ThemesList items={total.top_themes_positive} tone="positive" />
              </AccordionContent>
            </AccordionItem>
          )}

          {total.top_themes_negative?.length > 0 && (
            <AccordionItem value="themes-negative">
              <AccordionTrigger>
                Temas negativos ({total.top_themes_negative.length})
              </AccordionTrigger>
              <AccordionContent>
                <ThemesList items={total.top_themes_negative} tone="negative" />
              </AccordionContent>
            </AccordionItem>
          )}

          {(total.top_units_positive?.length > 0 || total.top_units_negative?.length > 0) && (
            <AccordionItem value="units">
              <AccordionTrigger>Unidades mais citadas</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <UnitList title="Positivas" items={total.top_units_positive} tone="positive" />
                  <UnitList title="Negativas" items={total.top_units_negative} tone="negative" />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {total.critical_alerts?.length > 0 && (
            <AccordionItem value="alerts">
              <AccordionTrigger className="text-red-700">
                <span className="inline-flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alertas críticos ({total.critical_alerts.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {total.critical_alerts.map((a, i) => (
                    <li key={i} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                      <div className="font-medium text-red-800">{a.tipo}</div>
                      <div className="text-red-700">{a.descricao}</div>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {total.recommendations?.length > 0 && (
            <AccordionItem value="recommendations">
              <AccordionTrigger>
                Recomendações ({total.recommendations.length})
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3">
                  {total.recommendations.map((r, i) => (
                    <li key={i} className="rounded-lg border p-3 text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={priorityBadge(r.prioridade)}>{r.prioridade}</Badge>
                        <span className="font-medium">{r.o_que}</span>
                      </div>
                      <div className="text-muted-foreground">{r.por_que}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.quem} · prazo: {r.prazo}
                      </div>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {total.limitations && (
            <AccordionItem value="limitations">
              <AccordionTrigger>Limitações da análise</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {total.limitations}
                </p>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function PlatformBlock({ report }: { report: BrandHealthReport }) {
  const Icon = PLATFORM_ICON[report.platform];
  const band = healthBand(report.health_score);

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{PLATFORM_LABEL[report.platform]}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${band.bg} ${band.tone}`}>
          {band.label}
        </span>
      </div>

      <div>
        <div className="text-3xl font-bold leading-none">
          {Number(report.health_score).toFixed(1)}
          <span className="text-base text-muted-foreground font-normal"> / 100</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Net Sentiment: {Number(report.net_sentiment).toFixed(1)}
          {report.volume_index != null && ` · Volume idx: ${Number(report.volume_index).toFixed(2)}`}
        </div>
      </div>

      <div className="space-y-1.5">
        <Bar label="Promotores" pct={report.promoters_pct} count={report.promoters_count} color="bg-emerald-500" />
        <Bar label="Neutros" pct={report.neutrals_pct} count={report.neutrals_count} color="bg-slate-400" />
        <Bar label="Detratores" pct={report.detractors_pct} count={report.detractors_count} color="bg-red-500" />
      </div>

      <div className="text-xs text-muted-foreground pt-1 border-t">
        {report.comments_total} comentários analisados
        {report.excluded_count > 0 && ` · ${report.excluded_count} excluídos`}
      </div>
    </div>
  );
}

function Bar({ label, pct, count, color }: { label: string; pct: number; count: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {Number(pct).toFixed(1)}% · {count}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, Number(pct))}%` }} />
      </div>
    </div>
  );
}

function ThemesList({ items, tone }: { items: ThemeItem[]; tone: 'positive' | 'negative' }) {
  const accent = tone === 'positive' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50';
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className={`rounded-lg border ${accent} p-3 text-sm`}>
          <div className="flex justify-between items-start gap-2">
            <span className="font-medium">{t.tema}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {t.volume} menções
            </span>
          </div>
          {t.citacao && (
            <p className="text-xs text-muted-foreground italic mt-1">"{t.citacao}"</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function UnitList({
  title,
  items,
  tone,
}: {
  title: string;
  items: UnitItem[];
  tone: 'positive' | 'negative';
}) {
  const dot = tone === 'positive' ? 'bg-emerald-500' : 'bg-red-500';
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma menção relevante</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((u, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                {u.unidade}
              </span>
              <span className="text-xs text-muted-foreground">{u.mencoes}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
