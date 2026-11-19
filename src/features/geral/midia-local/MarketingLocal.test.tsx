import type { ReactNode } from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/components/layout/MainLayout', () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));

// A página é só do time: por padrão os testes entram como colaborador.
const auth = { isColaborador: true, isAdmin: false, loading: false, profileLoading: false };
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }));

import MarketingLocal from './MarketingLocal';
import { PRACAS_TV, pacoteCompleto, reais } from './dados-pracas';

describe('Marketing local · só para o time', () => {
  const abrirComo = (papel: Partial<typeof auth>) => {
    Object.assign(auth, { isColaborador: false, isAdmin: false, loading: false, profileLoading: false }, papel);
    return render(
      <MemoryRouter initialEntries={['/marketing-local']}>
        <Routes>
          <Route path="/marketing-local" element={<MarketingLocal />} />
          <Route path="/" element={<div>início</div>} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('franqueado é levado para o início', () => {
    abrirComo({});
    expect(screen.getByText('início')).toBeTruthy();
  });

  it('admin vê a página', () => {
    abrirComo({ isAdmin: true });
    expect(screen.queryByText('início')).toBeNull();
    expect(screen.getAllByRole('link', { name: /pedir mídia local/i }).length).toBeGreaterThan(0);
  });

  it('enquanto o papel carrega, não manda ninguém embora', () => {
    abrirComo({ profileLoading: true });
    expect(screen.queryByText('início')).toBeNull();
  });
});

describe('Marketing local · TV Globo', () => {
  beforeEach(() => Object.assign(auth, { isColaborador: true, isAdmin: false, loading: false, profileLoading: false }));

  const abrir = () => render(<MemoryRouter><MarketingLocal /></MemoryRouter>);

  it('mostra todas as praças da planilha com TV e pacote completo', () => {
    abrir();
    for (const p of PRACAS_TV) {
      const linha = screen.getByText(p.cidade).closest('tr')!;
      expect(linha.textContent).toContain(reais(p.investimento));
      expect(linha.textContent).toContain(reais(pacoteCompleto(p.investimento)));
    }
  });

  it('traz os exemplos de cidade do PDF', () => {
    abrir();
    expect(screen.getByText(/Bragança Paulista/)).toBeTruthy();
    expect(screen.getByText('R$ 10.793,53')).toBeTruthy();
    expect(screen.getByText('R$ 7.896,50')).toBeTruthy();
  });

  it('os dois PDFs estão para baixar', () => {
    abrir();
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(links).toContain('/arquivos/midia-local/diferentes-brasis-franquias.pdf');
    expect(links).toContain('/arquivos/midia-local/gama-dooh-2026.pdf');
  });

  it('o botão "Pedir mídia local" leva ao formulário', () => {
    abrir();
    const botoes = screen.getAllByRole('link', { name: /pedir mídia local/i });
    expect(botoes.length).toBeGreaterThan(0);
    for (const b of botoes) expect(b.getAttribute('href')).toBe('/autorizar-midia-local');
  });
});
