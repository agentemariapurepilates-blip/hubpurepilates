import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LinhaDeMidia } from '../lib/analise';

/**
 * As linhas de mídia do período, uma por conjunto, prontas para o diagnóstico.
 *
 * Hoje só o Meta chega até aqui. Google Ads e GA4 entram como novas funções de
 * carga devolvendo o mesmo `LinhaDeMidia` — é por isso que o formato é comum e
 * carrega `plataforma`.
 */

/**
 * O PostgREST corta TODA resposta em 1000 linhas. `.range(0, 4999)` não burla
 * esse teto: ele continua devolvendo 1000 e não avisa. A única saída é paginar
 * com ordem estável, e é isso que `buscarPaginado` faz.
 *
 * Aqui o teto morde de verdade: três meses de métrica diária passam de 1000
 * linhas com folga.
 */
const LIMITE_POR_RESPOSTA = 1000;

type LinhaDeMetrica = {
  ad_set_id: string;
  spend: number | null;
  results: number | null;
  impressions: number | null;
  clicks: number | null;
  date: string;
};

async function buscarMetricas(de: string, ate: string): Promise<LinhaDeMetrica[]> {
  const todas: LinhaDeMetrica[] = [];

  for (let inicio = 0; ; inicio += LIMITE_POR_RESPOSTA) {
    const { data, error } = await supabase
      .from('dpp_ad_set_daily_metrics' as never)
      .select('ad_set_id, spend, results, impressions, clicks, date')
      .gte('date', de)
      .lte('date', ate)
      .order('ad_set_id', { ascending: true })
      .order('date', { ascending: true })
      .range(inicio, inicio + LIMITE_POR_RESPOSTA - 1);

    if (error) throw error;

    const lote = (data ?? []) as unknown as LinhaDeMetrica[];
    todas.push(...lote);
    if (lote.length < LIMITE_POR_RESPOSTA) break;
  }

  return todas;
}

type ConjuntoRow = { id: string; nome: string; status: string | null; campaign_id: string | null };
type CampanhaRow = { id: string; nome: string };
type VinculoRow = { ad_set_id: string; unit_id: string; dpp_units: { nome: string } | null };

export function useLinhasDeMidia(de: string, ate: string) {
  return useQuery({
    queryKey: ['midia-paga_linhas', de, ate],
    queryFn: async (): Promise<LinhaDeMidia[]> => {
      const [metricas, conjuntos, campanhas, vinculos] = await Promise.all([
        buscarMetricas(de, ate),
        supabase
          .from('dpp_ad_sets' as never)
          .select('id, nome, status, campaign_id')
          .order('nome')
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as unknown as ConjuntoRow[];
          }),
        supabase
          .from('dpp_campaigns' as never)
          .select('id, nome')
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as unknown as CampanhaRow[];
          }),
        supabase
          .from('dpp_unit_ad_set_link' as never)
          .select('ad_set_id, unit_id, dpp_units (nome)')
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as unknown as VinculoRow[];
          }),
      ]);

      const nomeDaCampanha = new Map(campanhas.map((c) => [c.id, c.nome]));
      const porConjunto = new Map(conjuntos.map((c) => [c.id, c]));
      const unidadeDoConjunto = new Map(
        vinculos.map((v) => [v.ad_set_id, { id: v.unit_id, nome: v.dpp_units?.nome ?? 'sem nome' }]),
      );

      // Soma o período conjunto a conjunto.
      const acumulado = new Map<string, LinhaDeMidia>();

      for (const metrica of metricas) {
        const conjunto = porConjunto.get(metrica.ad_set_id);
        // Métrica de conjunto que sumiu do catálogo: aparece com o id no lugar
        // do nome em vez de ser descartada em silêncio — gasto sem nome ainda é
        // gasto, e some do total se for jogado fora.
        const nome = conjunto?.nome ?? `(conjunto fora do catálogo: ${metrica.ad_set_id})`;

        const atual =
          acumulado.get(metrica.ad_set_id) ??
          ({
            plataforma: 'meta',
            conjuntoId: metrica.ad_set_id,
            conjunto: nome,
            campanha: conjunto?.campaign_id
              ? nomeDaCampanha.get(conjunto.campaign_id) ?? '(campanha desconhecida)'
              : '(sem campanha)',
            status: conjunto?.status ?? null,
            unidadeVinculada: unidadeDoConjunto.get(metrica.ad_set_id) ?? null,
            dias: 0,
            gasto: 0,
            resultados: 0,
            impressoes: 0,
            cliques: 0,
          } satisfies LinhaDeMidia);

        atual.dias += 1;
        atual.gasto += Number(metrica.spend ?? 0);
        atual.resultados += Number(metrica.results ?? 0);
        atual.impressoes += Number(metrica.impressions ?? 0);
        atual.cliques += Number(metrica.clicks ?? 0);

        acumulado.set(metrica.ad_set_id, atual);
      }

      return [...acumulado.values()].sort((a, b) => b.gasto - a.gasto);
    },
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * O catálogo inteiro de campanhas e conjuntos, com ou sem métrica.
 *
 * A tela do Cérebro usa isto para mostrar o que existe na conta ao lado do que
 * o manual descreve. Sem o catálogo, uma campanha que nunca gastou no período
 * escolhido simplesmente não existiria — e é justamente ela que costuma estar
 * ligada e esquecida.
 */
export function useCatalogoDeMidia() {
  return useQuery({
    queryKey: ['midia-paga_catalogo'],
    queryFn: async () => {
      const [conjuntos, campanhas, vinculos] = await Promise.all([
        supabase
          .from('dpp_ad_sets' as never)
          .select('id, nome, status, campaign_id')
          .order('nome')
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as unknown as ConjuntoRow[];
          }),
        supabase
          .from('dpp_campaigns' as never)
          .select('id, nome, objetivo, status')
          .order('nome')
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as unknown as Array<
              CampanhaRow & { objetivo: string | null; status: string | null }
            >;
          }),
        supabase
          .from('dpp_unit_ad_set_link' as never)
          .select('ad_set_id')
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as unknown as Array<{ ad_set_id: string }>;
          }),
      ]);

      const vinculados = new Set(vinculos.map((v) => v.ad_set_id));

      return {
        campanhas,
        conjuntos: conjuntos.map((c) => ({ ...c, vinculado: vinculados.has(c.id) })),
      };
    },
    staleTime: 1000 * 60 * 30,
  });
}
