import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A prévia local existe para o módulo poder ser avaliado antes de as tabelas
 * serem criadas. O risco dela é um só e é grave: vazar para produção e alguém
 * tomar decisão com número congelado achando que é o de hoje.
 *
 * Estes testes guardam as travas que impedem isso.
 */

const pasta = join(process.cwd(), 'src/features/colaborador/leads-rh');
const previa = readFileSync(join(pasta, 'dados-locais/previa.ts'), 'utf8');

describe('a prévia não pode vazar para produção', () => {
  it('a função de carga começa checando import.meta.env.DEV', () => {
    // Sem a guarda, o build de produção serviria dado pessoal de candidato.
    const funcao = /export async function carregarPreviaDeLeads([^)]*)[^{]*{/.exec(previa);
    expect(funcao).not.toBeNull();
    const depois = previa.slice(previa.indexOf(funcao![0]) + funcao![0].length, previa.indexOf(funcao![0]) + funcao![0].length + 120);
    expect(depois.trim()).toContain('if (!import.meta.env.DEV) return null;');
  });

  it('o JSON só entra por import dinâmico, nunca no topo do arquivo', () => {
    // Um `import` estático colocaria os dados no bundle de produção mesmo com
    // a guarda de DEV, porque o bundler resolve antes da execução. E o
    // arquivo está no .gitignore, então pode nem existir.
    expect(previa).not.toMatch(/^import .*.json['"]/m);
    expect(previa).toContain('import.meta.glob');
    expect(previa).toContain("'./leads-rh.json'");
  });

  it('só os hooks usam a prévia — nenhuma tela a importa direto', () => {
    // Se uma tela importasse, a guarda de DEV ficaria a um refactor de
    // distância de ser esquecida.
    const usam = ['LeadsRH.tsx']
      .map((arquivo) => readFileSync(join(pasta, arquivo), 'utf8'))
      .filter((conteudo) => conteudo.includes('dados-locais/previa'));
    expect(usam).toHaveLength(0);
  });
});

describe('o dado pessoal de candidato não pode ser versionado', () => {
  it('leads-rh.json está no .gitignore', () => {
    // O arquivo tem nome, e-mail e telefone de candidatos reais. Um `git add`
    // mandaria tudo para o GitHub, e apagar depois não desfaz o histórico.
    const gitignore = readFileSync(join(process.cwd(), '.gitignore'), 'utf8');
    expect(gitignore).toContain('leads-rh/dados-locais/leads-rh.json');
  });

  it('o arquivo de insights pode ficar: é agregado', () => {
    // Gasto, cliques e contagem de leads não identificam ninguém.
    const gitignore = readFileSync(join(process.cwd(), '.gitignore'), 'utf8');
    expect(gitignore).not.toContain('insights-rh.json');
  });
});
