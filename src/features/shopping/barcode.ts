// UPC-A (12 dígitos) se guarda como EAN-13 con un 0 delante.
export function normalizeBarcode(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12) return '0' + digits;
  if (digits.length === 13 || digits.length === 8) return digits;
  return null;
}

export function parsePriceToCents(text: string): number | null {
  const n = Number(text.replace(',', '.').trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export const fmtSoles = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;