import { differenceInCalendarDays, parseISO } from 'date-fns';

export type DueTone = 'neutral' | 'warning' | 'danger';

export function dueInfo(dateIso: string | null): { text: string; tone: DueTone } {
  if (!dateIso) return { text: 'sin fecha', tone: 'neutral' };

  const date = parseISO(dateIso);
  const days = differenceInCalendarDays(date, new Date());

  if (days < 0) {
    const n = -days;
    return { text: `vencido hace ${n} ${n === 1 ? 'día' : 'días'}`, tone: 'danger' };
  }
  if (days === 0) return { text: 'vence hoy', tone: 'warning' };
  if (days <= 7) {
    return { text: `vence en ${days} ${days === 1 ? 'día' : 'días'}`, tone: 'warning' };
  }
  return {
    text: `vence ${date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}`,
    tone: 'neutral',
  };
}