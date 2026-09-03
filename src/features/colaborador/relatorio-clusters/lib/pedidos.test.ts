import { describe, it, expect, vi } from 'vitest';
import { pedirTeste, type Invocar } from './pedidos';

// A conversa com a Edge Function, sem react-query no meio. Sobrou só o ENVIO
// DE TESTE: a prévia deixou de passar por aqui quando foi montada no navegador.
//
// O erro que estes testes existem para pegar: `functions.invoke` NÃO lança
// quando a função responde 500 ou não existe — devolve `{ data: null, error }`.
// Quem esquecer de olhar o `error` entrega um sucesso silencioso, e a tela diz
// "Teste enviado" para um e-mail que nunca saiu. Como as functions ainda não
// foram publicadas, esse é hoje o caminho MAIS provável desta chamada.

/** Um invoke de mentira que devolve o que o teste mandar. */
function invocarQueDevolve(resposta: { data: unknown; error: unknown }): Invocar {
  return vi.fn().mockResolvedValue(resposta);
}

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
