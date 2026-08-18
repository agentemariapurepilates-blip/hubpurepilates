import { describe, expect, it } from 'vitest';
import { montarArquivoDoRitmo, montarCsvDoResumo, montarCsvDoRitmo } from './ritmoCsv';
import { diasDoMes, montarRitmo } from './ritmo';

function ritmoDeTeste(valores: Record<number, number>, metas: Record<number, number>) {
  const mapa = (fonte: Record<number, number>) =>
    new Map(
      Object.entries(fonte).map(([dia, valor]) => [
        `2026-07-${String(Number(dia)).padStart(2, '0')}`,
        valor,
      ]),
    );

  return montarRitmo({
    mes: '2026-07',
    realizadoPorDia: mapa(valores),
    metaPorDia: mapa(metas),
  });
}

const experimentais = {
  nome: 'Aulas experimentais',
  ritmo: ritmoDeTeste({ 1: 100, 2: 50 }, { 1: 80, 2: 60 }),
};

describe('montarCsvDoRitmo', () => {
  it('escreve uma linha por dia do mês, para cada indicador', () => {
    const linhas = montarCsvDoRitmo([experimentais]).split('\r\n');
    // 31 dias de julho + o cabeçalho.
    expect(linhas).toHaveLength(diasDoMes('2026-07').length + 1);
    expect(linhas[0]).toBe(
      'Indicador;Data;Dia da semana;Realizado;Meta;Realizado acumulado;Meta acumulada',
    );
  });

  it('usa ponto e vírgula e vírgula decimal, que é o que o Excel em pt-BR espera', () => {
    const csv = montarCsvDoRitmo([
      { nome: 'Teste', ritmo: ritmoDeTeste({ 1: 10.5 }, { 1: 8.25 }) },
    ]);
    expect(csv).toContain(';10,5;8,25;');
  });

  it('deixa a célula vazia onde o dia ainda não aconteceu', () => {
    // Repetir o último acumulado ou escrever 0 diria que o dia rendeu zero — e
    // o que houve foi ausência de leitura.
    const linhas = montarCsvDoRitmo([experimentais]).split('\r\n');
    const diaTres = linhas.find((l) => l.includes('2026-07-03'))!;
    expect(diaTres).toBe('"Aulas experimentais";2026-07-03;sexta;;0;;140');
  });

  it('nomeia o dia da semana em português', () => {
    const csv = montarCsvDoRitmo([experimentais]);
    // 01/07/2026 é quarta.
    expect(csv).toContain('2026-07-01;quarta;');
  });

  it('protege o nome que tem aspas, em vez de cortar a coluna', () => {
    const csv = montarCsvDoRitmo([
      { nome: 'Aulas "experimentais"', ritmo: ritmoDeTeste({ 1: 1 }, { 1: 1 }) },
    ]);
    expect(csv).toContain('"Aulas ""experimentais"""');
  });
});

describe('montarCsvDoResumo', () => {
  it('arredonda o percentual em duas casas', () => {
    // 100/80 = 125%. Com 3 dias de meta a conta dá dízima, e sem arredondar o
    // arquivo sairia com dezesseis dígitos.
    const csv = montarCsvDoResumo([
      { nome: 'Teste', ritmo: ritmoDeTeste({ 1: 100, 2: 50 }, { 1: 80, 2: 60 }) },
    ]);
    const valores = csv.split('\r\n')[1].split(';');
    for (const valor of valores) {
      const casas = valor.split(',')[1];
      if (casas && /^\d+$/.test(casas)) expect(casas.length, valor).toBeLessThanOrEqual(2);
    }
  });

  it('deixa o percentual em branco quando não há meta, em vez de escrever zero', () => {
    const csv = montarCsvDoResumo([
      { nome: 'Sem meta', ritmo: ritmoDeTeste({ 1: 46 }, {}) },
    ]);
    const colunas = csv.split('\r\n')[1].split(';');
    expect(colunas[1]).toBe('46');
    expect(colunas[2]).toBe('0');
    // MTD %: vazio, e não "0".
    expect(colunas[3]).toBe('');
  });

  it('registra o método da previsão, para o número poder ser auditado', () => {
    const csv = montarCsvDoResumo([experimentais]);
    expect(csv).toContain('curva-da-meta');
  });
});

describe('montarArquivoDoRitmo', () => {
  it('junta resumo e dia a dia num arquivo só', () => {
    const arquivo = montarArquivoDoRitmo('julho de 2026', [experimentais]);
    expect(arquivo).toContain('Ritmo do mês;julho de 2026');
    expect(arquivo.indexOf('RESUMO')).toBeLessThan(arquivo.indexOf('DIA A DIA'));
    expect(arquivo).toContain('Indicador;Data;Dia da semana');
  });
});
