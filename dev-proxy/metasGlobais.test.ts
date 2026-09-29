import { describe, it, expect } from 'vitest';
import { ErroDeMetas, salvarMetasGlobais, validarPedido, type MetaDoDia } from './metasGlobais';

// Banco falso que entende só o que o módulo usa da API REST: GET do mês, PATCH
// por id e POST. Guarda cada chamada para o teste conferir O QUE foi escrito,
// e não só o resultado final.
function bancoFalso(linhasIniciais: Array<MetaDoDia & { id: number }>, opcoes: { ignorarPatch?: boolean } = {}) {
  const linhas = linhasIniciais.map((l) => ({ ...l }));
  const chamadas: Array<{ metodo: string; url: string; corpo?: unknown }> = [];
  let proximoId = 1000;

  const fetchFalso = (async (url: string, init?: RequestInit) => {
    const metodo = init?.method ?? 'GET';
    const corpo = init?.body ? JSON.parse(String(init.body)) : undefined;
    chamadas.push({ metodo, url, corpo });
    const u = new URL(url);

    if (metodo === 'GET') {
      const [gte, lte] = u.searchParams.getAll('date').map((d) => d.slice(4));
      const doMes = linhas.filter((l) => l.date >= gte && l.date <= lte);
      return new Response(JSON.stringify(doMes), { status: 200 });
    }
    if (metodo === 'PATCH') {
      const id = Number(u.searchParams.get('id')!.slice(3));
      const alvo = linhas.filter((l) => l.id === id);
      if (!opcoes.ignorarPatch) alvo.forEach((l) => Object.assign(l, corpo));
      return new Response(JSON.stringify(alvo), { status: 200 });
    }
    const novas = (corpo as MetaDoDia[]).map((m) => ({ ...m, id: proximoId++ }));
    linhas.push(...novas);
    return new Response(JSON.stringify(novas), { status: 201 });
  }) as typeof fetch;

  return { linhas, chamadas, conexao: { base: 'https://banco.test', chave: 'k', fetch: fetchFalso } };
}

const meta = (date: string, metric_key: string, daily_target: number): MetaDoDia => ({ date, metric_key, daily_target });

describe('validarPedido', () => {
  it('aceita um pedido correto', () => {
    const metas = [meta('2026-10-01', 'experimentais', 500), meta('2026-10-31', 'matriculas_total', 0)];
    expect(validarPedido('2026-10', { metas })).toEqual(metas);
  });

  it.each([
    ['mês malformado', '2026-13', [meta('2026-13-01', 'experimentais', 1)]],
    ['data de outro mês', '2026-10', [meta('2026-11-01', 'experimentais', 1)]],
    ['dia que não existe', '2026-09', [meta('2026-09-31', 'experimentais', 1)]],
    ['indicador fora da aba', '2026-10', [meta('2026-10-01', 'faturamento', 1)]],
    ['valor negativo', '2026-10', [meta('2026-10-01', 'experimentais', -1)]],
    ['valor decimal', '2026-10', [meta('2026-10-01', 'experimentais', 1.5)]],
    ['célula repetida', '2026-10', [meta('2026-10-01', 'experimentais', 1), meta('2026-10-01', 'experimentais', 2)]],
    ['lista vazia', '2026-10', []],
  ])('recusa %s', (_nome, mes, metas) => {
    expect(() => validarPedido(mes, { metas })).toThrow(ErroDeMetas);
  });

  it('não aceita escolher a unidade: unit_id enviado é descartado', () => {
    const [m] = validarPedido('2026-10', { metas: [{ ...meta('2026-10-01', 'experimentais', 3), unit_id: 42 }] });
    expect(m).not.toHaveProperty('unit_id');
  });
});

describe('salvarMetasGlobais', () => {
  it('atualiza por id o que existe, insere o que falta e não toca no que não mudou', async () => {
    const b = bancoFalso([
      { id: 1, ...meta('2026-10-01', 'experimentais', 100) },
      { id: 2, ...meta('2026-10-01', 'matriculas_total', 10) },
    ]);

    const r = await salvarMetasGlobais(b.conexao, '2026-10', [
      meta('2026-10-01', 'experimentais', 150),
      meta('2026-10-01', 'matriculas_total', 10),
      meta('2026-10-02', 'experimentais', 90),
    ]);

    expect(r).toEqual({ criadas: 1, atualizadas: 1, inalteradas: 1 });
    expect(b.chamadas.filter((c) => c.metodo === 'PATCH').map((c) => c.url)).toEqual([
      'https://banco.test/rest/v1/daily_goals?id=eq.1',
    ]);
    const post = b.chamadas.find((c) => c.metodo === 'POST');
    expect(post?.corpo).toEqual([{ ...meta('2026-10-02', 'experimentais', 90), unit_id: null }]);
  });

  it('mês futuro sem nenhuma meta vira só inserção', async () => {
    const b = bancoFalso([]);
    const r = await salvarMetasGlobais(b.conexao, '2027-02', [meta('2027-02-28', 'experimentais', 7)]);
    expect(r).toEqual({ criadas: 1, atualizadas: 0, inalteradas: 0 });
    expect(b.linhas).toHaveLength(1);
  });

  it('recusa salvar quando o banco já tem duplicata daquela célula', async () => {
    const b = bancoFalso([
      { id: 1, ...meta('2026-10-01', 'experimentais', 100) },
      { id: 2, ...meta('2026-10-01', 'experimentais', 120) },
    ]);
    await expect(salvarMetasGlobais(b.conexao, '2026-10', [meta('2026-10-05', 'experimentais', 1)])).rejects.toMatchObject({
      status: 409,
    });
    expect(b.chamadas.some((c) => c.metodo !== 'GET')).toBe(false);
  });

  it('não diz "salvo" se a releitura não confirma o valor', async () => {
    const b = bancoFalso([{ id: 1, ...meta('2026-10-01', 'experimentais', 100) }], { ignorarPatch: true });
    await expect(salvarMetasGlobais(b.conexao, '2026-10', [meta('2026-10-01', 'experimentais', 200)])).rejects.toMatchObject({
      status: 500,
    });
  });
});
