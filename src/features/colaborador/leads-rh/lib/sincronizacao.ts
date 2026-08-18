/**
 * O estado da atualização automática dos leads.
 *
 * A tela precisa responder, sem ninguém precisar perguntar: de quanto em quanto
 * tempo isso atualiza, quando foi a última vez e quando é a próxima. Uma lista
 * de candidatos sem data é uma lista em que ninguém confia — e pior, uma em que
 * as pessoas confiam sem saber que está velha.
 */

/** 03:00 em São Paulo. O cron roda 06:00 UTC; ver a migration do agendamento. */
export const HORA_DA_CARGA = 3;

export type EstadoDaCarga = 'nunca-rodou' | 'em-dia' | 'atrasada' | 'previa';

export interface StatusDaSincronizacao {
  estado: EstadoDaCarga;
  /** Quando a carga rodou pela última vez. */
  ultima: Date | null;
  /** Quando ela deve rodar de novo. `null` quando o agendamento não existe. */
  proxima: Date | null;
  /** Horas desde a última carga. */
  horasDesde: number | null;
  /**
   * A carga passou do horário e não rodou.
   *
   * A tolerância é de 26 horas, e não 24: a carga leva alguns minutos e o
   * horário do cron oscila. Com 24 cravados, todo dia teria um período em que a
   * tela acusaria atraso sem haver nenhum.
   */
  atrasada: boolean;
}

const HORA = 60 * 60 * 1000;
const TOLERANCIA_EM_HORAS = 26;

/** A próxima 03:00 de São Paulo depois de `agora`. */
export function proximaCarga(agora: Date): Date {
  // O fuso de São Paulo é fixo em UTC−3 desde 2019 (sem horário de verão), o
  // que permite calcular sem depender do fuso da máquina de quem abre a tela —
  // um usuário em Portugal veria o horário errado se isto usasse o local.
  const emSaoPaulo = new Date(agora.getTime() - 3 * HORA);
  const alvo = new Date(
    Date.UTC(
      emSaoPaulo.getUTCFullYear(),
      emSaoPaulo.getUTCMonth(),
      emSaoPaulo.getUTCDate(),
      HORA_DA_CARGA,
    ),
  );
  if (alvo.getTime() <= emSaoPaulo.getTime()) alvo.setUTCDate(alvo.getUTCDate() + 1);
  return new Date(alvo.getTime() + 3 * HORA);
}

export function statusDaSincronizacao({
  ultimaSincronizacao,
  ehPrevia,
  agendada = false,
  agora = new Date(),
}: {
  /** ISO da última carga, ou `null` se nunca rodou. */
  ultimaSincronizacao: string | null;
  /** Os dados vieram do arquivo de prévia local. */
  ehPrevia: boolean;
  /** Existe agendamento — no Supabase, ou local nesta máquina. */
  agendada?: boolean;
  agora?: Date;
}): StatusDaSincronizacao {
  const ultima = ultimaSincronizacao ? new Date(ultimaSincronizacao) : null;
  const horasDesde =
    ultima && !Number.isNaN(ultima.getTime())
      ? (agora.getTime() - ultima.getTime()) / HORA
      : null;

  // Prévia é um retrato congelado: não há próxima carga, e chamar de "em dia"
  // seria mentira mesmo que a captura tenha sido há minutos.
  if (ehPrevia) {
    // A prévia continua sendo um retrato congelado, mas se há agendamento
    // (a tarefa diária local) existe SIM uma próxima carga — e escondê-la
    // faria a tela dizer que nada vai acontecer quando algo vai.
    return {
      estado: 'previa',
      ultima,
      proxima: agendada ? proximaCarga(agora) : null,
      horasDesde,
      atrasada: false,
    };
  }

  if (!ultima || Number.isNaN(ultima.getTime())) {
    return { estado: 'nunca-rodou', ultima: null, proxima: proximaCarga(agora), horasDesde: null, atrasada: false };
  }

  const atrasada = (horasDesde ?? 0) > TOLERANCIA_EM_HORAS;

  return {
    estado: atrasada ? 'atrasada' : 'em-dia',
    ultima,
    proxima: proximaCarga(agora),
    horasDesde,
    atrasada,
  };
}

/** "há 2 horas", "ontem", "há 3 dias" — o jeito que uma pessoa diria. */
export function tempoDecorrido(horas: number | null): string {
  if (horas === null) return '—';
  if (horas < 1) return 'há menos de uma hora';
  if (horas < 2) return 'há uma hora';
  if (horas < 24) return `há ${Math.floor(horas)} horas`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ontem';
  return `há ${dias} dias`;
}
