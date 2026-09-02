import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviaDoRelatorio, type HooksDaPrevia } from './PreviaDoRelatorio';

// A prévia mostra o e-mail REAL, montado pela mesma Edge Function que faz o
// envio — não uma imitação em HTML do Hub. Isso traz dois riscos que estes
// testes seguram:
//
// 1. O corpo é HTML de e-mail, com <style> e <table> próprios. Solto na página
//    ele herdaria (e atropelaria) o estilo do Hub. Por isso vai num iframe.
// 2. As Edge Functions ainda não foram publicadas. O erro mais provável desta
//    tela é justamente esse, e "não deu certo" seco mandaria alguém procurar
//    defeito no lugar errado.

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

  it('no erro, diz a mensagem crua e lembra que a função pode não estar publicada', () => {
    render(
      <PreviaDoRelatorio
        hooks={hooks({
          data: undefined,
          isError: true,
          error: new Error('Function not found'),
        })}
        nomeDoRelatorio="relatório de clusters"
      />,
    );

    expect(screen.getByText(/Function not found/)).toBeInTheDocument();
    expect(screen.getByText(/ainda não estar publicada/)).toBeInTheDocument();
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
