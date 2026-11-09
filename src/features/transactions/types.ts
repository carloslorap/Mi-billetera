import type { TransactionKind } from '@/core/db/kinds';

// Tipos que se registran a mano con el formulario de movimientos
export type TransactionType = Extract<TransactionKind, 'expense' | 'income'>;

export type Transaction = {
  id: string;
  card_id: string;
  card_name: string;
  kind: TransactionKind;
  amount_cents: number;
  description: string | null;
  category: string | null;
  occurred_at: string;
};

export type NewTransaction = {
  cardId: string;
  kind: TransactionType;
  amountCents: number;
  description?: string;
  category?: string;
};