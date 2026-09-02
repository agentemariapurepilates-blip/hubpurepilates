import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { RELATORIOS, type Relatorio } from './relatorios';

// O nome da Edge Function é uma string solta: nada no TypeScript liga
// 'cluster-relatorio-mensal' à pasta que a implementa. Um typo, ou os dois
// relatórios apontando para a mesma função, passariam pelo build inteiro e só
// apareceriam como "e-mail errado na prévia" — que é justamente o tipo de erro
// que uma prévia deveria pegar, não causar.

const CHAVES = Object.keys(RELATORIOS) as Relatorio[];

describe('RELATORIOS', () => {
  it('cobre os dois relatórios de cluster', () => {
    expect(CHAVES.sort()).toEqual(['experimentais', 'matriculados']);
  });

  it('cada função nomeada existe em supabase/functions', () => {
    for (const chave of CHAVES) {
      const caminho = `supabase/functions/${RELATORIOS[chave].funcao}`;
      expect(existsSync(caminho), `${chave} aponta para ${caminho}, que não existe`).toBe(true);
    }
  });

  it('os dois não apontam para a mesma função', () => {
    const funcoes = CHAVES.map((c) => RELATORIOS[c].funcao);
    expect(new Set(funcoes).size).toBe(funcoes.length);
  });

  it('cada um traz o texto que a tela precisa', () => {
    for (const chave of CHAVES) {
      const r = RELATORIOS[chave];
      expect(r.rotulo, `${chave} sem rótulo`).toBeTruthy();
      expect(r.descricao, `${chave} sem descrição`).toBeTruthy();
      expect(r.nomeNoTexto, `${chave} sem nome corrido`).toBeTruthy();
    }
  });

  it('a descrição diz quando o envio acontece', () => {
    // Quem abre a tela precisa saber se o relatório sai dia 1 ou no fim do mês
    // antes de mexer na lista. Sem isso a aba vira uma caixa de e-mails sem
    // contexto nenhum.
    expect(RELATORIOS.matriculados.descricao).toMatch(/dia 1/);
    expect(RELATORIOS.experimentais.descricao).toMatch(/penúltimo dia/);
  });
});
