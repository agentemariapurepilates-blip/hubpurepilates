import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LinhaDeMidia } from '../lib/analise';

import desempenho from '../dados/desempenho.json';

/**
 * O desempenho que o relatório analisa — Meta por conjunto, Google por
 * campanha.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE NÃO SAI MAIS DO BANCO DO HUB
 * ────────────────────────────────────────────────────────────────────────────
 * A versão anterior lia `dpp_ad_set_daily_metrics`. Em 24/08/2026 essa tabela
 * tinha métrica de 6 dos 112 conjuntos da conta, todos de uma campanha só, e
 * somava R$ 1.437 em agosto contra R$ 65.315 de gasto real.
 *
 * O relatório não quebrava: analisava 2% da conta e mostrava o resultado com a
 * mesma cara de quem viu tudo. Nada na tela denunciava. A carga viva continua
 * de pé no Supabase e pode voltar a ser a fonte no dia em que cobrir a conta
 * inteira; até lá, o arquivo gerado por `scripts/atualiza-desempenho.mjs` é o
 * único que cobre.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * O VÍNCULO COM A UNIDADE CONTINUA VINDO DO HUB
 * ────────────────────────────────────────────────────────────────────────────
 * Quem liga conjunto a unidade é a tela de Mídia Adicional, e o vínculo mora
 * em `dpp_unit_ad_set_link` — dado do Hub, não da plataforma. Ele é lido ao
 * vivo de propósito: alguém pode vincular um conjunto hoje e esperar que o
 * relatório de amanhã reflita isso sem ninguém rodar script nenhum.
 */

interface DiaBruto {
  data: string;
  plataforma: string;
  granularidade: string;
  conjuntoId: string;
  conjunto: string;
  campanha: string;
  status: string | null;
  gasto: number;
  impressoes: number;
  cliques: number;
  resultados: number;
}

const DIAS = desempenho.dias as DiaBruto[];

/** Até quando o dado de cada plataforma vai, e em que grão ele existe. */
export const COBERTURA = desempenho.plataformas as Record<
  string,
  { granularidade: string; objetos: number; ultimo_dia: string; gasto: number }
>;

export const LIDO_EM = desempenho.lido_em as string;
export const PERIODO_BAIXADO = { de: desempenho.de as string, ate: desempenho.ate as string };

/** O arquivo diz 'google'; o manual chama de 'google-ads'. */
const PLATAFORMA: Record<string, LinhaDeMidia['plataforma']> = {
  meta: 'meta',
  google: 'google-ads',
};

type VinculoRow = { ad_set_id: string; unit_id: string; dpp_units: { nome: string } | null };

export function useDesempenhoDeMidia(de: string, ate: string) {
  return useQuery({
    queryKey: ['midia-paga_desempenho', de, ate],
    queryFn: async (): Promise<LinhaDeMidia[]> => {
      const vinculos = await supabase
        .from('dpp_unit_ad_set_link' as never)
        .select('ad_set_id, unit_id, dpp_units (nome)')
        .then(({ data, error }) => {
          if (error) throw error;
          return (data ?? []) as unknown as VinculoRow[];
        });

      const unidadeDoConjunto = new Map(
        vinculos.map((v) => [v.ad_set_id, { id: v.unit_id, nome: v.dpp_units?.nome ?? 'sem nome' }]),
      );

      const acumulado = new Map<string, LinhaDeMidia>();

      for (const dia of DIAS) {
        if (dia.data < de || dia.data > ate) continue;

        const plataforma = PLATAFORMA[dia.plataforma];
        // Plataforma que o manual não conhece: ignorar em silêncio esconderia
        // gasto, então ela para aqui e o console diz o porquê.
        if (!plataforma) {
          console.warn(`[midia-paga] plataforma desconhecida no desempenho: ${dia.plataforma}`);
          continue;
        }

        // A chave inclui a plataforma: nada garante que um id de campanha do
        // Google não colida com um id de conjunto do Meta.
        const chave = `${dia.plataforma}:${dia.conjuntoId}`;

        const atual =
          acumulado.get(chave) ??
          ({
            plataforma,
            granularidade: dia.granularidade === 'campanha' ? 'campanha' : 'conjunto',
            conjuntoId: dia.conjuntoId,
            conjunto: dia.conjunto,
            campanha: dia.campanha,
            status: dia.status,
            // Só conjunto do Meta tem vínculo com unidade: o vínculo é feito
            // por conjunto, e campanha de Google não é conjunto de coisa
            // nenhuma.
            unidadeVinculada: unidadeDoConjunto.get(dia.conjuntoId) ?? null,
            dias: 0,
            gasto: 0,
            resultados: 0,
            impressoes: 0,
            cliques: 0,
          } satisfies LinhaDeMidia);

        atual.dias += 1;
        atual.gasto += dia.gasto;
        atual.resultados += dia.resultados;
        atual.impressoes += dia.impressoes;
        atual.cliques += dia.cliques;

        acumulado.set(chave, atual);
      }

      return [...acumulado.values()].sort((a, b) => b.gasto - a.gasto);
    },
    staleTime: 1000 * 60 * 30,
  });
}
