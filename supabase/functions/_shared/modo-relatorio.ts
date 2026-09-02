// Quem pode pedir o quê nas Edge Functions de relatório mensal.
//
// Três chamadores, poderes diferentes:
//   cron   — o pg_cron, com o segredo. Monta e envia para a lista inteira.
//   previa — o admin logado no Hub. Monta e devolve o HTML, sem enviar nada.
//   teste  — o admin logado no Hub. Envia só para o e-mail dele.
//
// A decisão vive aqui, fora do `Deno.serve`, para poder ser testada: importar
// o index.ts já subiria um servidor. Ver modo-relatorio.test.ts.

export type Modo = 'cron' | 'previa' | 'teste';

const MODOS_PEDIDOS: readonly string[] = ['previa', 'teste'];

/**
 * O modo pedido no corpo da requisição.
 *
 * Corpo ausente, ou sem a chave `modo`, é o cron: é assim que o pg_cron chama,
 * e mudar isso quebraria o disparo automático. Um `modo` que existe mas não é
 * conhecido devolve `null` para a function responder 400 — cair no cron por
 * engano mandaria o relatório para a lista inteira.
 */
export function modoDaRequisicao(corpo: unknown): Modo | null {
  if (corpo === null || corpo === undefined) return 'cron';
  if (typeof corpo !== 'object') return null;

  const pedido = (corpo as Record<string, unknown>).modo;
  if (pedido === undefined) return 'cron';
  if (typeof pedido !== 'string') return null;

  return MODOS_PEDIDOS.includes(pedido) ? (pedido as Modo) : null;
}

/** Prévia e teste partem do navegador, então exigem um admin logado. */
export function exigeAdmin(modo: Modo): boolean {
  return modo !== 'cron';
}

/**
 * Se o cabeçalho traz o segredo do cron.
 *
 * Segredo vazio nunca autoriza: sem essa guarda, uma function com a variável
 * de ambiente faltando aceitaria `Bearer ` de qualquer um.
 */
export function ehSegredoDoCron(authorization: string | null, segredo: string): boolean {
  if (!segredo) return false;
  return authorization === `Bearer ${segredo}`;
}

/**
 * Para quem o e-mail vai, em cada modo.
 *
 * O caso perigoso é o `teste`: ele existe para o admin ver o e-mail chegar na
 * caixa dele, e um engano aqui dispararia o relatório do mês para a rede
 * inteira. Por isso a lista do banco só é usada no modo cron, e um teste sem
 * e-mail de admin não envia nada em vez de recorrer a ela.
 */
export function destinatariosDoModo(
  modo: Modo,
  fontes: { lista: string[]; emailDoAdmin: string | null },
): string[] {
  if (modo === 'cron') return fontes.lista;
  if (modo === 'teste') return fontes.emailDoAdmin ? [fontes.emailDoAdmin] : [];
  return [];
}
