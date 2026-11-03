import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1' }, loading: false }) }));
vi.mock('@/components/layout/MainLayout', () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import AutorizarMidiaAdicional from './AutorizarMidiaAdicional';
import SolicitarVerbaProfessores from '../verba-professores/SolicitarVerbaProfessores';

// 03/11/2026: uma franqueada quis aula experimental (atrair ALUNOS) e preencheu a
// Campanha Aporte Recrutamento (atrair PROFESSORES). Os dois formulários são
// parecidos e os nomes só diferem na última palavra. A primeira linha de cada tela
// precisa dizer, sem ambiguidade, para que ela serve — e levar à outra.

beforeAll(() => {
  // A tela de aula experimental usa o grupo de rádio do Radix (os planos), que
  // lê o tamanho do elemento — e o jsdom não tem ResizeObserver. Mesmo remendo
  // do PedidosPureStore.test.tsx.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
});

function primeiraLinha(tela: ReactNode) {
  render(<MemoryRouter>{tela}</MemoryRouter>);
  const titulo = screen.getByRole('heading', { level: 1 });
  return { titulo, linha: titulo.parentElement!.querySelector('p')! };
}

describe('Campanha Aporte Recrutamento', () => {
  it('a primeira linha diz que é para atrair professores e leva à de aula experimental', () => {
    const { titulo, linha } = primeiraLinha(<SolicitarVerbaProfessores />);

    expect(titulo.textContent).toMatch(/Campanha Aporte Recrutamento/);
    expect(linha.textContent).toMatch(/atrair professores \(instrutores\) para a unidade/i);
    expect(linha.textContent).toMatch(/atrair alunos/i);

    const link = linha.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('/autorizar-midia-adicional');
    expect(link.textContent).toMatch(/Campanha Aporte Aula Experimental/);
  });
});

describe('Campanha Aporte Aula Experimental', () => {
  it('a primeira linha diz que é para atrair alunos e leva à de recrutamento', () => {
    const { titulo, linha } = primeiraLinha(<AutorizarMidiaAdicional />);

    expect(titulo.textContent).toMatch(/Campanha Aporte Aula Experimental/);
    expect(linha.textContent).toMatch(/aula experimental para atrair alunos/i);
    expect(linha.textContent).toMatch(/atrair professores/i);

    const link = linha.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('/autorizar-verba-professores');
    expect(link.textContent).toMatch(/Campanha Aporte Recrutamento/);
  });
});
