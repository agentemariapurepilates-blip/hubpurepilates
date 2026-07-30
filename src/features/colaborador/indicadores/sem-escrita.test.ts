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

function arquivosDe(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivosDe(caminho);
    return /\.(ts|tsx)$/.test(nome) ? [caminho] : [];
  });
}

describe('área de Dashboard é somente consulta', () => {
  it('nenhum arquivo da feature contém chamada de escrita no banco', () => {
    const infratores: string[] = [];

    for (const arquivo of arquivosDe(RAIZ)) {
      if (arquivo.endsWith('sem-escrita.test.ts')) continue;
      const linhas = readFileSync(arquivo, 'utf8').split('\n');
      linhas.forEach((linha, i) => {
        for (const proibido of PROIBIDOS) {
          if (linha.includes(proibido)) {
            infratores.push(`${arquivo}:${i + 1} → ${proibido}  ${linha.trim()}`);
          }
        }
      });
    }

    expect(infratores).toEqual([]);
  });
});
