export type Card = {
  id: string;
  name: string;
  bank: string | null;
  initial_balance_cents: number;
  balance_cents: number; // calculado: inicial + ingresos - gastos
};

export type NewCard = {
  name: string;
  bank?: string;
  initialBalanceCents: number;
};