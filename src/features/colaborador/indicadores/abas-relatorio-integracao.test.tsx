import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportRecipientsTab } from './components/admin/ReportRecipientsTab';
import { IntegrationStatusTab } from './components/admin/IntegrationStatusTab';

// As abas Relatório e Integração leem por um proxy do servidor de
// desenvolvimento (vite.config.ts), e não pelo cliente Supabase do navegador.
// Isso cria três respostas que se parecem na tela e precisam ser
// DIFERENTES para quem abre a aba:
//
//   503 → falta a chave de serviço. Tem conserto, e a tela diz qual.
//   erro/rede → não tem o que fazer na hora; mostra a mensagem crua.
//   200 com [] → não é falha nenhuma, é tabela vazia.
//
// Se as três colapsarem no mesmo "nada aqui", quem abrir a aba conclui que o
// Hub quebrou. É isso que este arquivo protege.

function envolver(no: ReactNode) {
  // retry desligado para o erro chegar na primeira tentativa, sem espera.
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{no}</QueryClientProvider>);
}

const CORPO_503 = {
  erro: 'INDICADORES_SERVICE_KEY não está definida no .env.local. Pegue a chave service_role...',
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('abas Relatório e Integração', () => {
  it('503 na aba Relatório diz onde colar a chave', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(CORPO_503), { status: 503 })),
    );
    envolver(<ReportRecipientsTab />);
    await waitFor(() =>
      expect(screen.getByText(/Chave de serviço não configurada/)).toBeInTheDocument(),
    );
    expect(screen.getAllByText(/INDICADORES_SERVICE_KEY/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\.env\.local/).length).toBeGreaterThan(0);
    expect(screen.getByText(/reinicie o/)).toBeInTheDocument();
  });

  it('503 na aba Integração diz onde colar a chave', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(CORPO_503), { status: 503 })),
    );
    envolver(<IntegrationStatusTab />);
    await waitFor(() =>
      expect(screen.getByText(/Chave de serviço não configurada/)).toBeInTheDocument(),
    );
  });

  it('erro de rede cai no aviso genérico, não no da chave', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Failed to fetch');
      }),
    );
    envolver(<IntegrationStatusTab />);
    await waitFor(() =>
      expect(screen.getByText(/Não foi possível ler os dados/)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Chave de serviço não configurada/)).toBeNull();
  });

  it('lista vazia é "sem dados", não erro', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })));
    envolver(<IntegrationStatusTab />);
    await waitFor(() =>
      expect(screen.getByText(/Nenhum registro de integração encontrado/)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Chave de serviço não configurada/)).toBeNull();
  });

  it('Relatório sem destinatários mostra o estado vazio e o horário padrão', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })));
    envolver(<ReportRecipientsTab />);
    await waitFor(() =>
      expect(screen.getByText(/Nenhum destinatário configurado/)).toBeInTheDocument(),
    );
    expect(screen.getByText('08:00')).toBeInTheDocument();
  });

  it('HTTP 200 com HTML (build, onde o proxy não existe) vira erro explicado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<!doctype html><html></html>', { status: 200 })),
    );
    envolver(<IntegrationStatusTab />);
    await waitFor(() =>
      expect(screen.getByText(/só existe no servidor de desenvolvimento/)).toBeInTheDocument(),
    );
  });

  it('execuções de verdade aparecem no histórico e nos cartões', async () => {
    const linhas = [
      {
        id: 1,
        source: 'api',
        status: 'success',
        records_received: 10,
        records_imported: 9,
        records_failed: 1,
        error_details: null,
        request_ip: null,
        started_at: '2026-07-30T10:00:00Z',
        completed_at: '2026-07-30T10:00:05Z',
        duration_ms: 5000,
      },
    ];
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(linhas), { status: 200 })));
    envolver(<IntegrationStatusTab />);
    await waitFor(() => expect(screen.getByText('Operacional')).toBeInTheDocument());
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Sucesso')).toBeInTheDocument();
  });

  it('destinatários aparecem com o estado como Badge e nada de editar sobrou', async () => {
    const recipients = [
      { id: 1, email: 'a@b.com', name: 'Ana', active: true, created_at: '2026-01-01T00:00:00Z' },
      { id: 2, email: 'c@d.com', name: null, active: false, created_at: '2026-01-02T00:00:00Z' },
    ];
    const settings = [
      { id: 1, send_hour: 7, send_minute: 30, enabled: false, updated_at: '2026-01-01T00:00:00Z' },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (url: string) =>
          new Response(JSON.stringify(String(url).includes('settings') ? settings : recipients), {
            status: 200,
          }),
      ),
    );
    envolver(<ReportRecipientsTab />);
    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument());
    expect(screen.getByText('07:30')).toBeInTheDocument();
    expect(screen.getByText('Desativado')).toBeInTheDocument();
    expect(screen.getByText('Sim')).toBeInTheDocument();
    expect(screen.getByText('Não')).toBeInTheDocument();

    // A aba é de consulta: nenhum interruptor e nenhum botão devem existir.
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
