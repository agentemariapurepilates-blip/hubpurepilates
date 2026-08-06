import { describe, it, expect } from 'vitest';
import {
  blocoDaMedia,
  BLOCOS,
  esc,
  faixaDoBloco,
  mesCurto,
  mesPorExtenso,
  montarEmailExperimentais,
  type LinhaDoRelatorio,
} from '../../../../supabase/functions/experimentais-relatorio-mensal/email';

// Faixas FIXAS, definidas pelo usuário: Ruim 0–19, Regular 20–29, Bom 30+.
// O que erra em silêncio aqui é a fronteira — um `>` no lugar de `>=` desloca
// unidades entre blocos e o e-mail continua parecendo certo.

describe('blocoDaMedia', () => {
  it('respeita cada fronteira nos três pontos que importam', () => {
    expect(blocoDaMedia(30)).toBe('bom');
    expect(blocoDaMedia(29)).toBe('regular');
    expect(blocoDaMedia(20)).toBe('regular');
    expect(blocoDaMedia(19)).toBe('ruim');
  });

  it('cobre os extremos', () => {
    expect(blocoDaMedia(0)).toBe('ruim');
    expect(blocoDaMedia(999)).toBe('bom');
  });

  it('acerta média fracionada, que é o caso normal', () => {
    // As médias de 3 meses quase sempre têm decimal; um arredondamento
    // escondido apareceria aqui.
    expect(blocoDaMedia(29.9)).toBe('regular');
    expect(blocoDaMedia(30.1)).toBe('bom');
    expect(blocoDaMedia(19.9)).toBe('ruim');
    expect(blocoDaMedia(20.1)).toBe('regular');
  });

  it('toda média cai em exatamente um bloco', () => {
    for (let v = 0; v <= 60; v += 0.1) {
      expect(['bom', 'regular', 'ruim']).toContain(blocoDaMedia(Math.round(v * 10) / 10));
    }
  });

  it('NÃO é classificação relativa: o bloco não depende das outras unidades', () => {
    // A versão anterior usava tercis. Se alguém voltar a isso, o mesmo valor
    // passaria a mudar de bloco conforme o resto da rede — este caso quebra.
    expect(blocoDaMedia(25)).toBe('regular');
    expect(blocoDaMedia(25)).toBe('regular');
  });
});

