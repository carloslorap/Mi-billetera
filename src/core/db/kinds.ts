export const TRANSACTION_KINDS = [
  'expense',
  'income',
  'loan_given',
  'loan_collected',
  'loan_received',
  'debt_paid',
] as const;

export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

// Tipos que suben o bajan el saldo de la tarjeta
export const INFLOW_KINDS = ['income', 'loan_collected', 'loan_received'] as const satisfies readonly TransactionKind[];
export const OUTFLOW_KINDS = ['expense', 'loan_given', 'debt_paid'] as const satisfies readonly TransactionKind[];

// Para armar consultas SQL. Son constantes del código, nunca texto del usuario.
export const sqlList = (kinds: readonly string[]) => kinds.map((k) => `'${k}'`).join(', ');