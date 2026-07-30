import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface MonthOption {
  /** yyyy-MM */
  value: string;
  /** ex.: "março de 2026" */
  label: string;
}

/**
 * Os `count` meses mais recentes, do atual para trás.
 */
export function getRecentMonths(count = 12): MonthOption[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    // Dia 1 evita o salto de mês em datas como 31 de março menos 1 mês.
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
    };
  });
}

/**
 * Todos os meses entre `from` e `to`, inclusive, em ordem cronológica.
 * Se `from` for posterior a `to`, retorna apenas `from`.
 */
export function monthsBetween(from: string, to: string): string[] {
  if (from > to) return [from];

  const [fromYear, fromMonth] = from.split('-').map(Number);
  const [toYear, toMonth] = to.split('-').map(Number);

  const months: string[] = [];
  let year = fromYear;
  let month = fromMonth;

  while (year < toYear || (year === toYear && month <= toMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

/** Primeiro dia do mês, em yyyy-MM-dd. */
export function firstDayOfMonth(month: string): string {
  return `${month}-01`;
}

/** Último dia do mês, em yyyy-MM-dd. */
export function lastDayOfMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  // Dia 0 do mês seguinte é o último dia deste mês.
  const date = new Date(year, monthNumber, 0);
  return format(date, 'yyyy-MM-dd');
}

/** "2026-03" -> "mar/26"; usado como rótulo curto no eixo dos gráficos. */
export function shortMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const label = format(new Date(year, monthNumber - 1, 1), 'MMM', { locale: ptBR });
  return `${label}/${String(year).slice(-2)}`;
}

/** "2026-03-09" -> "09/03"; usado como rótulo curto no eixo dos gráficos. */
export function shortDayLabel(date: string): string {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

