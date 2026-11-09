import { INFLOW_KINDS, OUTFLOW_KINDS, sqlList } from '@/core/db/kinds';
import * as Crypto from 'expo-crypto';
import { type SQLiteDatabase } from 'expo-sqlite';
import type { Card, NewCard } from './types';

export function getCards(db: SQLiteDatabase) {
  return db.getAllAsync<Card>(`
    SELECT
      c.id, c.name, c.bank, c.last4, c.initial_balance_cents,
      c.initial_balance_cents + COALESCE(SUM(
        CASE
          WHEN t.kind IN (${sqlList(INFLOW_KINDS)}) THEN t.amount_cents
          WHEN t.kind IN (${sqlList(OUTFLOW_KINDS)}) THEN -t.amount_cents
        END
      ), 0) AS balance_cents
    FROM cards c
    LEFT JOIN transactions t ON t.card_id = c.id AND t.deleted_at IS NULL
    WHERE c.deleted_at IS NULL
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `);
}

export async function createCard(db: SQLiteDatabase, input: NewCard) {
  const id = Crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO cards (id, name, bank, last4, initial_balance_cents) VALUES (?, ?, ?, ?, ?)',
    [
      id,
      input.name.trim(),
      input.bank?.trim() || null,
      input.last4?.trim() || null,
      input.initialBalanceCents,
    ]
  );
  return id;
}