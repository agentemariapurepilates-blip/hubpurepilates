import { useQuery } from '@tanstack/react-query';
import { supabaseIndicadores } from '@/integrations/supabase/indicadores';
import {
  COLUNA_MATRICULADOS,
  contar,
  mesAnterior,
  mesEmSaoPaulo,
  montarEmailDeClusters,
} from '../../../../../supabase/functions/cluster-relatorio-mensal/email';
import {
  COLUNA_EXPERIMENTAIS,
  hojeEmSaoPaulo,
  janelaDeTresMeses,
  mediaPorUnidade,
  montarEmailExperimentais,
} from '../../../../../supabase/functions/experimentais-relatorio-mensal/email';

/**
 * A prévia dos relatórios de cluster, montada NO NAVEGADOR.
 *
 * POR QUE AQUI, E NÃO PELA EDGE FUNCTION: a prévia não precisa de nada que só
 * o servidor tenha. Os números saem do banco de indicadores, que o Hub já lê
 * anonimamente do navegador — é o que toda a área de Dashboard faz —, e a
 * montagem do HTML é função pura. Fazer isso virar uma chamada de rede só
 * criava uma dependência de deploy para ver uma tela.
 *
 * O que continua exigindo a function publicada é o ENVIO (o teste e o cron):
 * esse sim precisa da lista de destinatários, que mora no banco do Hub atrás
 * de RLS, e do token do webhook do n8n.
 *
 * O QUE GARANTE QUE A PRÉVIA NÃO MENTE: as duas pontas importam o MESMO
 * email.ts — mesma coluna do banco, mesmo cálculo de média, mesma janela de
 * meses, mesmo HTML. Ver fonte-dos-dados.test.ts, que falha se algum desses
 * quatro voltar a ter uma cópia dentro do index.ts da function.
 *
 * POR QUE ESTE ARQUIVO MORA EM features/colaborador/indicadores: é o único
 * lugar de onde o cliente `supabaseIndicadores` pode ser importado — a trava
 * em sem-escrita.test.ts existe para garantir que ninguém escreva naquele
 * banco, e ela só varre esta pasta. Só leitura aqui, como manda a regra.
 */

/** Assunto e corpo prontos, do mesmo jeito que a function os devolveria. */
export interface EmailMontado {
  assunto: string;
  corpo: string;
}

/**
 * O valor de cada unidade no último dia COM DADO do mês.
 *
 * Duas consultas, e não uma: o mês inteiro daria ~475 unidades × 31 dias = 14
 * mil linhas, acima do teto do PostgREST. Como o indicador é do último dia, a
 * primeira consulta descobre qual é esse dia e a segunda traz ~475 linhas.
 *
 * É a mesma estratégia das duas Edge Functions. Não dá para compartilhar o
 * código: lá é `fetch` no REST do PostgREST, aqui é o cliente supabase-js. O
 * que precisa mesmo ser igual — o nome da coluna — vem importado.
 */
async function valoresDoMes(mes: string, coluna: string): Promise<Map<number, number>> {
  const [ano, m] = mes.split('-').map(Number);
  const ultimoDia = new Date(Date.UTC(ano, m, 0)).toISOString().slice(0, 10);

  const { data: dias, error: erroDia } = await supabaseIndicadores
    .from('raw_consolidated_daily')
    .select('date')
    .gte('date', `${mes}-01`)
    .lte('date', ultimoDia)
    .order('date', { ascending: false })
    .limit(1);

  if (erroDia) throw erroDia;
  if (!dias || dias.length === 0) return new Map();

  const { data, error } = await supabaseIndicadores
    .from('raw_consolidated_daily')
    .select(`unit_id, ${coluna}`)
    .eq('date', (dias[0] as { date: string }).date)
    // range explícito: são ~475 unidades hoje, mas o padrão do Supabase é 1000
    // e a rede cresce. Sem isto o relatório perderia unidades em silêncio.
    .range(0, 4999);

  if (error) throw error;

  // Duas conversões, e não uma: o supabase-js tenta deduzir o formato da linha
  // lendo a string do `select` em tempo de tipo, e com a coluna vindo por
  // parâmetro ele desiste e devolve um ParserError. O dado em si é o mesmo de
  // sempre — o que se perdeu foi a checagem estática do nome da coluna, e essa
  // é justamente a que fonte-dos-dados.test.ts faz.
  const mapa = new Map<number, number>();
  for (const linha of (data ?? []) as unknown as Array<Record<string, unknown>>) {
    mapa.set(Number(linha.unit_id), Number(linha[coluna]));
  }
  return mapa;
}

