// Página /minha-area/dashboard — réplica 1:1 do /dashboard do projeto externo,
// adaptada pra Vite/React Router + RLS multi-unidade.

import { useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { resolveRange, type Preset } from './lib/date-range';
import { aggregate } from './lib/aggregate';
import { KpiCard, fmtBrl, fmtInt } from './components/KpiCard';
import { ChartDaily } from './components/ChartDaily';
import { PeriodSelector } from './components/PeriodSelector';
import { LastUpdateBanner } from './components/LastUpdateBanner';
import { UnitPicker, type UnitOption } from './components/UnitPicker';
import { normalizeLink } from '@/lib/dpp-link';

const VALID_PRESETS: Preset[] = ['ontem', '7d', '30d', '90d', '180d'];

type LinkRow = { ad_set_id: string };

type UnitWithLink = UnitOption & {
  // PostgREST retorna objeto OU array — normalizar antes de usar.
  dpp_unit_ad_set_link: LinkRow | LinkRow[] | null;
};

export default function DashboardMidiaAdicional() {
  const [sp, setSp] = useSearchParams();

  const { data: units, isLoading: loadingUnits } = useQuery({
    queryKey: ['dpp_dashboard_units'],
    queryFn: async (): Promise<UnitWithLink[]> => {
      const { data, error } = await supabase
        .from('dpp_units' as never)
        .select('id, external_id, nome, bairro, cidade, dpp_unit_ad_set_link (ad_set_id)')
        .order('nome');
      if (error) throw error;
      return (data ?? []) as unknown as UnitWithLink[];
    },
  });

  const selectedExternalId = sp.get('unit');
  const selectedUnit = useMemo(
    () => (units ?? []).find((u) => u.external_id === selectedExternalId) ?? null,
    [units, selectedExternalId],
  );

  // Auto-selecionar quando o usuário só tem 1 unidade e nenhuma está na URL
  useEffect(() => {
    if (!loadingUnits && units && units.length === 1 && !selectedExternalId) {
      const next = new URLSearchParams(sp);
      next.set('unit', units[0].external_id);
      setSp(next, { replace: true });
    }
  }, [loadingUnits, units, selectedExternalId, sp, setSp]);

  const range = useMemo(() => {
    const from = sp.get('from');
    const to = sp.get('to');
    if (from && to) return resolveRange({ from, to });
    const presetParam = sp.get('range');
    const preset = (VALID_PRESETS.includes(presetParam as Preset) ? presetParam : '7d') as Preset;
    return resolveRange({ preset });
  }, [sp]);

  const adSetIds = normalizeLink(selectedUnit?.dpp_unit_ad_set_link).map((l) => l.ad_set_id);

  const { data: metrics } = useQuery({
    queryKey: ['dpp_dashboard_metrics', selectedUnit?.id, range.from, range.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dpp_ad_set_daily_metrics' as never)
        .select('date, impressions, clicks, spend, results, reach, synced_at')
        .in('ad_set_id', adSetIds.length > 0 ? adSetIds : ['00000000-0000-0000-0000-000000000000'])
        .gte('date', range.from)
        .lte('date', range.to)
        .order('date');
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        date: string; impressions: number; clicks: number; spend: number;
        results: number; reach: number; synced_at: string;
      }>;
    },
    enabled: !!selectedUnit && adSetIds.length > 0,
  });

  const rows = (metrics ?? []).map((r) => ({
    date: r.date,
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    spend: Number(r.spend),
    results: r.results,
    reach: Number(r.reach),
    synced_at: r.synced_at,
  }));
  const agg = aggregate(rows.map(({ synced_at: _s, ...m }) => m));
  const lastSync = rows.length ? rows[rows.length - 1].synced_at : undefined;
  const isYesterdayMode = range.mode === 'absolute_day' && range.from === range.to;

  // Usuário sem unidades atribuídas
  if (!loadingUnits && (!units || units.length === 0)) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <h1 className="text-xl font-heading font-bold mb-2">Sem acesso a relatório</h1>
          <p className="text-muted-foreground">
            Nenhuma unidade atribuída a você. Contate o administrador.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
        <div className="bg-pure-red/5 border border-pure-red/20 text-pure-black text-sm rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
          <span className="font-bold text-pure-red shrink-0">Mídia Adicional</span>
          <span className="text-pure-gray">
            Os números abaixo são apenas das campanhas de mídia adicional que a sua unidade roda. Não incluem as campanhas globais da Pure Pilates.
          </span>
        </div>

        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide font-bold text-pure-gray">Unidade</div>
            <div className="mt-1">
              <UnitPicker
                units={units ?? []}
                selectedId={selectedUnit?.id ?? null}
                onSelect={(u) => {
                  const next = new URLSearchParams(sp);
                  next.set('unit', u.external_id);
                  setSp(next);
                }}
              />
            </div>
          </div>
          <PeriodSelector active={range.preset ?? 'custom'} />
        </div>

        {!selectedUnit ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-pure-gray">Selecione uma unidade pra ver o relatório.</p>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-wide font-bold text-pure-gray">
                  {isYesterdayMode ? 'Dados de' : `Visão geral · ${range.preset ?? 'personalizado'}`}
                </div>
                <h3 className="text-2xl font-bold text-pure-black mt-1">
                  {range.from} {range.to !== range.from && `→ ${range.to}`}
                </h3>
                <LastUpdateBanner lastSyncAt={lastSync} />
              </div>
            </div>

            {adSetIds.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <p className="text-pure-gray">
                  Sua unidade ainda não tem conjunto de anúncio vinculado. Contate o administrador.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <KpiCard label="Aulas experimentais" value={fmtInt(agg.results)} hint="agendadas no período"
                    info="Quantas pessoas preencheram o formulário de aula experimental vindas dos anúncios. Conta o evento de cadastro completo registrado pelo Pixel."
                    accent />
                  <KpiCard label="Custo por aula" value={fmtBrl(agg.cost_per_result)} hint="média do período"
                    info="Quanto você investe em média para gerar uma aula experimental agendada. Quanto menor, mais eficiente o anúncio." />
                  <KpiCard label="Gasto" value={fmtBrl(agg.spend)} hint="total no período"
                    info="Quanto a sua unidade gastou em anúncios no Meta (Facebook + Instagram) somando todos os dias do período selecionado." />
                  <KpiCard label="Alcance" value={fmtInt(agg.reach)} hint="máximo diário"
                    info="Número máximo de pessoas únicas que viram o anúncio em um dia do período. Não é a soma dos dias — uma pessoa que viu em vários dias só conta uma vez." />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <KpiCard label="Impressões" value={fmtInt(agg.impressions)} size="sm"
                    info="Quantas vezes o anúncio apareceu na tela no período. A mesma pessoa pode contar várias vezes." />
                  <KpiCard label="Cliques" value={fmtInt(agg.clicks)} size="sm"
                    info="Quantas vezes alguém clicou no anúncio. Inclui cliques em links, no perfil e em outras áreas do anúncio." />
                  <KpiCard label="CPM" value={fmtBrl(agg.cpm)} size="sm"
                    info="Custo por mil impressões. Quanto custou em média para o anúncio aparecer mil vezes." />
                  <KpiCard label="CPC" value={fmtBrl(agg.cpc)} size="sm"
                    info="Custo por clique. Quanto você paga em média por cada pessoa que clica no anúncio." />
                </div>
                {!isYesterdayMode && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-bold text-pure-black mb-4">Desempenho diário</h3>
                    <ChartDaily rows={rows.map((r) => ({ date: r.date, spend: r.spend, results: r.results }))} />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </MainLayout>
  );
}
