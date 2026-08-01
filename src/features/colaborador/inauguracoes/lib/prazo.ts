// Regra de alteração das solicitações de inauguração.
//
// A inauguração é uma data (sem hora), então o prazo precisa de uma âncora para
// virar um instante: consideramos que ela começa às 00:00 em São Paulo. O Brasil
// não tem horário de verão desde 2019, então o deslocamento é fixo em -03:00 e a
// conta dá o mesmo resultado em qualquer máquina.
//
// A MESMA regra está na RLS da tabela (ver a migration). O banco é a autoridade;
// isto aqui existe para a tela poder explicar antes de o usuário tentar.

export const HORAS_DE_ANTECEDENCIA = 48;

const FUSO_SAO_PAULO = '-03:00';

/** Instante a partir do qual a solicitação trava para o colaborador. */
export function prazoDeAlteracao(dataInauguracao: string): Date {
  const inicio = new Date(`${dataInauguracao}T00:00:00${FUSO_SAO_PAULO}`);
  return new Date(inicio.getTime() - HORAS_DE_ANTECEDENCIA * 60 * 60 * 1000);
}

/** Se o colaborador ainda pode editar ou excluir. Admin não passa por aqui. */
export function podeAlterar(dataInauguracao: string, agora: Date = new Date()): boolean {
  return agora.getTime() < prazoDeAlteracao(dataInauguracao).getTime();
}