async function nomesDasUnidades(): Promise<Map<number, string>> {
  // Sem filtro de `active`, igual à function: o nome é só para rotular quem
  // apareceu nos dados, e uma unidade desativada no meio do período ficaria
  // como "Unidade 412" no e-mail.
  const { data, error } = await supabaseIndicadores
    .from('units')
    .select('id, name')
    .range(0, 4999);

  if (error) throw error;
  return new Map(((data ?? []) as Array<{ id: number; name: string }>).map((u) => [u.id, u.name]));
}

/** Opções comuns: o dado do relatório muda uma vez por mês. */
const CACHE = {
  retry: false,
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

/** A prévia do relatório de clusters de matriculados. */
export function usePreviaDeClusters() {
  return useQuery<EmailMontado>({
    queryKey: ['previa-relatorio', 'clusters'],
    ...CACHE,
    queryFn: async () => {
      // O cron roda no dia 1, então o mês que interessa é o ANTERIOR ao
      // corrente: é o que acabou de fechar. Usar o corrente traria um dia só.
      const mesFechado = mesAnterior(mesEmSaoPaulo());
      const mesDeComparacao = mesAnterior(mesFechado);

      const [atual, anterior] = await Promise.all([
        valoresDoMes(mesFechado, COLUNA_MATRICULADOS),
        valoresDoMes(mesDeComparacao, COLUNA_MATRICULADOS),
      ]);

      if (atual.size === 0) {
        throw new Error(
          `Nenhuma unidade tem dado em ${mesFechado}. O relatório não sairia neste mês.`,
        );
      }

      // `|| 0` porque a function faz o mesmo: aqui o nulo conta como unidade
      // no Cluster 5, e não como unidade ausente.
      const numeros = (m: Map<number, number>) => [...m.values()].map((v) => v || 0);

      return montarEmailDeClusters(mesFechado, contar(numeros(atual)), contar(numeros(anterior)));
    },
  });
}

/** A prévia do relatório de aulas experimentais. */
export function usePreviaDeExperimentais() {
  return useQuery<EmailMontado>({
    queryKey: ['previa-relatorio', 'experimentais'],
    ...CACHE,
    queryFn: async () => {
      const meses = janelaDeTresMeses(hojeEmSaoPaulo().slice(0, 7));

      const [porMes, nomes] = await Promise.all([
        Promise.all(meses.map((mes) => valoresDoMes(mes, COLUNA_EXPERIMENTAIS))),
        nomesDasUnidades(),
      ]);

      // Nulo é ausência de medição, e tratá-lo como zero rebaixaria a unidade
      // na média. Zero, esse sim, entra: a unidade operou e não teve nenhuma.
      const semNulos = porMes.map((mes) => {
        const limpo = new Map<number, number>();
        for (const [unitId, valor] of mes) {
          if (Number.isFinite(valor)) limpo.set(unitId, valor);
        }
        return limpo;
      });

      const linhas = mediaPorUnidade(semNulos, nomes);

      if (linhas.length === 0) {
        throw new Error(
          `Nenhuma unidade tem dado em ${meses.join(', ')}. O relatório não sairia neste mês.`,
        );
      }

      return montarEmailExperimentais(meses, linhas);
    },
  });
}
