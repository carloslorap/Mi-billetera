import * as Crypto from 'expo-crypto';
import { type SQLiteDatabase } from 'expo-sqlite';
import type { NewTransaction, Transaction } from './types';

export async function createTransaction(db: SQLiteDatabase, input: NewTransaction) {
  const id = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO transactions
       (id, card_id, type, amount_cents, description, category, occurred_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.cardId,
      input.type,
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
    `SELECT t.id, t.card_id, c.name AS card_name, t.type, t.amount_cents,
            t.description, t.category, t.occurred_at
     FROM transactions t
     JOIN cards c ON c.id = t.card_id
     ORDER BY t.occurred_at DESC
     LIMIT ?`,
    [limit]
  );
}