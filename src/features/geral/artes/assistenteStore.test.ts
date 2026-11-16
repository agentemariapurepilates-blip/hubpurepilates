import { describe, expect, it } from 'vitest';
import { pureDesignTemplates } from '@/data/pureDesignTemplates';
import { catalogoParaOAgente, valoresDoPreenchimento } from './assistenteStore';

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
