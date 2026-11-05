import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// O menu só precisa saber quem está logado e se a pessoa tem unidade.
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'renata.louzada@purepilates.com.br' },
    signOut: vi.fn(),
    isAdmin: false,
    isColaborador: true,
    userType: 'colaborador',
  }),
}));
vi.mock('@/features/colaborador/dashboard/hooks/useHasUnitAccess', () => ({
  useHasUnitAccess: () => false,
}));

import Sidebar from './Sidebar';

// Bug de 05/11/2026: clicar numa seção (Colaboradores, Marketing) jogava a
// lista do menu de volta ao topo, porque a lista inteira era montada de novo.
describe('rolagem do menu lateral', () => {
  it('abrir uma seção não remonta a lista nem perde a rolagem', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>,
    );
    const lista = document.querySelector('aside nav') as HTMLElement;
    lista.scrollTop = 300;

    fireEvent.click(screen.getByText('Colaboradores'));
    fireEvent.click(screen.getByText('Marketing'));

    const depois = document.querySelector('aside nav') as HTMLElement;
    expect(depois).toBe(lista);
    expect(depois.scrollTop).toBe(300);
  });

  it('um menu montado numa página nova volta para onde a lista estava', () => {
    const primeira = render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>,
    );
    const lista = document.querySelector('aside nav') as HTMLElement;
    lista.scrollTop = 420;
    fireEvent.scroll(lista);
    primeira.unmount();

    render(
      <MemoryRouter initialEntries={['/feed']}>
        <Sidebar />
      </MemoryRouter>,
    );
    expect((document.querySelector('aside nav') as HTMLElement).scrollTop).toBe(420);
  });
});
