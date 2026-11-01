// Guardamos céntimos (enteros) para evitar errores de decimales
export const toCents = (soles: number) => Math.round(soles * 100);

export const formatSoles = (cents: number) =>
  `S/ ${(cents / 100).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;