describe('BLOCOS', () => {
  it('são os três definidos, na ordem de leitura (melhor primeiro)', () => {
    expect(BLOCOS.map((b) => b.chave)).toEqual(['bom', 'regular', 'ruim']);
    expect(BLOCOS.map((b) => b.rotulo)).toEqual(['Bom', 'Regular', 'Ruim']);
  });

  it('os limites batem com a função que classifica', () => {
    // Protege contra alguém editar a tabela de blocos (o que o e-mail mostra)
    // sem editar blocoDaMedia (a conta) — o e-mail passaria a mentir.
    for (const b of BLOCOS) {
      expect(blocoDaMedia(b.minimo), b.rotulo).toBe(b.chave);
      if (b.maximo !== null) expect(blocoDaMedia(b.maximo), b.rotulo).toBe(b.chave);
    }
  });

  it('as faixas se encostam sem buraco nem sobreposição', () => {
    expect(BLOCOS[2].maximo! + 1).toBe(BLOCOS[1].minimo); // 19 + 1 = 20
    expect(BLOCOS[1].maximo! + 1).toBe(BLOCOS[0].minimo); // 29 + 1 = 30
    expect(BLOCOS[0].maximo).toBeNull();
    expect(BLOCOS[2].minimo).toBe(0);
  });

  it('não usa verde nem vermelho de semáforo', () => {
    for (const b of BLOCOS) expect(b.cor).not.toMatch(/#(0f0|00ff00|22c55e|16a34a)/i);
    expect(BLOCOS[0].cor).toBe('#c5203c');
  });
});

describe('faixaDoBloco', () => {
  it('descreve com e sem teto', () => {
    expect(faixaDoBloco(BLOCOS[0])).toBe('30 ou mais');
    expect(faixaDoBloco(BLOCOS[1])).toBe('20 a 29');
    expect(faixaDoBloco(BLOCOS[2])).toBe('0 a 19');
  });
});

describe('mesPorExtenso e mesCurto', () => {
  it('escrevem em português', () => {
    expect(mesPorExtenso('2026-06')).toBe('junho de 2026');
    expect(mesCurto('2026-06')).toBe('jun/26');
  });
});

describe('esc', () => {
  it('neutraliza marcação vinda do nome da unidade', () => {
    expect(esc('Unidade <b>X</b>')).toBe('Unidade &lt;b&gt;X&lt;/b&gt;');
  });
});

describe('montarEmailExperimentais', () => {
  const MESES = ['2026-06', '2026-07', '2026-08'];
  const l = (unitId: number, nome: string, media: number, mesesComDado = 3): LinhaDoRelatorio => ({
    unitId, nome, media, mesesComDado,
  });

  const linhas = [
    l(456, 'Estação Varginha', 66),
    l(473, 'Osasco - Rochdale', 43),
    l(313, 'Goiânia - Bueno', 32),
    l(424, 'Perus', 29),
    l(178, 'Cajamar', 21.3),
    l(145, 'Jardim Helena', 12.5),
    l(289, 'Taboão da Serra', 9.7),
    l(999, 'Unidade Nova', 4, 1),
  ];

  it('o assunto diz o período', () => {
    expect(montarEmailExperimentais(MESES, linhas).assunto)
      .toBe('Aulas experimentais — média de jun/26 a ago/26');
  });

  it('tem os três blocos com os nomes pedidos e NÃO fala em cluster', () => {
    const { corpo } = montarEmailExperimentais(MESES, linhas);
    expect(corpo).toContain('Bom');
    expect(corpo).toContain('Regular');
    expect(corpo).toContain('Ruim');
    expect(corpo).not.toContain('Cluster');
    expect(corpo).not.toContain('Médio');
  });

  it('mostra as faixas no cabeçalho de cada bloco', () => {
    const { corpo } = montarEmailExperimentais(MESES, linhas);
    expect(corpo).toContain('30 ou mais');
    expect(corpo).toContain('20 a 29');
    expect(corpo).toContain('0 a 19');
  });

  it('lista nome E id de cada unidade', () => {
    const { corpo } = montarEmailExperimentais(MESES, linhas);
    expect(corpo).toContain('Estação Varginha');
    expect(corpo).toContain('>456<');
    expect(corpo).toContain('Jardim Helena');
    expect(corpo).toContain('>145<');
  });

  it('todas as unidades aparecem, nenhuma some entre os blocos', () => {
    const { corpo } = montarEmailExperimentais(MESES, linhas);
    for (const u of linhas) expect(corpo, u.nome).toContain(u.nome);
  });

  it('põe cada unidade no bloco certo pelas faixas fixas', () => {
    const { corpo } = montarEmailExperimentais(MESES, linhas);
    const posBom = corpo.indexOf('Estação Varginha');   // 66  -> Bom
    const posRegular = corpo.indexOf('Cajamar');        // 21,3 -> Regular
    const posRuim = corpo.indexOf('Jardim Helena');     // 12,5 -> Ruim
    // A ordem no corpo segue a ordem dos blocos: Bom, Regular, Ruim.
    expect(posBom).toBeLessThan(posRegular);
    expect(posRegular).toBeLessThan(posRuim);
  });

  it('29 fica em Regular e 32 em Bom — a fronteira dos 30', () => {
    const { corpo } = montarEmailExperimentais(MESES, linhas);
    expect(corpo.indexOf('Goiânia - Bueno')).toBeLessThan(corpo.indexOf('Perus'));
  });

  it('mostra a média com vírgula decimal', () => {
    const { corpo } = montarEmailExperimentais(MESES, linhas);
    expect(corpo).toContain('21,3');
    expect(corpo).toContain('12,5');
  });

  it('avisa que o critério é fixo, e não relativo à rede', () => {
    const { corpo } = montarEmailExperimentais(MESES, linhas);
    expect(corpo).toContain('fixos');
    expect(corpo).not.toContain('um terço');
  });

  it('marca a unidade com menos de 3 meses e explica no rodapé', () => {
    const { corpo } = montarEmailExperimentais(MESES, linhas);
    expect(corpo).toContain('dado em menos de 3 meses');
  });

  it('não põe a nota quando todas têm 3 meses', () => {
    const completas = linhas.filter((x) => x.mesesComDado === 3);
    expect(montarEmailExperimentais(MESES, completas).corpo)
      .not.toContain('dado em menos de 3 meses');
  });

  it('usa a identidade do Hub e nada de imagem remota', () => {
    const { corpo } = montarEmailExperimentais(MESES, linhas);
    expect(corpo).toContain('#c5203c');
    expect(corpo).toContain('Montserrat');
    expect(corpo).toContain('Inter');
    expect(corpo).not.toMatch(/<img[^>]+src="https?:/);
  });

  it('escapa o nome da unidade', () => {
    const { corpo } = montarEmailExperimentais(MESES, [l(1, '<script>x</script>', 20)]);
    expect(corpo).not.toContain('<script>x');
    expect(corpo).toContain('&lt;script&gt;');
  });

  it('bloco vazio diz que está vazio, em vez de sumir', () => {
    const { corpo } = montarEmailExperimentais(MESES, [l(1, 'Só uma', 5)]);
    expect(corpo).toContain('Nenhuma unidade neste bloco');
  });
});
