const MAP: Record<string, string> = {
  á: 'a', à: 'a', ä: 'a', â: 'a',
  é: 'e', è: 'e', ë: 'e', ê: 'e',
  í: 'i', ì: 'i', ï: 'i', î: 'i',
  ó: 'o', ò: 'o', ö: 'o', ô: 'o',
  ú: 'u', ù: 'u', ü: 'u', û: 'u',
  ñ: 'n',
};

export function normalizeText(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\u0000-\u007f]/g, (c) => MAP[c] ?? c)
    .replace(/\s+/g, ' ');
}