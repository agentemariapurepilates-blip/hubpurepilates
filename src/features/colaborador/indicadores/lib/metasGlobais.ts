// Regras da edição da aba Metas, sem React — para poderem ser testadas.
//
// A grade guarda o RASCUNHO como texto ("" = célula vazia) e o ORIGINAL como
// número vindo do banco. Só vai para o servidor o que difere entre os dois.

import type { MetaGlobalParaSalvar } from './indicadoresProxy';

/** Chave de uma célula da grade: "dia-metrica". */
export const chaveDaCelula = (dia: number, metrica: string) => `${dia}-${metrica}`;

/** Quantos meses à frente o seletor oferece quando a edição está ligada. */
export const MESES_FUTUROS = 12;

function somarMeses(base: Date, n: number): string {
  const d = new Date(base.getFullYear(), base.getMonth() + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Meses do seletor: os que já têm meta (para conferir o passado) mais o
 * corrente e os próximos 12 (para cadastrar o futuro).
 *
 * O `useMesesComMeta` sozinho oferece só até o mês seguinte, e o motivo dele é
 * bom para CONSULTA: 11 meses vazios na lista só atrapalhavam. Para CADASTRAR é
 * o contrário — sem o mês futuro na lista, não há onde lançar a meta dele.
 *
 * Ordem cronológica, do mais antigo ao mais distante.
 */
export function mesesParaEdicao(mesesComMeta: string[] | undefined, hoje: Date): string[] {
  const meses = new Set(mesesComMeta ?? []);
  for (let i = 0; i <= MESES_FUTUROS; i++) meses.add(somarMeses(hoje, i));
  return [...meses].sort();
}

/** Aceita só dígitos na digitação; qualquer outra coisa é descartada. */
export function limparDigitacao(texto: string): string {
  return texto.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 7);
}

/** O que mudou na grade, pronto para enviar. */
export function alteracoesDaGrade(
  mes: string,
  dias: number,
  metricas: string[],
  original: Record<string, number>,
  rascunho: Record<string, string>,
): MetaGlobalParaSalvar[] {
  const alteracoes: MetaGlobalParaSalvar[] = [];

  for (let dia = 1; dia <= dias; dia++) {
    for (const metrica of metricas) {
      const chave = chaveDaCelula(dia, metrica);
      const antes = original[chave];
      const texto = rascunho[chave] ?? (antes === undefined ? '' : String(antes));

      // Vazio onde nunca houve meta: nada a gravar. Vazio onde havia: vira 0,
      // igual ao painel do Cloudflare (a tabela não tem "apagar").
      if (texto === '' && antes === undefined) continue;
      const valor = texto === '' ? 0 : Number(texto);
      if (valor === antes) continue;

      alteracoes.push({
        date: `${mes}-${String(dia).padStart(2, '0')}`,
        metric_key: metrica,
        daily_target: valor,
      });
    }
  }
  return alteracoes;
}

/** Soma de uma coluna, considerando o que está digitado. */
export function totalDaColuna(
  dias: number,
  metrica: string,
  original: Record<string, number>,
  rascunho: Record<string, string>,
): number {
  let total = 0;
  for (let dia = 1; dia <= dias; dia++) {
    const chave = chaveDaCelula(dia, metrica);
    const texto = rascunho[chave];
    total += texto === undefined ? (original[chave] ?? 0) : Number(texto || 0);
  }
  return total;
}
