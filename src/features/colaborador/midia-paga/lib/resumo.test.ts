import { describe, expect, it } from 'vitest';
import { diagnosticar, type LinhaDeMidia, type OpcoesDaAnalise } from './analise';
import { montarRelatorio, porExtenso } from './resumo';

const base: LinhaDeMidia = {
  plataforma: 'meta',
  conjuntoId: 'a',
  conjunto: 'dco | interesses | leads | sacoma',
  campanha: '[Rise] dco | always-on | apartadas',
  status: 'ACTIVE',
  unidadeVinculada: { id: 'u1', nome: 'Sacomã' },
  dias: 30,
  gasto: 1000,
  resultados: 10,
  impressoes: 50000,
  cliques: 900,
};

const linha = (mudancas: Partial<LinhaDeMidia>): LinhaDeMidia => ({ ...base, ...mudancas });
const opcoes: OpcoesDaAnalise = {
  de: '2026-05-01',
  ate: '2026-07-31',
  fontesConectadas: ['meta'],
};

const relatorioDe = (linhas: LinhaDeMidia[], op = opcoes) =>
  montarRelatorio(diagnosticar(linhas, op));

// `toLocaleString` de moeda em pt-BR separa "R$" do número com espaço rígido
// (U+00A0). Sem trocar por espaço comum, todo `toContain('R$ 1.000,00')` falha
// por um caractere invisível.
const textoDa = (secoes: ReturnType<typeof montarRelatorio>, numero: number) =>
  secoes
    .find((s) => s.numero === numero)!
    .paragrafos.join(' ')
    .replace(/\u00a0/g, ' ');

describe('porExtenso', () => {
  it('escreve o primeiro dia com ordinal', () => {
    expect(porExtenso('2026-05-01')).toBe('1º de maio de 2026');
  });

  it('não desloca o dia por causa de fuso', () => {
    // `new Date('2026-07-31')` vira 30/07 no horário de Brasília. O relatório
    // não pode dizer "30 de julho" quando o filtro diz 31.
    expect(porExtenso('2026-07-31')).toBe('31 de julho de 2026');
  });

  it('devolve a entrada quando não é data', () => {
    expect(porExtenso('sem data')).toBe('sem data');
  });
});

describe('montarRelatorio', () => {
  it('entrega as quatro seções, na ordem', () => {
    const secoes = relatorioDe([linha({})]);
    expect(secoes.map((s) => s.numero)).toEqual([1, 2, 3, 4]);
    expect(secoes.map((s) => s.titulo)).toEqual([
      'O que aconteceu',
      'O que precisa de decisão',
      'O que não dá para afirmar',
      'Próximo passo',
    ]);
  });

  it('diz quando uma frente sozinha respondeu por tudo', () => {
    const texto = textoDa(relatorioDe([linha({})]), 1);
    expect(texto).toContain('R$ 1.000,00');
    expect(texto).toContain('uma única frente');
    expect(texto).toContain('Apartadas');
  });

  it('nomeia a frente dominante e a fatia dela quando há várias', () => {
    const texto = textoDa(
      relatorioDe([
        linha({ conjuntoId: '1', gasto: 3000, resultados: 10 }),
        linha({ conjuntoId: '2', campanha: '[Rise] lead-ad | always-on | rh-instrutor', gasto: 1000, resultados: 40 }),
      ]),
      1,
    );
    expect(texto).toContain('Apartadas');
    expect(texto).toContain('75%');
    // Não pode sugerir que a frente mais cara seja pior — elas compram coisas
    // diferentes, e o relatório precisa dizer isso onde a comparação aparece.
    expect(texto).toContain('cada frente compra uma coisa diferente');
  });

  it('não trata período sem dado como período sem investimento', () => {
    const texto = textoDa(relatorioDe([]), 1);
    expect(texto).toContain('nada chegou até aqui');
    expect(texto).not.toContain('R$ 0,00');
  });

  it('soma o dinheiro dos conjuntos sem vínculo', () => {
    const texto = textoDa(
      relatorioDe([
        linha({ conjuntoId: '1', unidadeVinculada: null, gasto: 1200 }),
        linha({ conjuntoId: '2', conjunto: 'dco | interesses | leads | penha', unidadeVinculada: null, gasto: 800 }),
      ]),
      2,
    );
    expect(texto).toContain('R$ 2.000,00');
    expect(texto).toContain('sem estar vinculados');
  });

  it('lista as fontes que faltam antes de qualquer conclusão', () => {
    const texto = textoDa(relatorioDe([linha({})]), 3);
    expect(texto).toContain('1 de 3 fontes');
    expect(texto).toContain('Google Ads');
    expect(texto).toContain('Google Analytics 4');
  });

  it('reconhece quando as três fontes estão conectadas', () => {
    const texto = textoDa(relatorioDe([linha({})], {
      ...opcoes,
      fontesConectadas: ['meta', 'google-ads', 'ga4'],
    }), 3);
    expect(texto).toContain('As três fontes previstas no manual estão conectadas.');
  });

  it('não confunde ausência de dado com resultado zero', () => {
    const texto = textoDa(relatorioDe([linha({})]), 3);
    expect(texto).toContain('Ausência de dado não é resultado zero');
  });

  it('manda vincular as unidades quando a maioria das frentes está sem dado', () => {
    // É a causa, não o sintoma: discutir custo por lead de uma frente enquanto
    // seis estão vazias é otimizar a parte errada.
    expect(textoDa(relatorioDe([linha({})]), 4)).toContain('Vincular os conjuntos');
  });

  it('não inventa próximo passo quando não há nada pendente', () => {
    const completo = [
      linha({ conjuntoId: '1', campanha: '[Rise] dco | always-on | apartadas' }),
      linha({ conjuntoId: '2', campanha: '[Rise] dco | always-on | todas' }),
      linha({ conjuntoId: '3', campanha: '[Rise] dco | always-on | remarketing' }),
      linha({ conjuntoId: '4', campanha: '[Rise] lead-ad | always-on | rh-instrutor' }),
      linha({ conjuntoId: '5', campanha: '[Rise] lead-ad | always-on | academy' }),
      linha({ conjuntoId: '6', campanha: '[Rise] venda | always-on | pilates play' }),
      linha({ conjuntoId: '7', campanha: '[Rise] lead-site | always-on | agendamento' }),
    ];
    const texto = textoDa(
      relatorioDe(completo, { ...opcoes, fontesConectadas: ['meta', 'google-ads', 'ga4'] }),
      4,
    );
    expect(texto).toContain('Nenhuma correção está pendente.');
  });
});
