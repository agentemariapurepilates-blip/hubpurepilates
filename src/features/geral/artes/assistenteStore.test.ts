import { describe, expect, it } from 'vitest';
import { pureDesignTemplates } from '@/data/pureDesignTemplates';
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
