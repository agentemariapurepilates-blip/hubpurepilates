import { compararPorPrazo } from './demandHelpers';

/**
 * Ordem manual das tarefas dentro do grupo (pedido de 26/11/2026, setor
 * Gravações): arrastar uma tarefa para outra linha fixa a ordem, e ela vale
 * mais que o prazo ou a data de gravação. Tarefa que ninguém arrastou ainda
 * (position nulo) fica depois das ordenadas, pelo prazo, como antes.
 */
type Ordenavel = { position?: number | null; deadline: string | null; created_at: string };

export const compararPorOrdem = (a: Ordenavel, b: Ordenavel) => {
  const pa = a.position ?? null;
  const pb = b.position ?? null;
  if (pa !== null && pb !== null) return pa - pb || compararPorPrazo(a, b);
  if (pa !== null) return -1;
  if (pb !== null) return 1;
  return compararPorPrazo(a, b);
};

/**
 * A nova ordem do grupo de destino depois de soltar a tarefa.
 * `destino` = os ids do grupo na ordem em que aparecem (pode conter a tarefa,
 * se ela não mudou de grupo). `alvo` = a linha sobre a qual ela foi solta
 * (null = no fim do grupo); `depois` = soltou na metade de baixo da linha.
 */
export function novaOrdem(destino: string[], ativo: string, alvo: string | null, depois: boolean): string[] {
  const sem = destino.filter((id) => id !== ativo);
  if (alvo === null || alvo === ativo) {
    if (alvo === ativo) return destino;
    return [...sem, ativo];
  }
  const i = sem.indexOf(alvo);
  if (i === -1) return [...sem, ativo];
  const onde = depois ? i + 1 : i;
  return [...sem.slice(0, onde), ativo, ...sem.slice(onde)];
}
