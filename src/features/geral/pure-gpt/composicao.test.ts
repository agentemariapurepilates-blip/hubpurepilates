import { describe, expect, it } from 'vitest';
import { CORES, FUNDOS, renderizar, type Composicao } from './composicao';

const arte = (elementos: Composicao['elementos'], fundo = 'claro'): Composicao => ({
  proporcao: '4:5',
  fundo,
  elementos,
});

describe('texto', () => {
  it('escapa o que o agente escreveu, em vez de deixar virar marcação', () => {
    const html = renderizar(
      arte([{ tipo: 'texto', texto: '<img src=x onerror=alert(1)>', x: 10, y: 10, largura: 80, altura: 10, tamanho: 6, peso: 700, cor: 'grafite' }]),
    );
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
  });

  it('cai no peso padrão quando vem um que a fonte exportada não tem', () => {
    const html = renderizar(
      arte([{ tipo: 'texto', texto: 'Oi', x: 10, y: 10, largura: 80, altura: 10, tamanho: 6, peso: 900 as never, cor: 'grafite' }]),
    );
    expect(html).toContain('font-weight:700');
  });

  it('encolhe a letra até caber na caixa, em vez de invadir o que vem abaixo', () => {
    const longo =
      'Comece o dia se movimentando, com acompanhamento de perto e aparelho para você, na turma das seis.';
    const apertado = renderizar(
      arte([{ tipo: 'texto', texto: longo, x: 9, y: 10, largura: 50, altura: 6, tamanho: 9, peso: 400, cor: 'grafite' }]),
    );
    const folgado = renderizar(
      arte([{ tipo: 'texto', texto: longo, x: 9, y: 10, largura: 50, altura: 40, tamanho: 9, peso: 400, cor: 'grafite' }]),
    );
    const tamanho = (html: string) => Number(/font-size:([\d.]+)cqh/.exec(html)?.[1]);
    expect(tamanho(apertado)).toBeLessThan(tamanho(folgado));
  });

  it('deixa o tamanho pedido quando o texto já cabe numa linha', () => {
    const html = renderizar(
      arte([{ tipo: 'texto', texto: 'Kleber', x: 10, y: 67, largura: 80, altura: 15, tamanho: 12, peso: 800, cor: 'vermelho' }]),
    );
    expect(html).toContain('font-size:12.00cqh');
  });
});

describe('cores', () => {
  it('só usa a paleta: cor inventada vira grafite', () => {
    const html = renderizar(
      arte([{ tipo: 'forma', forma: 'pilula', x: 10, y: 10, largura: 40, altura: 8, cor: 'rosa' as never }]),
    );
    expect(html).toContain(CORES.grafite);
    expect(html).not.toContain('rosa');
  });

  it('o vermelho é o do brand book, e não o hex de dígitos trocados', () => {
    expect(CORES.vermelho).toBe('#c12030');
  });
});

describe('formas da marca', () => {
  it('a pétala mantém um canto reto — é a assinatura', () => {
    const html = renderizar(
      arte([
        {
          tipo: 'forma',
          forma: 'petala',
          x: 10,
          y: 10,
          largura: 40,
          altura: 30,
          cor: 'vermelho',
          canto: 'inferior-direito',
        },
      ]),
    );
    const raio = /border-radius:([^;]+);/.exec(html)?.[1] ?? '';
    expect(raio.split(/\s+/).filter((v) => v === '0')).toHaveLength(1);
  });

  it('o contorno é borda, não preenchimento', () => {
    const html = renderizar(
      arte([
        { tipo: 'forma', forma: 'circulo', x: 10, y: 10, largura: 20, altura: 16, cor: 'vermelho', preenchimento: 'contorno' },
      ]),
    );
    expect(html).toContain(`solid ${CORES.vermelho}`);
    expect(html).not.toContain(`background:${CORES.vermelho}`);
  });
});

describe('molduras', () => {
  it('abre uma moldura para cada foto', () => {
    const html = renderizar(
      arte([{ tipo: 'moldura', fotos: [0, 1, 2], x: 10, y: 10, largura: 80, altura: 50 }]),
      ['a.png', 'b.png', 'c.png'],
    );
    expect(html.match(/<img/g) ?? []).toHaveLength(3);
  });

  it('ignora foto que não chegou, em vez de deixar um buraco', () => {
    const html = renderizar(
      arte([{ tipo: 'moldura', fotos: [0, 7], x: 10, y: 10, largura: 80, altura: 50 }]),
      ['a.png'],
    );
    expect(html.match(/<img/g) ?? []).toHaveLength(1);
  });

  it('não desenha nada quando não há foto nenhuma', () => {
    const html = renderizar(arte([{ tipo: 'moldura', fotos: [0], x: 10, y: 10, largura: 80, altura: 50 }]), []);
    expect(html).not.toContain('<img');
  });
});

describe('logotipo', () => {
  it('sai branco sobre fundo escuro, que é o que o brand book exige', () => {
    const html = renderizar(arte([{ tipo: 'logo', x: 70, y: 85, largura: 20 }], 'vermelho'));
    expect(html).toContain('brightness(0) invert(1)');
  });

  it('sai na versão positiva sobre fundo claro', () => {
    const html = renderizar(arte([{ tipo: 'logo', x: 70, y: 85, largura: 20 }], 'claro'));
    expect(html).not.toContain('brightness(0) invert(1)');
  });
});

describe('fundos', () => {
  it('todos os fundos têm arquivo e dizem se são escuros', () => {
    for (const f of FUNDOS) {
      expect(f.url.startsWith('/images/pure-gpt/fundos/')).toBe(true);
      expect(typeof f.escuro).toBe('boolean');
    }
  });

  it('fundo que não existe vira cor chapada da paleta, sem quebrar', () => {
    const html = renderizar(arte([], 'grafite'));
    expect(html).toContain(`background:${CORES.grafite}`);
  });
});
