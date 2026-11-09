import { StrictMode, type ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Abre a página grande de um projeto com dados iguais aos do banco (projeto com
// subtarefas) e confere que ela monta sem quebrar.

const projeto = {
  id: 'p1', item_pai_id: null, projeto_id: null, titulo: 'Retrospectiva 2026', descricao: '<p>Briefing</p>',
  status: 'em_andamento', prioridade: 'alta', responsaveis: ['u1'], data_inicio: '2026-11-09', prazo: '2026-11-13',
  estimativa_horas: null, etiquetas: ['retrospectiva'], links: [], aguardando: [], ordem: 0, concluida_em: null,
  arquivado: false, criado_por: 'u1', created_at: '2026-11-09T20:00:00Z',
  prazo_pre_planejamento: null, prazo_planejamento: null, prazo_producao: null, prazo_no_ar: null,
};
const sub = { ...projeto, id: 's1', item_pai_id: 'p1', projeto_id: 'p1', titulo: 'Frente 01 · Performance', status: 'a_fazer' };

const TABELAS: Record<string, unknown[]> = {
  marketing_itens: [projeto, sub],
  marketing_anexos: [],
  marketing_checklist: [],
  marketing_comentarios: [],
  marketing_atividade: [{ id: 'a1', item_id: 'p1', autor_id: 'u1', campo: 'criou', de: null, para: 'Retrospectiva 2026', created_at: '2026-11-09T20:00:00Z' }],
  profiles: [{ user_id: 'u1', full_name: 'Renata Louzada', avatar_url: null, email: 'renata.louzada@purepilates.com.br' }],
};

function consulta(tabela: string) {
  let linhas = [...(TABELAS[tabela] ?? [])] as Record<string, unknown>[];
  let uma = false;
  const q: Record<string, unknown> = {
    select: () => q,
    order: () => q,
    in: () => q,
    or: () => q,
    eq: (campo: string, valor: unknown) => {
      if (campo === 'id') linhas = linhas.filter((l) => l.id === valor);
      return q;
    },
    maybeSingle: () => {
      uma = true;
      return q;
    },
    then: (ok: (r: unknown) => unknown) => Promise.resolve({ data: uma ? linhas[0] ?? null : linhas, error: null }).then(ok),
  };
  return q;
}

vi.mock('@/integrations/supabase/client', () => {
  // Como o Supabase real: canal com o mesmo nome volta o MESMO objeto, e .on()
  // depois do subscribe() lança erro.
  const canais = new Map<string, { assinado: boolean; on: () => unknown; subscribe: () => unknown }>();
  const channel = (nome: string) => {
    const existente = canais.get(nome);
    if (existente) return existente;
    const c = {
      assinado: false,
      on() {
        if (c.assinado) throw new Error(`tried to add postgres_changes callbacks for realtime:${nome} after subscribe()`);
        return c;
      },
      subscribe() {
        c.assinado = true;
        return c;
      },
    };
    canais.set(nome, c);
    return c;
  };
  return {
    supabase: {
      from: (t: string) => consulta(t),
      channel,
      // no real, removeChannel é assíncrono: o canal ainda existe na remontagem
      removeChannel: () => Promise.resolve(),
      storage: { from: () => ({ createSignedUrls: async () => ({ data: [] }) }) },
    },
  };
});
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1', email: 'renata.louzada@purepilates.com.br' } }) }));
vi.mock('@/components/layout/MainLayout', () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
// editor real, para pegar erro dele também
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import ItemMarketing from './ItemMarketing';

describe('página grande do projeto', () => {
  it('abre o projeto com as subtarefas e fecha sem erro', async () => {
    // Como no Chrome novo: scrollIntoView devolve uma Promise (a causa do
    // "destroy is not a function" de 09/11/2026).
    Element.prototype.scrollIntoView = () => Promise.resolve() as unknown as void;
    const { unmount } = render(
      <StrictMode>
        <MemoryRouter initialEntries={['/marketing/projetos/p1']}>
          <Routes>
            <Route path="/marketing/projetos/:id" element={<ItemMarketing />} />
          </Routes>
        </MemoryRouter>
      </StrictMode>,
    );
    await waitFor(() => expect(screen.getByDisplayValue('Retrospectiva 2026')).toBeTruthy());
    expect(screen.getByText('Frente 01 · Performance')).toBeTruthy();
    expect(() => unmount()).not.toThrow();
  });
});
