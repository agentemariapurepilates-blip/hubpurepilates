import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionCard } from './ConnectionCard';
import { SOCIAL_NETWORKS } from '@/data/social-networks';

const igConfig = SOCIAL_NETWORKS[0];

describe('ConnectionCard', () => {
  it('renderiza estado "Não conectado" sem connection', () => {
    render(
      <ConnectionCard
        config={igConfig}
        connection={null}
        followers={null}
        loading={false}
        onConnect={() => {}}
        onDisconnect={() => {}}
      />
    );
    expect(screen.getByText(/Não conectado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Conectar/i })).toBeInTheDocument();
  });

  it('renderiza handle e seguidores quando conectado', () => {
    render(
      <ConnectionCard
        config={igConfig}
        connection={{ status: 'active', account_handle: '@purepilatesbr' }}
        followers={124567}
        loading={false}
        onConnect={() => {}}
        onDisconnect={() => {}}
      />
    );
    expect(screen.getByText('@purepilatesbr')).toBeInTheDocument();
    expect(screen.getByText('124.567')).toBeInTheDocument();
  });

  it('chama onConnect ao clicar em Conectar', () => {
    const onConnect = vi.fn();
    render(
      <ConnectionCard
        config={igConfig}
        connection={null}
        followers={null}
        loading={false}
        onConnect={onConnect}
        onDisconnect={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Conectar/i }));
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it('chama onDisconnect ao clicar em Desconectar', () => {
    const onDisconnect = vi.fn();
    render(
      <ConnectionCard
        config={igConfig}
        connection={{ status: 'active', account_handle: '@purepilatesbr' }}
        followers={1000}
        loading={false}
        onConnect={() => {}}
        onDisconnect={onDisconnect}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Desconectar/i }));
    expect(onDisconnect).toHaveBeenCalledOnce();
  });
});
