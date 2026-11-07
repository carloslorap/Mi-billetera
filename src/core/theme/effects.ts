// Luz desde arriba: verde muy tenue que se desvanece hacia el fondo
export const topLight = [
  'rgba(149,255,119,0.18)',
  'rgba(149,255,119,0.05)',
  'rgba(149,255,119,0)',
] as const;
export const topLightLocations = [0, 0.45, 1] as const;

// Sombra en la parte baja para dar profundidad bajo el botón
export const bottomShade = ['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)'] as const;

// Relleno con volumen: más claro arriba, más oscuro abajo
export const greenGradient = ['#B4FF9C', '#7FEF5F'] as const;
export const metalGradient = ['#3A403D', '#222625'] as const;
export const dangerGradient = ['#FF8F8F', '#FF5A5A'] as const;

// Resplandores (boxShadow)
export const glow = {
  halo: [
    { offsetX: 0, offsetY: 0, blurRadius: 48, spreadDistance: 6, color: 'rgba(149,255,119,0.30)' },
  ],
  button: [
    { offsetX: 0, offsetY: 6, blurRadius: 22, spreadDistance: 0, color: 'rgba(149,255,119,0.38)' },
  ],
  badge: [
    { offsetX: 0, offsetY: 0, blurRadius: 14, spreadDistance: 1, color: 'rgba(149,255,119,0.55)' },
  ],
  danger: [
    { offsetX: 0, offsetY: 6, blurRadius: 22, spreadDistance: 0, color: 'rgba(255,107,107,0.35)' },
  ],
  depth: [
    { offsetX: 0, offsetY: 4, blurRadius: 14, spreadDistance: 0, color: 'rgba(0,0,0,0.45)' },
  ],
};