export type CardTheme = {
  gradient: readonly [string, string, string];
  glow: string; // color del resplandor bajo la tarjeta
};

const THEMES = {
  bcp: { gradient: ['#1F78E0', '#0B4399', '#0A2B66'], glow: 'rgba(31,120,224,0.40)' },
  bbva: { gradient: ['#1A73B8', '#0B3F7A', '#072146'], glow: 'rgba(26,115,184,0.40)' },
  interbank: { gradient: ['#3CC25C', '#1A8A3A', '#0D5A25'], glow: 'rgba(60,194,92,0.38)' },
  scotiabank: { gradient: ['#F0343B', '#B30F16', '#7A0A10'], glow: 'rgba(240,52,59,0.38)' },
  default: { gradient: ['#3F4642', '#2A2E2E', '#1C1F1E'], glow: 'rgba(149,255,119,0.25)' },
} as const satisfies Record<string, CardTheme>;

// Elige el estilo según lo que escribiste en "Banco" o en el nombre de la tarjeta
export function getCardTheme(bank?: string | null, name?: string): CardTheme {
  const text = `${bank ?? ''} ${name ?? ''}`.toLowerCase();
  if (text.includes('bcp') || text.includes('banco de cr')) return THEMES.bcp;
  if (text.includes('bbva') || text.includes('continental')) return THEMES.bbva;
  if (text.includes('interbank') || text.includes('ibk')) return THEMES.interbank;
  if (text.includes('scotia')) return THEMES.scotiabank;
  return THEMES.default;
}   