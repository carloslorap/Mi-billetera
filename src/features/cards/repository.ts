import * as Crypto from 'expo-crypto';
import { type SQLiteDatabase } from 'expo-sqlite';
import type { Card, NewCard } from './types';

export function getCards(db: SQLiteDatabase) {
  return db.getAllAsync<Card>(`
    SELECT
      c.id, c.name, c.bank, c.initial_balance_cents,
      c.initial_balance_cents + COALESCE(SUM(
        CASE t.type
          WHEN 'income' THEN t.amount_cents
          WHEN 'expense' THEN -t.amount_cents
        END
      ), 0) AS balance_cents
    FROM cards c
    LEFT JOIN transactions t ON t.card_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `);
}

export async function createCard(db: SQLiteDatabase, input: NewCard) {
  const id = Crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO cards (id, name, bank, initial_balance_cents) VALUES (?, ?, ?, ?)',
    [id, input.name.trim(), input.bank?.trim() || null, input.initialBalanceCents]
  );
  return id;
}