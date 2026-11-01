import { type SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

export async function migrateDb(db: SQLiteDatabase) {
  // Se activa en cada conexión
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE cards (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        bank TEXT,
        initial_balance_cents INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE transactions (
        id TEXT PRIMARY KEY NOT NULL,
        card_id TEXT NOT NULL REFERENCES cards(id),
        type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        description TEXT,
        category TEXT,
        occurred_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE loans (
        id TEXT PRIMARY KEY NOT NULL,
        person_name TEXT NOT NULL,
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        expected_return_date TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE loan_payments (
        id TEXT PRIMARY KEY NOT NULL,
        loan_id TEXT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        paid_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_transactions_card ON transactions(card_id);
      CREATE INDEX idx_transactions_date ON transactions(occurred_at);
      CREATE INDEX idx_loan_payments_loan ON loan_payments(loan_id);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}