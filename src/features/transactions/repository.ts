import * as Crypto from 'expo-crypto';
import { type SQLiteDatabase } from 'expo-sqlite';
import type { NewTransaction, Transaction } from './types';

export async function createTransaction(db: SQLiteDatabase, input: NewTransaction) {
  const id = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO transactions
       (id, card_id, kind, amount_cents, description, category, occurred_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.cardId,
      input.kind,
      input.amountCents,
      input.description?.trim() || null,
      input.category ?? null,
      new Date().toISOString(),
    ]
  );
  return id;
}

export function getRecentTransactions(db: SQLiteDatabase, limit = 20) {
  return db.getAllAsync<Transaction>(
    `SELECT t.id, t.card_id, c.name AS card_name, t.kind, t.amount_cents,
            t.description, t.category, t.occurred_at
     FROM transactions t
     JOIN cards c ON c.id = t.card_id
     WHERE t.deleted_at IS NULL
     ORDER BY t.occurred_at DESC
     LIMIT ?`,
    [limit]
  );
}


export function getCardTransactions(db: SQLiteDatabase, cardId: string, limit = 300) {
  return db.getAllAsync<Transaction>(
    `SELECT t.id, t.card_id, c.name AS card_name, t.kind, t.amount_cents,
            t.description, t.category, t.occurred_at
     FROM transactions t
     JOIN cards c ON c.id = t.card_id
     WHERE t.card_id = ? AND t.deleted_at IS NULL
     ORDER BY t.occurred_at DESC
     LIMIT ?`,
    [cardId, limit]
  );
}


// Solo gastos e ingresos sueltos; los de préstamos se eliminan desde la persona.
export async function deleteTransaction(db: SQLiteDatabase, id: string) {
  const now = new Date().toISOString();
  const r = await db.runAsync(
    `UPDATE transactions SET deleted_at = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL AND kind IN ('expense', 'income')`,
    [now, now, id]
  );
  return r.changes > 0;
}