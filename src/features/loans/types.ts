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