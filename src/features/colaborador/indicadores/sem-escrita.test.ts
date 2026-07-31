import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// A área de Dashboard é SOMENTE CONSULTA por decisão de produto: ela lê um
// banco Supabase de produção compartilhado com o painel do Cloudflare, e uma
// escrita feita daqui valeria para todo mundo na hora, sem desfazer e sem
// registro de autoria. A garantia não é "botão desabilitado" — é a ausência
// de qualquer caminho de escrita no código. Este teste é o que sustenta isso.
const RAIZ = 'src/features/colaborador/indicadores';
const PROIBIDOS = ['.insert(', '.upsert(', '.update(', '.delete(', 'functions.invoke('];

// `.rpc(` não pode ser banido em bloco: a feature já usa RPC de leitura para
// contornar o limite de 1000 linhas do Supabase. Mas também não pode ser
// liberado em bloco: uma função Postgres pode ser SECURITY DEFINER, ou seja,
// roda com os privilégios de quem a criou e ignora a segurança de linha por
// completo — é o caminho de escrita mais potente que existe nesse banco.
// Por isso a lista é de nomes, um a um, conferidos como somente-leitura.
const RPCS_DE_LEITURA_PERMITIDAS = ['get_raw_daily_aggregated'];

// Captura o primeiro argumento de cada `.rpc(` para conferir o nome chamado.
const CHAMADA_RPC = /\.rpc\s*\(\s*([^,)]*)/g;
// Só aceitamos um literal de string simples: 'nome', "nome" ou `nome`.
const NOME_LITERAL = /^(['"`])([A-Za-z0-9_]+)\1$/;

const MOTIVO_RPC =
  'RPC não permitida na área de Dashboard. Uma função Postgres pode ser SECURITY DEFINER e ' +
  'escrever no banco de produção ignorando a segurança de linha, então só passam nomes que ' +
  'já foram conferidos como somente-leitura. A saída NÃO é apagar esta checagem: é confirmar ' +
  'que a função só lê e acrescentar o nome em RPCS_DE_LEITURA_PERMITIDAS, neste arquivo. ' +
  'Se a chamada aparecer com nome dinâmico (variável, template com interpolação), ela falha ' +
  'de propósito — o nome precisa ser legível aqui para poder ser conferido.';

function arquivosDe(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivosDe(caminho);
    return /\.(ts|tsx)$/.test(nome) ? [caminho] : [];
  });
}

function linhaDoIndice(conteudo: string, indice: number): number {
  return conteudo.slice(0, indice).split('\n').length;
}

describe('área de Dashboard é somente consulta', () => {
  it('nenhum arquivo da feature contém chamada de escrita no banco', () => {
    const infratores: string[] = [];

    for (const arquivo of arquivosDe(RAIZ)) {
      if (arquivo.endsWith('sem-escrita.test.ts')) continue;
      const conteudo = readFileSync(arquivo, 'utf8');

      conteudo.split('\n').forEach((linha, i) => {
        for (const proibido of PROIBIDOS) {
          if (linha.includes(proibido)) {
            infratores.push(`${arquivo}:${i + 1} → ${proibido}  ${linha.trim()}`);
          }
        }
      });

      // A varredura de RPC roda sobre o arquivo inteiro, e não linha a linha,
      // para também pegar a chamada que quebra o nome na linha de baixo.
      for (const achado of conteudo.matchAll(CHAMADA_RPC)) {
        const linha = linhaDoIndice(conteudo, achado.index ?? 0);
        const argumento = (achado[1] ?? '').trim();
        const nome = NOME_LITERAL.exec(argumento)?.[2];

        // Sem nome legível, falha: a trava erra para o lado seguro.
        if (!nome || !RPCS_DE_LEITURA_PERMITIDAS.includes(nome)) {
          infratores.push(`${arquivo}:${linha} → .rpc(${argumento || '?'})`);
        }
      }
    }

    expect(infratores, MOTIVO_RPC).toEqual([]);
  });
});
