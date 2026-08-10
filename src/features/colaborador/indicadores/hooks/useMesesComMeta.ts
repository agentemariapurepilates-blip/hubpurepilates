import { useQuery } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';

/**
 * Os meses que o seletor da aba Metas deve oferecer.
 *
 * POR QUE VEM DO BANCO, e não de um laço de 12 meses:
 * a versão anterior montava "o mês atual e os 11 SEGUINTES". Como as metas são
 * cadastradas mês a mês e não com um ano de antecedência, isso oferecia 11
 * meses vazios e ESCONDIA todos os meses passados — em agosto/2026 havia meta
 * em 7 meses anteriores (janeiro a julho) e nenhum deles aparecia na lista.
 * Quem quisesse conferir a meta de junho não tinha como.
 *
 * A lista sai dos meses que realmente têm meta global, mais o mês corrente e o
 * seguinte. Os dois últimos entram mesmo sem meta cadastrada: é justamente
 * neles que alguém vai olhar para descobrir que ainda falta cadastrar.
 */
export function useMesesComMeta() {
  return useQuery({
    queryKey: ['indicadores_meses-com-meta'],
    queryFn: async (): Promise<string[]> => {
      // Só a coluna `date`, e ordenada: o que interessa é o conjunto de meses.
      // São ~124 linhas por mês, então o teto de 1000 por resposta seria
      // atingido em menos de um ano — daí a paginação.
      const meses = new Set<string>();

      for (let inicio = 0; ; inicio += 1000) {
        const { data, error } = await supabaseIndicadores
          .from('daily_goals')
          .select('date')
          .is('unit_id', null)
          .order('date', { ascending: false })
          .range(inicio, inicio + 999);

        if (error) throw error;

        const lote = data ?? [];
        for (const linha of lote) meses.add((linha.date as string).slice(0, 7));
        if (lote.length < 1000) break;
      }

      const agora = new Date();
      const somarMeses = (n: number) => {
        const d = new Date(agora.getFullYear(), agora.getMonth() + n, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      };

      meses.add(somarMeses(0));
      meses.add(somarMeses(1));

      // Mais recente primeiro: quem abre a tela quer o mês corrente, e não
      // janeiro do ano passado.
      return [...meses].sort().reverse();
    },
    // A lista de meses muda no máximo uma vez por mês.
    staleTime: 1000 * 60 * 60,
  });
}
