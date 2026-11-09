export type Person = {
  id: string;
  name: string;
  aliases: string | null;
};

// Una fila de la lista de Préstamos: todo lo que una persona te debe, ya sumado
export type PersonDebt = {
  person_id: string;
  name: string;
  loans_count: number;
  lent_cents: number; // total prestado
  paid_cents: number; // total cobrado
  remaining_cents: number; // lo que falta cobrar
  next_due: string | null; // vencimiento más cercano entre los préstamos con saldo
};

export type NewLoan = {
  person: { id: string; name: string } | { id: null; name: string }; // id null = persona nueva
  amountCents: number;
  cardId: string | null; // null = efectivo
  expectedReturnDate: string | null; // 'YYYY-MM-DD'
  notes?: string;
};

export type LoanWithPaid = {
  id: string;
  amount_cents: number;
  expected_return_date: string | null;
  notes: string | null;
  created_at: string;
  paid_cents: number;
};

export type PaymentRow = {
  id: string;
  loan_id: string;
  amount_cents: number;
  paid_at: string;
  card_name: string | null; // null = efectivo
};

export type PersonDetail = {
  person: { id: string; name: string };
  loans: LoanWithPaid[]; // del más antiguo al más reciente: el orden en que se aplican los pagos
  payments: PaymentRow[]; // del más reciente al más antiguo
};

export type NewPayment = {
  personId: string;
  amountCents: number;
  cardId: string | null; // null = efectivo
};