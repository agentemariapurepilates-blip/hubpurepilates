import { describe, it, expect } from 'vitest';
import { mesclarLeads } from '../../../../../scripts/lib/mescla-leads.mjs';

// O Meta só entrega os leads dos últimos 90 dias. A tarefa agendada que
// atualiza a prévia local reescrevia o arquivo inteiro só com o que o Meta
// devolvia, então todo dia o lead mais antigo saía da tela e se perdia (em
// 05/10/2026 a prévia já tinha perdido o de junho que mostrava antes). A mescla
// existe para que o que o Meta deixa de entregar CONTINUE guardado.

const lead = (id: string, criado: string, extra: Record<string, unknown> = {}) => ({
  id,
  created_time: criado,
  form_name: 'form',
  field_data: [],
  ...extra,
});

describe('mesclarLeads', () => {
  it('mantém o lead que o Meta deixou de devolver', () => {
    const r = mesclarLeads(
      [lead('antigo', '2026-06-01T10:00:00+0000'), lead('a', '2026-09-01T10:00:00+0000')],
      [lead('a', '2026-09-01T10:00:00+0000'), lead('novo', '2026-10-05T10:00:00+0000')],
    );
    expect(r.leads.map((l: { id: string }) => l.id)).toEqual(['novo', 'a', 'antigo']);
    expect(r.preservados).toBe(1);
    expect(r.adicionados).toBe(1);
  });

  it('o que o Meta devolve agora vale mais que a cópia guardada', () => {
    const r = mesclarLeads(
      [lead('a', '2026-09-01T10:00:00+0000', { adset_name: 'nome velho' })],
      [lead('a', '2026-09-01T10:00:00+0000', { adset_name: 'nome novo' })],
    );
    expect(r.leads).toHaveLength(1);
    expect(r.leads[0].adset_name).toBe('nome novo');
    expect(r.atualizados).toBe(1);
  });

  it('ordena do mais novo para o mais antigo', () => {
    const r = mesclarLeads(
      [lead('b', '2026-03-10T10:00:00+0000')],
      [lead('c', '2026-07-01T10:00:00+0000'), lead('a', '2026-05-01T10:00:00+0000')],
    );
    expect(r.leads.map((l: { id: string }) => l.id)).toEqual(['c', 'a', 'b']);
  });

  it('sem arquivo anterior, devolve só os novos', () => {
    const r = mesclarLeads(undefined, [lead('a', '2026-09-01T10:00:00+0000')]);
    expect(r.leads).toHaveLength(1);
    expect(r.preservados).toBe(0);
  });

  it('uma resposta vazia do Meta NÃO apaga o que já estava guardado', () => {
    // Falha de token ou de permissão devolve lista vazia sem erro (já aconteceu
    // com o token de usuário). Sobrescrever com isso apagaria tudo.
    const r = mesclarLeads([lead('a', '2026-09-01T10:00:00+0000')], []);
    expect(r.leads).toHaveLength(1);
    expect(r.preservados).toBe(1);
  });

  it('ignora entradas sem id em vez de juntar todas numa só', () => {
    const r = mesclarLeads([], [{ created_time: '2026-09-01T10:00:00+0000' }, lead('a', '2026-09-02T10:00:00+0000')]);
    expect(r.leads.map((l: { id: string }) => l.id)).toEqual(['a']);
    expect(r.descartados).toBe(1);
  });
});
