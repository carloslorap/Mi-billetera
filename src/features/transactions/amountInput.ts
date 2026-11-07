export function nextAmount(current: string, key: string): string {
  if (key === 'back') return current.slice(0, -1);
  if (key === 'clear') return '';

  if (key === '.') {
    if (current.includes('.')) return current;
    return current === '' ? '0.' : current + '.';
  }

  const [integer, decimals] = current.split('.');
  if (decimals !== undefined && decimals.length >= 2) return current;
  if (decimals === undefined && integer.length >= 7) return current;
  if (current === '0') return key; // evita "05"
  return current + key;
}