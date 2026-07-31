import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReportRecipientsTab } from './components/admin/ReportRecipientsTab';
import { IntegrationStatusTab } from './components/admin/IntegrationStatusTab';
import type { IntegrationLog } from './hooks/useIntegrationLogs';

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

/** Como a aba escreve uma data. Calculado do mesmo jeito para o teste não
 *  depender do fuso da máquina que o roda. */
function comoNaTela(iso: string): string {
  return format(new Date(iso), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
}

/** Uma execução, com só o que o teste precisa mexer. */
function execucao(campos: Partial<IntegrationLog> & { id: number }): IntegrationLog {
  return {
    source: 'api',
    status: 'success',
    records_received: null,
    records_imported: null,
    records_failed: null,
    error_details: null,
    request_ip: null,
    started_at: null,
    completed_at: null,
    duration_ms: null,
    ...campos,
  };
}

/** O `<p>` de um cartão do topo, casado pelo texto inteiro — sem isso um
 *  número solto do cartão se confunde com o mesmo número na tabela. */
function paragrafoExato(texto: string) {
  return screen.getByText(
    (_conteudo, elemento) => elemento?.tagName === 'P' && elemento.textContent === texto,
  );
}

function respondeCom(corpo: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(corpo), { status: 200 })));
}

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

  it('Relatório sem destinatários mostra o estado vazio', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })));
    envolver(<ReportRecipientsTab />);
    await waitFor(() =>
      expect(screen.getByText(/Nenhum destinatário configurado/)).toBeInTheDocument(),
    );
  });

  it('sem configuração salva, o padrão aparece marcado como padrão', async () => {
    // report_settings vazia. A aba mostra 08:00/Ativado porque é o padrão do
    // código — e tem que dizer isso, senão passa por configuração gravada.
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })));
    envolver(<ReportRecipientsTab />);
    await waitFor(() => expect(screen.getByText('08:00')).toBeInTheDocument());

    expect(screen.getAllByText('(padrão)').length).toBe(2);
    expect(screen.getByText(/Nenhuma configuração salva no banco/)).toBeInTheDocument();
  });

  it('com configuração salva, nada é marcado como padrão', async () => {
    const settings = [
      { id: 1, send_hour: 7, send_minute: 30, enabled: true, updated_at: '2026-01-01T00:00:00Z' },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (url: string) =>
          new Response(JSON.stringify(String(url).includes('settings') ? settings : []), {
            status: 200,
          }),
      ),
    );
    envolver(<ReportRecipientsTab />);
    await waitFor(() => expect(screen.getByText('07:30')).toBeInTheDocument());

    expect(screen.queryByText('(padrão)')).toBeNull();
    expect(screen.queryByText(/Nenhuma configuração salva no banco/)).toBeNull();
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
    respondeCom([
      execucao({
        id: 1,
        records_received: 10,
        records_imported: 9,
        records_failed: 1,
        started_at: '2026-07-30T10:00:00Z',
        completed_at: '2026-07-30T10:00:05Z',
        duration_ms: 5000,
      }),
    ]);
    envolver(<IntegrationStatusTab />);
    await waitFor(() => expect(screen.getByText('Operacional')).toBeInTheDocument());

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Sucesso')).toBeInTheDocument();
    // Cartão "Última Sincronização": a conclusão, não o início.
    expect(paragrafoExato(comoNaTela('2026-07-30T10:00:05Z'))).toBeInTheDocument();
    // Cartão "Último Import": o dado vem da execução escolhida.
    expect(paragrafoExato('9 registros')).toBeInTheDocument();
  });

  // Os dois casos abaixo existem porque `ultimaSincronizacaoBemSucedida` é a
  // única divergência real de comportamento em relação à origem (ela busca só
  // dentro das execuções carregadas, em vez de consultar o banco inteiro).
  // Sem eles, trocar o corpo da função por `return null` não quebrava nada.

  it('a sincronização escolhida é a que terminou por último, não a que começou', async () => {
    // A lista chega ordenada por started_at, e as duas ordens divergem: a
    // execução 2 começou antes e terminou depois (demorou mais).
    respondeCom([
      execucao({
        id: 1,
        records_imported: 9,
        started_at: '2026-07-30T10:00:00Z',
        completed_at: '2026-07-30T10:00:05Z',
      }),
      execucao({
        id: 2,
        records_imported: 77,
        started_at: '2026-07-30T09:00:00Z',
        completed_at: '2026-07-30T12:00:00Z',
      }),
    ]);
    envolver(<IntegrationStatusTab />);
    await waitFor(() => expect(paragrafoExato('77 registros')).toBeInTheDocument());

    expect(paragrafoExato(comoNaTela('2026-07-30T12:00:00Z'))).toBeInTheDocument();
  });

  it('compara instantes, não texto: fuso escrito de outro jeito não confunde', async () => {
    // 12:30 em +02:00 é 10:30 UTC — anterior a 12:00Z. Em ordem alfabética,
    // porém, "12:30:00+02:00" vem depois de "12:00:00Z".
    respondeCom([
      execucao({
        id: 1,
        records_imported: 5,
        started_at: '2026-07-30T11:50:00Z',
        completed_at: '2026-07-30T12:00:00Z',
      }),
      execucao({
        id: 2,
        records_imported: 42,
        started_at: '2026-07-30T10:20:00Z',
        completed_at: '2026-07-30T12:30:00+02:00',
      }),
    ]);
    envolver(<IntegrationStatusTab />);
    await waitFor(() => expect(screen.getByText('Operacional')).toBeInTheDocument());

    expect(paragrafoExato('5 registros')).toBeInTheDocument();
    expect(screen.queryByText('42 registros')).toBeNull();
  });

  it('execução sem data de conclusão não passa na frente de uma que tem', async () => {
    respondeCom([
      execucao({ id: 1, records_imported: 3, started_at: '2026-07-30T11:00:00Z' }),
      execucao({
        id: 2,
        records_imported: 8,
        started_at: '2026-07-30T10:00:00Z',
        completed_at: '2026-07-30T10:30:00Z',
      }),
    ]);
    envolver(<IntegrationStatusTab />);
    await waitFor(() => expect(paragrafoExato('8 registros')).toBeInTheDocument());

    expect(paragrafoExato(comoNaTela('2026-07-30T10:30:00Z'))).toBeInTheDocument();
  });

  it('sem nenhuma execução bem-sucedida, o cartão diz "Nenhuma"', async () => {
    respondeCom([
      execucao({
        id: 1,
        status: 'error',
        records_imported: 0,
        started_at: '2026-07-30T10:00:00Z',
        completed_at: '2026-07-30T10:00:01Z',
      }),
    ]);
    envolver(<IntegrationStatusTab />);
    // Espera o histórico sair do Skeleton: "Nenhuma" também aparece durante o
    // carregamento, então esperar por ele não provaria nada.
    // Uma vez no cartão de status, outra no Badge da linha do histórico.
    await waitFor(() => expect(screen.getAllByText('Erro').length).toBe(2));

    expect(paragrafoExato('Nenhuma')).toBeInTheDocument();
    expect(paragrafoExato('- registros')).toBeInTheDocument();
  });

  it('o cartão de sincronização diz o escopo da busca', async () => {
    respondeCom([]);
    envolver(<IntegrationStatusTab />);
    await waitFor(() =>
      expect(screen.getByText(/Última Sincronização \(nas 20 últimas\)/)).toBeInTheDocument(),
    );
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
