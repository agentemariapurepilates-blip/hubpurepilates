import { describe, expect, it } from 'vitest';
import { buildRenderedHTML, estiloDoLogo, montarGaleria, pureDesignTemplates, recorteDaFoto } from '@/data/pureDesignTemplates';
import { catalogoParaOAgente, categoriasParaOAgente, valoresDoPreenchimento } from './assistenteStore';

describe('catálogo que o assistente recebe', () => {
  const catalogo = catalogoParaOAgente();

  it('traz todos os modelos do Pure Design, sem lista paralela', () => {
    expect(catalogo.map((m) => m.id)).toEqual(pureDesignTemplates.map((t) => t.id));
  });

  it('marca campo de imagem como foto e não manda a imagem de exemplo', () => {
    const aniversario = catalogo.find((m) => m.id === 'aniversario-instrutor');
    const foto = aniversario?.campos.find((c) => c.id === 'fotoProfessor');
    expect(foto?.tipo).toBe('foto');
    expect(foto?.exemplo).toBeUndefined();
  });
});

describe('modelos coringa', () => {
  it('existe pelo menos um coringa e ele chega marcado ao agente', () => {
    const coringas = catalogoParaOAgente().filter((m) => m.coringa);
    expect(coringas.length).toBeGreaterThan(0);
  });

  it('tem coringa só de texto, com uma foto e com duas fotos', () => {
    const fotos = (id: string) =>
      catalogoParaOAgente().find((m) => m.id === id)?.campos.filter((c) => c.tipo === 'foto').length;
    expect(fotos('coringa-texto')).toBe(0);
    expect(fotos('coringa-foto')).toBe(1);
    expect(fotos('coringa-duas-fotos')).toBe(2);
  });

  it('o coringa de duas fotos troca a moldura única por duas', () => {
    const t = pureDesignTemplates.find((m) => m.id === 'coringa-duas-fotos')!;
    expect(t.html).toContain('{{foto1}}');
    expect(t.html).toContain('{{foto2}}');
    expect(t.html).not.toContain('{{foto}}"');
  });
});

describe('palavras-chave', () => {
  it('todo modelo que não é coringa tem palavras-chave', () => {
    const sem = catalogoParaOAgente().filter((m) => !m.coringa && m.palavrasChave.length === 0).map((m) => m.id);
    expect(sem).toEqual([]);
  });

  it('o aviso de feriado leva a lista de datas com as variantes', () => {
    const feriado = catalogoParaOAgente().find((m) => m.id === 'feriado-aviso');
    expect(feriado?.lista?.variantes.map((v) => v.id)).toEqual(['fechado', 'aberto']);
  });
});

describe('inauguração e feriado', () => {
  const cat = catalogoParaOAgente();
  const fotos = (id: string) => cat.find((m) => m.id === id)?.campos.filter((c) => c.tipo === 'foto').length;

  it('inauguração padrão: "Vem aí" sem foto e "A melhor hora" com foto', () => {
    expect(fotos('inauguracao-vem-ai')).toBe(0);
    expect(fotos('inauguracao-melhor-hora')).toBe(1);
    expect(cat.find((m) => m.id === 'inauguracao-vem-ai')?.dica).toMatch(/sem foto/);
    expect(cat.find((m) => m.id === 'inauguracao-melhor-hora')?.dica).toMatch(/com foto/);
  });

  it('Corpus Christi saiu e o aviso de feriado geral cobre qualquer feriado', () => {
    expect(cat.some((m) => m.id === 'feriado-corpus-christi')).toBe(false);
    expect(cat.find((m) => m.id === 'feriado-aviso')?.palavrasChave).toContain('corpus christi');
  });
});

describe('categorias', () => {
  it('toda categoria tem explicação para o agente', () => {
    const sem = categoriasParaOAgente().filter((c) => !c.descricao).map((c) => c.nome);
    expect(sem).toEqual([]);
  });

  it('inauguração tem modelos com foto e sem foto (o agente pergunta)', () => {
    const inaug = categoriasParaOAgente().find((c) => c.nome === 'Inauguração');
    expect(inaug?.comFoto).toBeGreaterThan(0);
    expect(inaug?.semFoto).toBeGreaterThan(0);
  });
});

