// Regras de data das solicitações de inauguração.
//
// A inauguração é uma data (sem hora), então qualquer regra de prazo precisa de
// uma âncora para virar um instante: consideramos que o dia começa às 00:00 em
// São Paulo. O Brasil não tem horário de verão desde 2019, então o deslocamento
// é fixo em -03:00 e a conta dá o mesmo resultado em qualquer máquina.
//
// AS MESMAS regras estão na RLS da tabela (ver a migration). O banco é a
// autoridade; isto aqui existe para a tela poder explicar antes de o usuário
// tentar, e para os botões sumirem em vez de darem erro.

const FUSO_SAO_PAULO = '-03:00';

/**
 * Instante a partir do qual a solicitação trava para o colaborador: a
 * meia-noite que inicia o dia da inauguração, em São Paulo.
 *
 * Na prática, o colaborador pode alterar até as 23:59 do dia anterior. Antes
 * esta regra era "48 horas antes"; mudou a pedido do usuário em 04/08/2026,
 * porque travar dois dias antes impedia ajustes de véspera que não atrapalham
 * ninguém — o aviso ao marketing só sai às 03:00 do próprio dia, então
 * qualquer edição feita até a meia-noite ainda chega a tempo.
 */
export function prazoDeAlteracao(dataInauguracao: string): Date {
  return new Date(`${dataInauguracao}T00:00:00${FUSO_SAO_PAULO}`);
}

/** Se o colaborador ainda pode editar ou excluir. Admin não passa por aqui. */
export function podeAlterar(dataInauguracao: string, agora: Date = new Date()): boolean {
  return agora.getTime() < prazoDeAlteracao(dataInauguracao).getTime();
}

/**
 * A data de hoje em São Paulo, no formato YYYY-MM-DD — o mesmo da coluna
 * `date` do Postgres.
 *
 * Usa Intl em vez de getFullYear()/getMonth() porque estes leem o relógio da
 * máquina: num navegador configurado em outro fuso, "hoje" sairia trocado e o
 * usuário veria o calendário liberar ou bloquear o dia errado.
 */
export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora);
}

/**
 * Se a data pode ser escolhida ao criar ou editar uma solicitação.
 *
 * Precisa ser posterior a hoje: não se agenda uma inauguração para o mesmo dia
 * em que a solicitação é feita. O motivo é o aviso automático — ele sai às
 * 03:00 do dia da inauguração, então uma solicitação criada hoje para hoje
 * nasceria com o horário de envio já vencido e o marketing nunca seria avisado.
 */
export function podeAgendarPara(dataInauguracao: string, agora: Date = new Date()): boolean {
  return dataInauguracao > hojeEmSaoPaulo(agora);
}

/** Primeira data selecionável no calendário: amanhã em São Paulo. */
export function primeiraDataAgendavel(agora: Date = new Date()): string {
  const hoje = hojeEmSaoPaulo(agora);
  const amanha = new Date(`${hoje}T00:00:00${FUSO_SAO_PAULO}`);
  amanha.setUTCDate(amanha.getUTCDate() + 1);
  return hojeEmSaoPaulo(amanha);
}
