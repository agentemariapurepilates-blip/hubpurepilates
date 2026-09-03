import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviaDoRelatorio, type HooksDaPrevia } from './PreviaDoRelatorio';

// A prévia mostra o e-mail REAL: o mesmo email.ts que a Edge Function usa no
// envio, montado no navegador. Não é uma imitação em HTML do Hub. Daí os dois
// riscos que estes testes seguram:
//
// 1. O corpo é HTML de e-mail, com <style> e <table> próprios. Solto na página
//    ele herdaria (e atropelaria) o estilo do Hub. Por isso vai num iframe.
// 2. O texto do erro precisa apontar para o lugar certo. Ele já culpou a
//    publicação da Edge Function, o que deixou de ser verdade quando a prévia
//    passou a ser local — e mandaria a pessoa fazer deploy à toa.

const enviarTeste = vi.fn();

function hooks(sobrescreve: Partial<ReturnType<HooksDaPrevia['usarPrevia']>> = {}): HooksDaPrevia {
  return {
    usarPrevia: (() => ({
      data: { assunto: 'Clusters de matriculados — julho de 2026', corpo: '<h1>Clusters</h1>' },
      isLoading: false,
      isError: false,
      error: null,
      ...sobrescreve,
    })) as never,
    usarTeste: (() => ({ mutate: enviarTeste, isPending: false })) as never,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('PreviaDoRelatorio', () => {
  it('mostra o assunto do e-mail que vai sair', () => {
    render(<PreviaDoRelatorio hooks={hooks()} nomeDoRelatorio="relatório de clusters" />);

    expect(screen.getByText(/Clusters de matriculados — julho de 2026/)).toBeInTheDocument();
  });

  it('põe o corpo num iframe, e não solto na página', () => {
    // Solto, o <style> do e-mail valeria para o Hub inteiro.
    const { container } = render(
      <PreviaDoRelatorio hooks={hooks()} nomeDoRelatorio="relatório de clusters" />,
    );

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('srcdoc')).toContain('<h1>Clusters</h1>');
    expect(container.querySelector('h1')).toBeNull();
  });

  it('enquanto monta, não mostra iframe nenhum', () => {
    const { container } = render(
      <PreviaDoRelatorio
        hooks={hooks({ data: undefined, isLoading: true })}
        nomeDoRelatorio="relatório de clusters"
      />,
    );

    expect(screen.getByText(/Montando a prévia/)).toBeInTheDocument();
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('no erro, mostra a mensagem crua de quem falhou', () => {
    render(
      <PreviaDoRelatorio
        hooks={hooks({
          data: undefined,
          isError: true,
          error: new Error('permission denied for table raw_consolidated_daily'),
        })}
        nomeDoRelatorio="relatório de clusters"
      />,
    );

    expect(screen.getByText(/permission denied/)).toBeInTheDocument();
  });

  it('o erro NÃO culpa a publicação da Edge Function', () => {
    // A prévia passou a ser montada no navegador e não depende de deploy
    // nenhum. Enquanto dependia, o cartão dizia "a função pode ainda não estar
    // publicada" — manter esse texto mandaria a pessoa publicar uma function
    // para consertar uma falha de leitura do banco de indicadores.
    render(
      <PreviaDoRelatorio
        hooks={hooks({ data: undefined, isError: true, error: new Error('falha de rede') })}
        nomeDoRelatorio="relatório de clusters"
      />,
    );

    expect(screen.queryByText(/publicada/)).toBeNull();
  });

  it('o botão de teste dispara o envio', async () => {
    render(<PreviaDoRelatorio hooks={hooks()} nomeDoRelatorio="relatório de clusters" />);

    await userEvent.click(screen.getByRole('button', { name: /Enviar teste para mim/ }));

    expect(enviarTeste).toHaveBeenCalledTimes(1);
  });

  it('sem prévia montada não há o que testar, então o botão não fica clicável', () => {
    // Se a function não respondeu, o teste também não vai funcionar — deixar o
    // botão ativo só produz um segundo erro dizendo a mesma coisa.
    render(
      <PreviaDoRelatorio
        hooks={hooks({ data: undefined, isError: true, error: new Error('Function not found') })}
        nomeDoRelatorio="relatório de clusters"
      />,
    );

    expect(screen.getByRole('button', { name: /Enviar teste para mim/ })).toBeDisabled();
  });
});
