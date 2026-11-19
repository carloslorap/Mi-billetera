import { formatSoles } from '@/core/utils/money';
import { normalizeText } from '@/core/utils/text';
import * as Crypto from 'expo-crypto';
import { type SQLiteDatabase } from 'expo-sqlite';
import { allocateOldestFirst } from './allocate';
import { DIRECTION, type LoanDirection } from './direction';
import type {
  LoanWithPaid,
  NewLoan,
  NewPayment,
  PaymentRow,
  Person,
  PersonDebt,
  PersonDetail,
} from './types';

export function getPeople(db: SQLiteDatabase) {
  return db.getAllAsync<Person>(
    'SELECT id, name, aliases, avatar FROM people WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE'
  );
}

// Lo que cada persona te debe (lent) o lo que le debes (borrowed). Se calcula, no se guarda.
export function getPersonDebts(db: SQLiteDatabase, direction: LoanDirection) {
  return db.getAllAsync<PersonDebt>(
    `WITH loan_totals AS (
       SELECT
         l.id, l.person_id, l.amount_cents, l.expected_return_date,
         COALESCE((
           SELECT SUM(p.amount_cents) FROM loan_payments p
           WHERE p.loan_id = l.id AND p.deleted_at IS NULL
         ), 0) AS paid_cents
       FROM loans l
       WHERE l.direction = ? AND l.deleted_at IS NULL
     )
     SELECT
       pe.id AS person_id,
       pe.avatar AS avatar,
       pe.name AS name,
       COUNT(lt.id) AS loans_count,
       SUM(lt.amount_cents) AS lent_cents,
       SUM(lt.paid_cents) AS paid_cents,
       SUM(lt.amount_cents - lt.paid_cents) AS remaining_cents,
       MIN(CASE WHEN lt.amount_cents > lt.paid_cents THEN lt.expected_return_date END) AS next_due
     FROM people pe
     JOIN loan_totals lt ON lt.person_id = pe.id
     WHERE pe.deleted_at IS NULL
     GROUP BY pe.id
     ORDER BY
       (SUM(lt.amount_cents - lt.paid_cents) = 0),
       next_due IS NULL,
       next_due,
       pe.name COLLATE NOCASE`,
    [direction]
  );
}

// Crea la persona (si es nueva), el préstamo o deuda y, si hubo tarjeta, su movimiento.
// Todo dentro de una transacción: o se guarda completo o no se guarda nada.
export async function createLoan(db: SQLiteDatabase, input: NewLoan) {
  const loanId = Crypto.randomUUID();
  const cfg = DIRECTION[input.direction];

  await db.withTransactionAsync(async () => {
    let personId = input.person.id;

    if (!personId) {
      // Si el nombre ya existe (sin importar mayúsculas ni tildes), se reutiliza esa persona
      const existing = await db.getAllAsync<{ id: string; name: string }>(
        'SELECT id, name FROM people WHERE deleted_at IS NULL'
      );
      const target = normalizeText(input.person.name);
      personId = existing.find((p) => normalizeText(p.name) === target)?.id ?? null;
    }

    if (!personId) {
      personId = Crypto.randomUUID();
      await db.runAsync('INSERT INTO people (id, name,avatar) VALUES (?, ?, ?)', [
        personId,
        input.person.name.trim(),
        'avatar' in input.person ? input.person.avatar ?? null : null,
      ]);
    }

    await db.runAsync(
      `INSERT INTO loans (id, direction, person_id, amount_cents, expected_return_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        loanId,
        input.direction,
        personId,
        input.amountCents,
        input.expectedReturnDate,
        input.notes?.trim() || null,
      ]
    );

    if (input.cardId) {
      await db.runAsync(
        `INSERT INTO transactions
           (id, card_id, kind, amount_cents, description, occurred_at, loan_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          Crypto.randomUUID(),
          input.cardId,
          cfg.createKind,
          input.amountCents,
          cfg.createDescription(input.person.name.trim()),
          new Date().toISOString(),
          loanId,
        ]
      );
    }
  });

  return loanId;
}

export async function setPersonAvatar(db: SQLiteDatabase, personId: string, avatar: string | null) {
  await db.runAsync('UPDATE people SET avatar = ?, updated_at = ? WHERE id = ?', [
    avatar,
    new Date().toISOString(),
    personId,
  ]);
}

function paymentError(message: string) {
  const e = new Error(message) as Error & { paymentError?: boolean };
  e.paymentError = true;
  return e;
}

// Distingue los avisos pensados para el usuario ("solo debe S/ 30") de los fallos técnicos
export function isPaymentError(e: unknown): e is Error {
  return e instanceof Error && (e as Error & { paymentError?: boolean }).paymentError === true;
}

