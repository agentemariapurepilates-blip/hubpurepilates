// Quando um artigo aprovado vai ao ar no blog. Sem dependência do Deno, para
// ser testado.
//
// Regra (05/11/2026): no dia previsto do artigo, às 9h de Brasília. Se esse
// momento já passou (artigo aprovado atrasado), vai ao ar HOJE às 17h; se as
// 17h de hoje também já passaram, amanhã às 9h. Nunca agenda no passado: o
// WordPress publicaria na hora.
//
// O Brasil não tem horário de verão desde 2019, então Brasília é UTC-3 o ano
// inteiro: 9h em Brasília são 12h UTC.

const FUSO_BRASILIA_HORAS = -3
// Folga para o WordPress receber o post antes da hora marcada.
const FOLGA_MINUTOS = 10

const doisDigitos = (n: number) => String(n).padStart(2, '0')

/** '2026-11-05' em São Paulo, para um instante qualquer. */
const diaEmBrasilia = (instante: Date) => {
  const local = new Date(instante.getTime() + FUSO_BRASILIA_HORAS * 3_600_000)
  return `${local.getUTCFullYear()}-${doisDigitos(local.getUTCMonth() + 1)}-${doisDigitos(local.getUTCDate())}`
}

const somarDias = (dia: string, n: number) => {
  const [a, m, d] = dia.split('-').map(Number)
  const x = new Date(Date.UTC(a, m - 1, d + n))
  return `${x.getUTCFullYear()}-${doisDigitos(x.getUTCMonth() + 1)}-${doisDigitos(x.getUTCDate())}`
}

/** O instante (UTC) de um dia às `hora` de Brasília. */
const instanteDe = (dia: string, hora: string) => {
  const [a, m, d] = dia.split('-').map(Number)
  const [h, min] = hora.split(':').map(Number)
  return new Date(Date.UTC(a, m - 1, d, h - FUSO_BRASILIA_HORAS, min))
}

export interface MomentoDePublicacao {
  /** Para o campo date_gmt do WordPress: 'AAAA-MM-DDTHH:MM:SS', em UTC. */
  dataGmt: string
  /** O mesmo instante em ISO, para guardar no banco. */
  iso: string
  /** O dia em que vai ao ar, em Brasília. */
  dia: string
  /** true quando o dia previsto já tinha passado e o post foi para o dia seguinte. */
  adiado: boolean
}

export function quandoPublicar(
  dataPrevista: string | null,
  agora: Date = new Date(),
  hora = '09:00',
  horaDosAtrasados = '17:00',
): MomentoDePublicacao {
  const hoje = diaEmBrasilia(agora)
  const limite = agora.getTime() + FOLGA_MINUTOS * 60_000
  const montar = (dia: string, h: string, adiado: boolean): MomentoDePublicacao => {
    const instante = instanteDe(dia, h)
    return { dataGmt: instante.toISOString().slice(0, 19), iso: instante.toISOString(), dia, adiado }
  }

  // Sem dia previsto (artigo avulso): amanhã no horário normal.
  if (!dataPrevista) return montar(somarDias(hoje, 1), hora, false)
  if (instanteDe(dataPrevista, hora).getTime() > limite) return montar(dataPrevista, hora, false)
  // Atrasado: hoje à tarde, se ainda der tempo; senão, amanhã cedo.
  if (instanteDe(hoje, horaDosAtrasados).getTime() > limite) return montar(hoje, horaDosAtrasados, true)
  return montar(somarDias(hoje, 1), hora, true)
}
