import type { PreviaMontada } from '../PreviaDoRelatorio';

/**
 * A assinatura de `supabase.functions.invoke`, só com o que usamos.
 *
 * Entra por parâmetro, e não por import, para estas funções serem testáveis
 * sem subir um cliente Supabase — ver pedidos.test.ts.
 */
export type Invocar = (
  funcao: string,
  opcoes: { body: unknown },
) => Promise<{ data: unknown; error: unknown }>;

/**
 * `functions.invoke` não lança: função ausente, 500 ou rede caída chegam como
 * `{ data: null, error }`. Sem esta conversão, o react-query trataria a falha
 * como sucesso e a tela mostraria uma prévia em branco em vez do aviso.
 */
function estourarSeDeuErro(error: unknown): void {
  if (!error) return;
  throw error instanceof Error ? error : new Error(String(error));
}

/** O e-mail montado, sem enviar nada. */
export async function pedirPrevia(invocar: Invocar, funcao: string): Promise<PreviaMontada> {
  const { data, error } = await invocar(funcao, { body: { modo: 'previa' } });
  estourarSeDeuErro(error);

  const corpo = data as Partial<PreviaMontada> | null;
  // Uma versão antiga da função, publicada antes do modo prévia existir,
  // responde 200 com o resumo do envio. Aceitar isso mostraria um iframe vazio
  // sem dizer que a função precisa ser republicada.
  if (!corpo || typeof corpo.assunto !== 'string' || typeof corpo.corpo !== 'string') {
    throw new Error(
      `A função ${funcao} respondeu, mas não devolveu o e-mail montado. ` +
        'Provavelmente está publicada numa versão anterior ao modo prévia.',
    );
  }

  return { assunto: corpo.assunto, corpo: corpo.corpo };
}

/** Envia o relatório só para o admin logado, nunca para a lista. */
export async function pedirTeste(invocar: Invocar, funcao: string): Promise<void> {
  const { error } = await invocar(funcao, { body: { modo: 'teste' } });
  estourarSeDeuErro(error);
}