describe('galeria e logo da Pure Store', () => {
  const t = pureDesignTemplates.find((m) => m.id === 'pure-store-coringa')!;

  it('a galeria monta 3, 2 ou 1 moldura conforme as fotos excluídas', () => {
    const molduras = (removidas: string[]) => (montarGaleria(t.galeria!, {}, new Set(removidas)).match(/<div /g) ?? []).length;
    expect(molduras([])).toBe(3);
    expect(molduras(['foto3'])).toBe(2);
    expect(molduras(['foto2', 'foto3'])).toBe(1);
  });

  it('com 1 foto, a moldura ocupa a área inteira da galeria', () => {
    const html = montarGaleria(t.galeria!, {}, new Set(['foto2', 'foto3']));
    expect(html).toContain(`width:${t.galeria!.largura}px`);
  });

  it('o logo vai para onde foi arrastado, no tamanho ajustado', () => {
    const caixa = t.fields.find((f) => f.id === 'logo')!.logoCaixa!;
    const estilo = estiloDoLogo('logo', caixa, { logo__x: '40', logo__y: '1200', logo__escala: '1.5' });
    expect(estilo).toContain('left:40px');
    expect(estilo).toContain('top:1200px');
    expect(estilo).toContain(`width:${Math.round(caixa.largura * 1.5)}px`);
  });

  it('negrito e tamanho de texto entram na arte', () => {
    const html = buildRenderedHTML(t, { titulo: 'A **MOVE** chegou', titulo__tam: '1.2' });
    expect(html).toContain('<strong style="font-weight:700;">MOVE</strong>');
    expect(html).toContain('font-size:1.2em');
  });

  it('todo logo solto vira logo arrastável (data-logo)', () => {
    for (const id of ['feriado-aviso', 'depoimento-claro', 'depoimento-vermelho', 'pure-store-coringa']) {
      const m = pureDesignTemplates.find((x) => x.id === id)!;
      const html = buildRenderedHTML(m, {});
      expect(html, id).toContain('data-logo="logo"');
    }
  });

  it('a arte final não deixa nenhum token sem trocar', () => {
    const html = buildRenderedHTML(t, Object.fromEntries(t.fields.map((f) => [f.id, f.defaultValue])), new Set(['foto3']));
    expect(html).not.toMatch(/\{\{[a-z0-9:_]+\}\}/i);
  });
});

describe('enquadramento das fotos', () => {
  it('toda foto de todo modelo vira uma moldura ajustável (data-foto)', () => {
    const faltando: string[] = [];
    for (const t of pureDesignTemplates) {
      const html = buildRenderedHTML(t, Object.fromEntries(t.fields.map((f) => [f.id, f.defaultValue])));
      for (const f of t.fields.filter((c) => c.inputType === 'image')) {
        if (!html.includes(`data-foto="${f.id}"`)) faltando.push(`${t.id}:${f.id}`);
      }
    }
    expect(faltando).toEqual([]);
  });

  it('zoom e foco viram estilo, com limites', () => {
    expect(recorteDaFoto('foto', { foto__zoom: '9', foto__fx: '-5', foto__fy: '30' })).toEqual({ zoom: 4, x: 0, y: 30 });
    const t = pureDesignTemplates.find((m) => m.id === 'aniversario-instrutor')!;
    const html = buildRenderedHTML(t, { fotoProfessor: 'x.png', fotoProfessor__zoom: '2', fotoProfessor__fx: '20', fotoProfessor__fy: '70' });
    expect(html).toContain('transform:scale(2)');
    expect(html).toContain('object-position:20% 70%');
  });
});

describe('todos os modelos', () => {
  it('nenhum modelo deixa {{campo}} ou __TOKEN__ sem trocar na arte', () => {
    const sobrando: string[] = [];
    for (const t of pureDesignTemplates) {
      const html = buildRenderedHTML(t, Object.fromEntries(t.fields.map((f) => [f.id, f.defaultValue])));
      const resto = html.match(/\{\{[^}]+\}\}|__[A-Z_]+__/g);
      if (resto) sobrando.push(`${t.id}: ${resto.join(', ')}`);
    }
    expect(sobrando).toEqual([]);
  });

  it('toda categoria usada tem lugar na ordem da galeria', async () => {
    const { ORDEM_DAS_CATEGORIAS } = await import('@/data/pureDesignTemplates');
    const fora = Array.from(new Set(pureDesignTemplates.map((t) => t.category))).filter((c) => !ORDEM_DAS_CATEGORIAS.includes(c));
    expect(fora).toEqual([]);
  });
});

describe('valores que o editor recebe', () => {
  it('põe a foto certa no campo de foto e mantém os textos', () => {
    const valores = valoresDoPreenchimento(
      { modelo: 'aniversario-instrutor', textos: { mensagem: 'Parabéns, Kelly!' }, fotos: { fotoProfessor: 1 } },
      ['data:image/png;base64,AAA', 'data:image/png;base64,BBB'],
    );
    expect(valores).toEqual({ mensagem: 'Parabéns, Kelly!', fotoProfessor: 'data:image/png;base64,BBB' });
  });

  it('ignora foto que não existe na conversa', () => {
    const valores = valoresDoPreenchimento(
      { modelo: 'aniversario-instrutor', textos: {}, fotos: { fotoProfessor: 5 } },
      ['data:image/png;base64,AAA'],
    );
    expect(valores).toEqual({});
  });
});
