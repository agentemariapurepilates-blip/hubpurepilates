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

/** Envia o relatório só para o admin logado, nunca para a lista. */
export async function pedirTeste(invocar: Invocar, funcao: string): Promise<void> {
  const { error } = await invocar(funcao, { body: { modo: 'teste' } });
  estourarSeDeuErro(error);
}
