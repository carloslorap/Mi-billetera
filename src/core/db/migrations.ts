import { type SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 5;

export async function migrateDb(db: SQLiteDatabase) {
  // Se activa en cada conexión
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  console.log('[migración] versión al abrir:', version, '| objetivo:', DATABASE_VERSION);
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
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
    await db.execAsync('PRAGMA user_version = 1');
    version = 1;
  }

  if (version === 1) {
    await migrateToV2(db);
    await db.execAsync('PRAGMA user_version = 2');
    version = 2;
  }

  if (version === 2) {
    await migrateToV3(db);
    await db.execAsync('PRAGMA user_version = 3');
    version = 3;
  }

  if (version === 3) {
    await migrateToV4(db);
    await db.execAsync('PRAGMA user_version = 4');
    version = 4;
  }

  if (version === 4) {
    await migrateToV5(db);
    await db.execAsync('PRAGMA user_version = 5');
    version = 5;
  }
}

async function migrateToV2(db: SQLiteDatabase) {
  // Para reconstruir tablas, SQLite pide apagar las llaves foráneas (fuera de la transacción)
  await db.execAsync('PRAGMA foreign_keys = OFF;');
  try {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        -- Préstamos: estaban vacíos (ninguna pantalla escribía en ellos), se recrean
        DROP TABLE IF EXISTS loan_payments;
        DROP TABLE IF EXISTS loans;

        CREATE TABLE people (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          aliases TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          deleted_at TEXT
        );

        CREATE TABLE loans (
          id TEXT PRIMARY KEY NOT NULL,
          direction TEXT NOT NULL CHECK (direction IN ('lent', 'borrowed')),
          person_id TEXT NOT NULL REFERENCES people(id),
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          expected_return_date TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          deleted_at TEXT
        );

        CREATE TABLE loan_payments (
          id TEXT PRIMARY KEY NOT NULL,
          loan_id TEXT NOT NULL REFERENCES loans(id),
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          paid_at TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          deleted_at TEXT
        );

        -- Movimientos: type pasa a kind, con seis valores y enlaces a préstamos o pagos.
        -- El CHECK final obliga a que cada tipo lleve el enlace que le corresponde.
        CREATE TABLE transactions_v2 (
          id TEXT PRIMARY KEY NOT NULL,
          card_id TEXT NOT NULL REFERENCES cards(id),
          kind TEXT NOT NULL CHECK (kind IN (
            'expense', 'income', 'loan_given', 'loan_collected', 'loan_received', 'debt_paid'
          )),
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          description TEXT,
          category TEXT,
          occurred_at TEXT NOT NULL,
          loan_id TEXT REFERENCES loans(id),
          loan_payment_id TEXT REFERENCES loan_payments(id),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          deleted_at TEXT,
          CHECK (
            (kind IN ('loan_given', 'loan_received') AND loan_id IS NOT NULL AND loan_payment_id IS NULL)
            OR (kind IN ('loan_collected', 'debt_paid') AND loan_payment_id IS NOT NULL AND loan_id IS NULL)
            OR (kind IN ('expense', 'income') AND loan_id IS NULL AND loan_payment_id IS NULL)
          )
        );

        INSERT INTO transactions_v2
          (id, card_id, kind, amount_cents, description, category, occurred_at, created_at, updated_at)
        SELECT
          id, card_id, type, amount_cents, description, category, occurred_at, created_at, updated_at
        FROM transactions;

        DROP TABLE transactions;
        ALTER TABLE transactions_v2 RENAME TO transactions;

        -- Tarjetas: últimos 4 dígitos y borrado suave
        ALTER TABLE cards ADD COLUMN last4 TEXT;
        ALTER TABLE cards ADD COLUMN deleted_at TEXT;

        CREATE INDEX idx_transactions_card ON transactions(card_id);
        CREATE INDEX idx_transactions_date ON transactions(occurred_at);
        CREATE INDEX idx_transactions_loan ON transactions(loan_id);
        CREATE INDEX idx_transactions_payment ON transactions(loan_payment_id);
        CREATE INDEX idx_loans_person ON loans(person_id);
        CREATE INDEX idx_loan_payments_loan ON loan_payments(loan_id);
      `);
    });
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }
}

async function migrateToV3(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE products (
      id TEXT PRIMARY KEY NOT NULL,
      barcode TEXT NOT NULL UNIQUE,
      name TEXT,
      price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
      price_updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE shopping_trips (
      id TEXT PRIMARY KEY NOT NULL,
      store TEXT,
      budget_cents INTEGER CHECK (budget_cents IS NULL OR budget_cents > 0),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done')),
      transaction_id TEXT REFERENCES transactions(id),
      created_at TEXT NOT NULL,
      closed_at TEXT,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE shopping_items (
      id TEXT PRIMARY KEY NOT NULL,
      trip_id TEXT NOT NULL REFERENCES shopping_trips(id),
      product_id TEXT REFERENCES products(id),
      name TEXT NOT NULL,
      unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
      quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE INDEX idx_items_trip ON shopping_items(trip_id);
    CREATE INDEX idx_trips_status ON shopping_trips(status);
  `);
}

async function migrateToV4(db: SQLiteDatabase) {
  await db.execAsync('ALTER TABLE people ADD COLUMN avatar TEXT');
}


const SYNC_TABLES = ['cards','people','loans','loan_payments',
  'transactions','products','shopping_trips','shopping_items'];

async function migrateToV5(db: SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);
    for (const t of SYNC_TABLES) {
      await db.execAsync(`
        ALTER TABLE ${t} ADD COLUMN dirty INTEGER NOT NULL DEFAULT 0;
        UPDATE ${t} SET dirty = 1;

        CREATE TRIGGER ${t}_mark_dirty_ins AFTER INSERT ON ${t}
        WHEN NEW.dirty = 0
        BEGIN
          UPDATE ${t} SET dirty = 1,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
          WHERE id = NEW.id;
        END;

        CREATE TRIGGER ${t}_mark_dirty AFTER UPDATE ON ${t}
        WHEN NEW.dirty = OLD.dirty
        BEGIN
          UPDATE ${t} SET dirty = 1,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
          WHERE id = NEW.id;
        END;
      `);
    }
    await db.execAsync('PRAGMA user_version = 5;');
  });
}