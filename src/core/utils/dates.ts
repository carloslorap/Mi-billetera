// SQLite guarda created_at como 'YYYY-MM-DD HH:MM:SS' en UTC, sin zona.
// Los pagos y movimientos que escribe la app llevan ISO con 'Z'.
export function parseDbDate(value: string): Date {
  if (value.includes('T')) return new Date(value);
  return new Date(value.replace(' ', 'T') + 'Z');
}

export function formatShortDate(value: string): string {
  return parseDbDate(value).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}