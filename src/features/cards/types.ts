export type Card = {
  id: string;
  name: string;
  bank: string | null;
  last4: string | null;
  initial_balance_cents: number;
  balance_cents: number; // calculado: inicial + entradas - salidas
};

export type NewCard = {
  name: string;
  bank?: string;
  last4?: string;
  initialBalanceCents: number;
};