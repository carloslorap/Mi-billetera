// SQLite guarda 'YYYY-MM-DD HH:MM:SS' (UTC, sin Z); Postgres devuelve microsegundos y +00:00
export function toIso(v: string | null | undefined): string | null {
  if (!v) return null;
  let s = String(v).trim();
  if (!s.includes('T')) s = s.replace(' ', 'T');
  if (!/(Z|[+-]\d\d:?\d\d)$/.test(s)) s += 'Z';
  s = s.replace(/(\.\d{3})\d+/, '$1');
  const d = new Date(s);
  return isNaN(d.getTime()) ? String(v) : d.toISOString();
}