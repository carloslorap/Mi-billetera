import { normalizeText } from '@/core/utils/text';
import * as Crypto from 'expo-crypto';
import { type SQLiteDatabase } from 'expo-sqlite';
import type { NewLoan, Person, PersonDebt } from './types';

export function getPeople(db: SQLiteDatabase) {
  return db.getAllAsync<Person>(
    'SELECT id, name, aliases FROM people WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE'
  );
}

// Lo que cada persona te debe. Se calcula en cada consulta, no se guarda.
export function getPersonDebts(db: SQLiteDatabase) {
  return db.getAllAsync<PersonDebt>(`
    WITH loan_totals AS (
      SELECT
        l.id, l.person_id, l.amount_cents, l.expected_return_date,
        COALESCE((
          SELECT SUM(p.amount_cents) FROM loan_payments p
          WHERE p.loan_id = l.id AND p.deleted_at IS NULL
        ), 0) AS paid_cents
      FROM loans l
      WHERE l.direction = 'lent' AND l.deleted_at IS NULL
    )
    SELECT
      pe.id AS person_id,
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
      pe.name COLLATE NOCASE
  `);
}

// Crea la persona (si es nueva), el préstamo y, si salió de una tarjeta, su movimiento.
// Todo dentro de una transacción: o se guarda completo o no se guarda nada.
export async function createLoan(db: SQLiteDatabase, input: NewLoan) {
  const loanId = Crypto.randomUUID();

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
      await db.runAsync('INSERT INTO people (id, name) VALUES (?, ?)', [
        personId,
        input.person.name.trim(),
      ]);
    }

    await db.runAsync(
      `INSERT INTO loans (id, direction, person_id, amount_cents, expected_return_date, notes)
       VALUES (?, 'lent', ?, ?, ?, ?)`,
      [loanId, personId, input.amountCents, input.expectedReturnDate, input.notes?.trim() || null]
    );

    if (input.cardId) {
      await db.runAsync(
        `INSERT INTO transactions
           (id, card_id, kind, amount_cents, description, occurred_at, loan_id)
         VALUES (?, ?, 'loan_given', ?, ?, ?, ?)`,
        [
          Crypto.randomUUID(),
          input.cardId,
          input.amountCents,
          `Préstamo a ${input.person.name.trim()}`,
          new Date().toISOString(),
          loanId,
        ]
      );
    }
  });

  return loanId;
}