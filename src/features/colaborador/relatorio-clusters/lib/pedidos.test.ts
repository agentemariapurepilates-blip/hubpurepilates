import { describe, it, expect, vi } from 'vitest';
import { pedirPrevia, pedirTeste, type Invocar } from './pedidos';

// A conversa com a Edge Function, sem react-query no meio.
//
// O erro que estes testes existem para pegar: `functions.invoke` NÃO lança
// quando a função responde 500 ou não existe — devolve `{ data: null, error }`.
// Quem esquecer de olhar o `error` entrega um sucesso com data vazia, e a tela
// mostra uma prévia em branco em vez do aviso de que a função não está
// publicada. Foi exatamente o cenário que motivou a prévia a existir.

/** Um invoke de mentira que devolve o que o teste mandar. */
function invocarQueDevolve(resposta: { data: unknown; error: unknown }): Invocar {
  return vi.fn().mockResolvedValue(resposta);
}

const EMAIL = { assunto: 'Clusters — julho de 2026', corpo: '<h1>oi</h1>' };

describe('pedirPrevia', () => {
  it('chama a função nomeada pedindo o modo prévia', async () => {
    const invocar = invocarQueDevolve({ data: EMAIL, error: null });

    await pedirPrevia(invocar, 'cluster-relatorio-mensal');

    expect(invocar).toHaveBeenCalledWith('cluster-relatorio-mensal', {
      body: { modo: 'previa' },
    });
  });

  it('devolve o assunto e o corpo montados', async () => {
    const previa = await pedirPrevia(invocarQueDevolve({ data: EMAIL, error: null }), 'f');

    expect(previa).toEqual(EMAIL);
  });

  it('erro da função vira exceção, e não sucesso vazio', async () => {
    const invocar = invocarQueDevolve({ data: null, error: new Error('Function not found') });

    await expect(pedirPrevia(invocar, 'f')).rejects.toThrow('Function not found');
  });

  it('resposta sem assunto ou corpo também é erro', async () => {
    // Acontece com uma versão antiga da função publicada: ela ignora o `modo`,
    // responde 200 com o resumo do envio e a tela mostraria um iframe vazio.
    const invocar = invocarQueDevolve({ data: { ok: true, destinatarios: 3 }, error: null });

    await expect(pedirPrevia(invocar, 'f')).rejects.toThrow(/não devolveu o e-mail/);
  });
});

describe('pedirTeste', () => {
  it('chama a função nomeada pedindo o modo teste', async () => {
    const invocar = invocarQueDevolve({ data: { ok: true }, error: null });

    await pedirTeste(invocar, 'experimentais-relatorio-mensal');

    expect(invocar).toHaveBeenCalledWith('experimentais-relatorio-mensal', {
      body: { modo: 'teste' },
    });
  });

  it('erro da função vira exceção', async () => {
    const invocar = invocarQueDevolve({ data: null, error: new Error('sem destinatario') });

    await expect(pedirTeste(invocar, 'f')).rejects.toThrow('sem destinatario');
  });

  it('nunca manda o modo cron — seria o envio para a lista inteira', async () => {
    const invocar = invocarQueDevolve({ data: { ok: true }, error: null });

    await pedirTeste(invocar, 'f');

    const corpo = (invocar as ReturnType<typeof vi.fn>).mock.calls[0][1].body;
    expect(corpo.modo).toBe('teste');
  });
});
