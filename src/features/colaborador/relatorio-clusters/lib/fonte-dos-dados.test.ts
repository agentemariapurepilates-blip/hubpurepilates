import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  COLUNA_MATRICULADOS,
  mesEmSaoPaulo,
} from '../../../../../supabase/functions/cluster-relatorio-mensal/email';
import {
  COLUNA_EXPERIMENTAIS,
  janelaDeTresMesesFechados,
  mediaPorUnidade,
} from '../../../../../supabase/functions/experimentais-relatorio-mensal/email';

// A previa agora e montada NO NAVEGADOR, com o mesmo email.ts que a Edge
// Function usa. Isso so vale alguma coisa se os dois lados lerem o MESMO dado:
// uma coluna diferente, ou uma media calculada de outro jeito, produziria uma
// previa bonita e mentirosa -- o pior resultado possivel para uma tela cujo
// unico trabalho e dizer "o e-mail vai sair assim".
//
// Por isso a coluna e o calculo da media sairam de dentro do index.ts (que o
// navegador nao consegue importar, porque ele chama Deno.serve) e passaram
// para o email.ts, que os dois lados importam.

const IDX_CLUSTERS = 'supabase/functions/cluster-relatorio-mensal/index.ts';
const IDX_EXPERIMENTAIS = 'supabase/functions/experimentais-relatorio-mensal/index.ts';

describe('a coluna do banco e uma so', () => {
  it('matriculados le o ESTOQUE, nao o fluxo', () => {
    // Existe uma `cli_matriculas_total` (fluxo) com nome quase identico.
    // Trocar as duas poe todas as unidades no Cluster 5, com aparencia de
    // certo.
    expect(COLUNA_MATRICULADOS).toBe('cli_matriculados_total');
  });

  it('experimentais le cli_experimentais', () => {
    expect(COLUNA_EXPERIMENTAIS).toBe('cli_experimentais');
  });

  it('nenhum index.ts guarda a propria copia do nome da coluna', () => {
    // A trava real: com o literal repetido no index, alguem corrige um lado e
    // a previa continua mostrando o outro.
    for (const arquivo of [IDX_CLUSTERS, IDX_EXPERIMENTAIS]) {
      const conteudo = readFileSync(arquivo, 'utf8');
      expect(conteudo, `${arquivo} ainda declara a coluna`).not.toMatch(
        /const COLUNA = '/,
      );
    }
  });
});

describe('mediaPorUnidade', () => {
  const nomes = new Map([[1, 'Vila Mariana'], [2, 'Tijuca']]);

  it('faz a media dos meses da janela', () => {
    const linhas = mediaPorUnidade(
      [new Map([[1, 30]]), new Map([[1, 20]]), new Map([[1, 10]])],
      nomes,
    );

    expect(linhas).toEqual([{ unitId: 1, nome: 'Vila Mariana', media: 20, mesesComDado: 3 }]);
  });

  it('divide pelos meses COM dado, e nao sempre por 3', () => {
    // Uma unidade que abriu no meio do periodo seria rebaixada por dividir por
    // 3: 40 num mes so viraria 13,3 e ela cairia de "Bom" para "Ruim".
    const linhas = mediaPorUnidade([new Map(), new Map(), new Map([[2, 40]])], nomes);

    expect(linhas[0].media).toBe(40);
    expect(linhas[0].mesesComDado).toBe(1);
  });

  it('arredonda para uma casa decimal', () => {
    const linhas = mediaPorUnidade(
      [new Map([[1, 10]]), new Map([[1, 10]]), new Map([[1, 11]])],
      nomes,
    );

    expect(linhas[0].media).toBe(10.3);
  });

  it('ordena por media decrescente, empate pelo nome', () => {
    const linhas = mediaPorUnidade([new Map([[1, 5], [2, 5]])], nomes);

    expect(linhas.map((l) => l.nome)).toEqual(['Tijuca', 'Vila Mariana']);
  });

  it('unidade sem nome cadastrado nao some do relatorio', () => {
    const linhas = mediaPorUnidade([new Map([[99, 7]])], nomes);

    expect(linhas[0].nome).toBe('Unidade 99');
  });
});

describe('o periodo que cada relatorio cobre', () => {
  it('clusters: o mes corrente em Sao Paulo, e nao o do fuso da maquina', () => {
    // 01/01/2026 as 01:00 UTC ainda e 31/12/2025 em Sao Paulo (UTC-3). Uma
    // previa aberta nessa hora tem que dizer dezembro, igual ao cron.
    expect(mesEmSaoPaulo(new Date('2026-01-01T01:00:00Z'))).toBe('2025-12');
    expect(mesEmSaoPaulo(new Date('2026-07-15T12:00:00Z'))).toBe('2026-07');
  });

  it('experimentais: os 3 meses FECHADOS, sem o mes corrente', () => {
    // O mes corrente entrava na media pela metade. Em 03/09/2026 setembro
    // tinha 2 dias de dado contra dois meses inteiros, e a media afundava:
    // 31 unidades em "Bom" contra as 59 que a rede tinha de fato. Nao era erro
    // de conta -- era um mes incompleto competindo com meses completos.
    expect(janelaDeTresMesesFechados('2026-09')).toEqual(['2026-06', '2026-07', '2026-08']);
  });

  it('experimentais: a janela atravessa a virada de ano', () => {
    expect(janelaDeTresMesesFechados('2026-01')).toEqual(['2025-10', '2025-11', '2025-12']);
  });

  it('experimentais: a janela nunca inclui o mes que recebeu', () => {
    // Varredura: qualquer deslocamento de um mes aparece aqui, inclusive nas
    // viradas de ano, sem depender de eu ter escolhido o caso certo.
    for (let ano = 2025; ano <= 2027; ano++) {
      for (let m = 1; m <= 12; m++) {
        const corrente = `${ano}-${String(m).padStart(2, '0')}`;
        const janela = janelaDeTresMesesFechados(corrente);

        expect(janela, `janela de ${corrente}`).toHaveLength(3);
        expect(janela, `${corrente} entrou na propria janela`).not.toContain(corrente);
        expect(janela[2] < corrente, `${corrente}: janela termina em ${janela[2]}`).toBe(true);
      }
    }
  });

  it('nenhum index.ts guarda a propria copia dessas contas', () => {
    for (const arquivo of [IDX_CLUSTERS, IDX_EXPERIMENTAIS]) {
      const conteudo = readFileSync(arquivo, 'utf8');
      expect(conteudo, `${arquivo} redeclara o calculo de periodo`).not.toMatch(
        /function (mesEmSaoPaulo|janelaDeTresMeses)\(/,
      );
    }
  });
});
