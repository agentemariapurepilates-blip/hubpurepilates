import { describe, it, expect } from 'vitest';
import { EXEMPLOS_DO_PDF, GAMA, PRACAS_TV, milhares, pacoteCompleto, reais } from './dados-pracas';

// Os números desta página viram expectativa de preço na cabeça do franqueado, e
// vêm de uma planilha da Globo. Estes testes refazem a conta de cada linha para
// pegar qualquer erro de transcrição, e conferem contra os TOTAIS que a própria
// planilha traz.

describe('quadro de TV Globo por praça', () => {
  it('tem as 16 praças da planilha', () => {
    expect(PRACAS_TV).toHaveLength(16);
  });

  it.each(PRACAS_TV.map((p) => [p.cidade, p] as const))(
    '%s: impactos ÷ 1.000 × CPM é o investimento',
    (_cidade, p) => {
      expect(p.impactos / 1000 * p.cpm).toBeCloseTo(p.investimento, 1);
    },
  );

  it('formatos são só de 10" ou 15", e nenhuma cidade se repete dentro da aba', () => {
    expect(PRACAS_TV.every((p) => p.formato === '10"' || p.formato === '15"')).toBe(true);
    const chaves = PRACAS_TV.map((p) => `${p.grupo}|${p.cidade}`);
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it('a faixa citada no card ("entre R$ 4 mil e R$ 13 mil na maioria das praças") vale para 12 das 16', () => {
    const dentro = PRACAS_TV.filter((p) => p.investimento >= 4000 && p.investimento <= 13100);
    expect(dentro).toHaveLength(12);
    expect(Math.min(...PRACAS_TV.map((p) => p.investimento))).toBe(2563.2); // São Carlos
    expect(Math.max(...PRACAS_TV.map((p) => p.investimento))).toBe(44100); // Rio de Janeiro
  });
});

describe('pacote completo (TV + telas GAMA + geofence)', () => {
  it('soma R$ 54.000 da GAMA à praça', () => {
    expect(GAMA.dooh.investimento + GAMA.geofence.investimento).toBe(54000);
    expect(pacoteCompleto(1000)).toBe(55000);
  });

  // Total que a planilha traz nas abas de uma praça só (TV + DOOH + geofence).
  it.each([
    ['Salvador', 66468],
    ['Rio de Janeiro', 98100],
    ['Fortaleza', 64752],
    ['Florianópolis', 58371],
    ['Porto Alegre', 67068],
  ])('%s fecha com o total da planilha', (cidade, totalDaPlanilha) => {
    const praca = PRACAS_TV.find((p) => p.cidade === cidade)!;
    expect(pacoteCompleto(praca.investimento)).toBeCloseTo(totalDaPlanilha, 2);
  });

  it('Mogi das Cruzes e Santos: cada cidade + GAMA, e as duas juntas fecham com a aba (R$ 65.412)', () => {
    const mogi = PRACAS_TV.find((p) => p.cidade === 'Mogi das Cruzes')!;
    const santos = PRACAS_TV.find((p) => p.cidade === 'Santos')!;
    expect(mogi.investimento + santos.investimento + 54000).toBeCloseTo(65412, 2);
  });

  it('o pacote de qualquer praça passa de R$ 50 mil, como diz o card', () => {
    expect(PRACAS_TV.every((p) => pacoteCompleto(p.investimento) > 50000)).toBe(true);
  });
});

describe('exemplos do PDF da Globo', () => {
  it('as três cidades, com os valores do PDF', () => {
    expect(EXEMPLOS_DO_PDF.map((e) => [e.cidade, e.tvMaisDigital.investimento, e.nearLive.investimento])).toEqual([
      ['Bragança Paulista', 10793.53, 7896.5],
      ['Blumenau', 10000, 8300],
      ['Uberlândia', 16973, 8447.5],
    ]);
  });
});

describe('formatação', () => {
  it.each([
    [11419.2, 'R$ 11.419,20'],
    [10000, 'R$ 10.000,00'],
    [7896.5, 'R$ 7.896,50'],
    [44100, 'R$ 44.100,00'],
    [2563.2, 'R$ 2.563,20'],
  ])('reais(%s)', (valor, texto) => {
    expect(reais(valor)).toBe(texto);
  });

  it('milhares', () => {
    expect(milhares(1040000)).toBe('1.040.000');
    expect(milhares(390000)).toBe('390.000');
  });
});
