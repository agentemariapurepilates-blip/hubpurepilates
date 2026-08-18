/**
 * Exporta o Ritmo do mês para CSV.
 *
 * Segue a convenção de `exportUtils.ts`, que é a que o Excel em português
 * espera: separador ponto e vírgula, vírgula decimal e BOM UTF-8 no começo do
 * arquivo — sem o BOM o Excel abre "matrículas" como "matrÃ­culas".
 *
 * É operação de leitura pura: monta um Blob no navegador e dispara o download.
 * Nada aqui toca o banco.
 */

import type { Ritmo } from './ritmo';

const CABECALHO = [
  'Indicador',
  'Data',
  'Dia da semana',
  'Realizado',
  'Meta',
  'Realizado acumulado',
  'Meta acumulada',
];

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/**
 * Número no formato que o Excel em português lê: vírgula decimal.
 *
 * Arredondado em duas casas. Sem isso, a divisão de um atingimento sai como
 * `97,50679963735267` — dezesseis dígitos de precisão que ninguém pediu e que
 * fazem a planilha parecer um despejo de memória.
 */
function numero(valor: number | null): string {
  if (valor === null) return '';
  const arredondado = Math.round(valor * 100) / 100;
  return String(arredondado).replace('.', ',');
}

/** Aspas duplicadas: sem isso, um nome com `"` corta a coluna ao meio. */
function texto(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

export interface IndicadorExportado {
  nome: string;
  ritmo: Ritmo;
}

export function montarCsvDoRitmo(indicadores: IndicadorExportado[]): string {
  const linhas = [CABECALHO.join(';')];

  for (const { nome, ritmo } of indicadores) {
    for (const dia of ritmo.dias) {
      linhas.push(
        [
          texto(nome),
          dia.data,
          DIAS[dia.diaDaSemana],
          numero(dia.realizado),
          numero(dia.meta),
          numero(dia.realizadoAcumulado),
          numero(dia.metaAcumulada),
        ].join(';'),
      );
    }
  }

  return linhas.join('\r\n');
}

/** O resumo que a tela mostra, para o arquivo não obrigar a refazer a conta. */
export function montarCsvDoResumo(indicadores: IndicadorExportado[]): string {
  const cabecalho = [
    'Indicador',
    'MTD realizado',
    'MTD meta',
    'MTD %',
    'Semana realizado',
    'Semana meta',
    'Semana %',
    'Previsão',
    'Meta do mês',
    'Previsão %',
    'Método da previsão',
    'Divergência da curva',
  ];

  const porcento = (valor: number | null) => (valor === null ? '' : numero(valor * 100));

  const linhas = [cabecalho.join(';')];

  for (const { nome, ritmo } of indicadores) {
    linhas.push(
      [
        texto(nome),
        numero(ritmo.mtd.realizado),
        numero(ritmo.mtd.meta),
        porcento(ritmo.mtd.atingimento),
        numero(ritmo.semana.realizado),
        numero(ritmo.semana.meta),
        porcento(ritmo.semana.atingimento),
        ritmo.previsao ? numero(Math.round(ritmo.previsao.valor)) : '',
        numero(ritmo.metaDoMes),
        porcento(ritmo.previsao?.atingimento ?? null),
        ritmo.previsao?.metodo ?? '',
        porcento(ritmo.divergenciaDaCurva),
      ].join(';'),
    );
  }

  return linhas.join('\r\n');
}

/** Dispara o download de um texto como arquivo. */
export function baixarCsv(conteudo: string, nomeArquivo: string) {
  const blob = new Blob(['\ufeff' + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', nomeArquivo);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * O arquivo inteiro: resumo em cima, dia a dia embaixo, num CSV só.
 *
 * Dois arquivos separados seriam mais limpos de programar e piores de usar —
 * quem baixa quer um anexo, não dois.
 */
export function montarArquivoDoRitmo(mes: string, indicadores: IndicadorExportado[]): string {
  return [
    `Ritmo do mês;${mes}`,
    '',
    'RESUMO',
    montarCsvDoResumo(indicadores),
    '',
    'DIA A DIA',
    montarCsvDoRitmo(indicadores),
  ].join('\r\n');
}