export async function getPersonDetail(
  db: SQLiteDatabase,
  personId: string,
  direction: LoanDirection
): Promise<PersonDetail | null> {
  const person = await db.getFirstAsync<{ id: string; name: string }>(
    'SELECT id, name FROM people WHERE id = ? AND deleted_at IS NULL',
    [personId]
  );
  if (!person) return null;

  const loans = await db.getAllAsync<LoanWithPaid>(
    `SELECT l.id, l.amount_cents, l.expected_return_date, l.notes, l.created_at,
            COALESCE(SUM(p.amount_cents), 0) AS paid_cents
     FROM loans l
     LEFT JOIN loan_payments p ON p.loan_id = l.id AND p.deleted_at IS NULL
     WHERE l.person_id = ? AND l.direction = ? AND l.deleted_at IS NULL
     GROUP BY l.id
     ORDER BY l.created_at ASC, l.rowid ASC`,
    [personId, direction]
  );

  const payments = await db.getAllAsync<PaymentRow>(
    `SELECT p.id, p.loan_id, p.amount_cents, p.paid_at, c.name AS card_name
     FROM loan_payments p
     JOIN loans l ON l.id = p.loan_id
     LEFT JOIN transactions t ON t.loan_payment_id = p.id AND t.deleted_at IS NULL
     LEFT JOIN cards c ON c.id = t.card_id
     WHERE l.person_id = ? AND l.direction = ?
       AND l.deleted_at IS NULL AND p.deleted_at IS NULL
     ORDER BY p.paid_at DESC, p.rowid DESC`,
    [personId, direction]
  );

  return { person, loans, payments };
}

// Aplica el pago al préstamo (o deuda) más antiguo primero. Todo o nada.
export async function registerPayment(db: SQLiteDatabase, input: NewPayment) {
  const cfg = DIRECTION[input.direction];
  const created: { paymentId: string; loanId: string; amountCents: number }[] = [];

  await db.withTransactionAsync(async () => {
    const person = await db.getFirstAsync<{ name: string }>(
      'SELECT name FROM people WHERE id = ? AND deleted_at IS NULL',
      [input.personId]
    );
    if (!person) throw paymentError('Esa persona ya no existe.');

    // Se vuelve a leer lo que falta dentro de la transacción, no se confía en la pantalla
    const openLoans = await db.getAllAsync<{ id: string; remaining_cents: number }>(
      `SELECT l.id AS id,
              l.amount_cents - COALESCE((
                SELECT SUM(p.amount_cents) FROM loan_payments p
                WHERE p.loan_id = l.id AND p.deleted_at IS NULL
              ), 0) AS remaining_cents
       FROM loans l
       WHERE l.person_id = ? AND l.direction = ? AND l.deleted_at IS NULL
       ORDER BY l.created_at ASC, l.rowid ASC`,
      [input.personId, input.direction]
    );

    const { allocations, unallocatedCents } = allocateOldestFirst(openLoans, input.amountCents);
    if (unallocatedCents > 0) {
      const debt = input.amountCents - unallocatedCents;
      throw paymentError(cfg.overMsg(person.name, formatSoles(debt)));
    }

    const now = new Date().toISOString();
    for (const a of allocations) {
      const paymentId = Crypto.randomUUID();
      await db.runAsync(
        'INSERT INTO loan_payments (id, loan_id, amount_cents, paid_at) VALUES (?, ?, ?, ?)',
        [paymentId, a.loanId, a.amountCents, now]
      );

      if (input.cardId) {
        await db.runAsync(
          `INSERT INTO transactions
             (id, card_id, kind, amount_cents, description, occurred_at, loan_payment_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            Crypto.randomUUID(),
            input.cardId,
            cfg.payKind,
            a.amountCents,
            cfg.payDescription(person.name),
            now,
            paymentId,
          ]
        );
      }
      created.push({ paymentId, loanId: a.loanId, amountCents: a.amountCents });
    }
  });

  return created;
}



// Anula un pago y el movimiento de tarjeta que generó. Todo o nada.
export async function deletePayment(db: SQLiteDatabase, paymentId: string) {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE transactions SET deleted_at = ?, updated_at = ?
       WHERE loan_payment_id = ? AND deleted_at IS NULL`,
      [now, now, paymentId]
    );
    await db.runAsync(
      `UPDATE loan_payments SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [now, now, paymentId]
    );
  });
}

// Elimina el préstamo con sus pagos y todos los movimientos ligados. Todo o nada.
export async function deleteLoan(db: SQLiteDatabase, loanId: string) {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE transactions SET deleted_at = ?, updated_at = ?
       WHERE deleted_at IS NULL
         AND loan_payment_id IN (SELECT id FROM loan_payments WHERE loan_id = ?)`,
      [now, now, loanId]
    );
    await db.runAsync(
      `UPDATE loan_payments SET deleted_at = ?, updated_at = ?
       WHERE loan_id = ? AND deleted_at IS NULL`,
      [now, now, loanId]
    );
    await db.runAsync(
      `UPDATE transactions SET deleted_at = ?, updated_at = ?
       WHERE loan_id = ? AND deleted_at IS NULL`,
      [now, now, loanId]
    );
    await db.runAsync(
      `UPDATE loans SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [now, now, loanId]
    );
  });
}