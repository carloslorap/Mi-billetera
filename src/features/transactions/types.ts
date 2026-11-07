export type TransactionType = 'expense' | 'income';

export type Transaction = {
  id: string;
  card_id: string;
  card_name: string;
  type: TransactionType;
  amount_cents: number;
  description: string | null;
  category: string | null;
  occurred_at: string;
};

export type NewTransaction = {
  cardId: string;
  type: TransactionType;
  amountCents: number;
  description?: string;
  category?: string;
};