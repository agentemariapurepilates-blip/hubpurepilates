import { addDays } from 'date-fns';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

// Compartilhado entre a lista e o Kanban, que antes tinham cópias próprias.

export const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Média', color: 'bg-orange-100 text-orange-700' },
  high: { label: 'Alta', color: 'bg-red-100 text-red-700' },
};

/** "2026-02-06" vira a data local, sem o deslocamento de fuso de `new Date(str)`. */
export const parseDateOnly = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getBrazilDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

/**
 * Sinal de prazo da demanda. `pausado` vem do grupo em que ela está: grupos
 * como Concluído, Cancelado, Em Aprovação e Faltam Informações não acusam
 * atraso, porque a demanda não está nas mãos de quem executa.
 */
export const getDeadlineStatus = (deadline: string | null, pausado: boolean) => {
  if (!deadline || pausado) return null;

  const todayKey = getBrazilDateKey();
  const attentionLimitKey = getBrazilDateKey(addDays(new Date(), 2));

  if (deadline < todayKey) {
    return { label: 'Atrasada', color: 'bg-red-500 text-white', icon: AlertTriangle };
  }
  if (deadline <= attentionLimitKey) {
    return { label: 'Atenção', color: 'bg-yellow-500 text-white', icon: Clock };
  }
  return { label: 'No prazo', color: 'bg-green-500 text-white', icon: CheckCircle2 };
};

/**
 * Ordem de todas as listas e do Kanban: vence antes, aparece antes. Sem prazo
 * vai para o fim; no mesmo prazo, a mais recente primeiro (a ordem de antes).
 */
export const compararPorPrazo = (
  a: { deadline: string | null; created_at: string },
  b: { deadline: string | null; created_at: string },
) =>
  (a.deadline?.slice(0, 10) ?? '9999-12-31').localeCompare(b.deadline?.slice(0, 10) ?? '9999-12-31') ||
  b.created_at.localeCompare(a.created_at);
