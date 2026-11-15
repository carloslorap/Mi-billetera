import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Product, Trip, TripItem } from './types';

const now = () => new Date().toISOString();

export async function getOrCreateOpenTrip(db: SQLiteDatabase): Promise<Trip> {
  const row = await db.getFirstAsync<{ id: string; budget_cents: number | null }>(
    `SELECT id, budget_cents FROM shopping_trips
     WHERE status = 'open' AND deleted_at IS NULL
     ORDER BY created_at DESC LIMIT 1`
  );
  if (row) return { id: row.id, budgetCents: row.budget_cents };

  const id = Crypto.randomUUID();
  const t = now();
  await db.runAsync(
    `INSERT INTO shopping_trips (id, status, created_at, updated_at) VALUES (?, 'open', ?, ?)`,
    [id, t, t]
  );
  return { id, budgetCents: null };
}

export async function getTripItems(db: SQLiteDatabase, tripId: string): Promise<TripItem[]> {
  const rows = await db.getAllAsync<{
    id: string; product_id: string | null; name: string;
    unit_price_cents: number; quantity: number;
  }>(
    `SELECT id, product_id, name, unit_price_cents, quantity
     FROM shopping_items
     WHERE trip_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [tripId]
  );
  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    name: r.name,
    unitPriceCents: r.unit_price_cents,
    quantity: r.quantity,
  }));
}

export async function findProductByBarcode(
  db: SQLiteDatabase,
  barcode: string
): Promise<Product | null> {
  const r = await db.getFirstAsync<{
    id: string; barcode: string; name: string | null; price_cents: number;
  }>(
    `SELECT id, barcode, name, price_cents FROM products
     WHERE barcode = ? AND deleted_at IS NULL`,
    [barcode]
  );
  return r ? { id: r.id, barcode: r.barcode, name: r.name, priceCents: r.price_cents } : null;
}

// Crea el producto, o actualiza nombre y precio si el código ya existía.
export async function saveProduct(
  db: SQLiteDatabase,
  barcode: string,
  name: string | null,
  priceCents: number
): Promise<Product> {
  const t = now();
  await db.runAsync(
    `INSERT INTO products (id, barcode, name, price_cents, price_updated_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(barcode) DO UPDATE SET
       name = excluded.name,
       price_cents = excluded.price_cents,
       price_updated_at = excluded.price_updated_at,
       updated_at = excluded.updated_at,
       deleted_at = NULL`,
    [Crypto.randomUUID(), barcode, name, priceCents, t, t, t]
  );
  const p = await findProductByBarcode(db, barcode);
  if (!p) throw new Error('No se pudo guardar el producto');
  return p;
}

// Suma 1 si el producto ya está en la lista; si no, lo agrega.
export async function addProductToTrip(db: SQLiteDatabase, tripId: string, product: Product) {
  const t = now();
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM shopping_items
     WHERE trip_id = ? AND product_id = ? AND deleted_at IS NULL`,
    [tripId, product.id]
  );
  if (existing) {
    await db.runAsync(
      `UPDATE shopping_items SET quantity = quantity + 1, updated_at = ? WHERE id = ?`,
      [t, existing.id]
    );
    return;
  }
  await db.runAsync(
    `INSERT INTO shopping_items
       (id, trip_id, product_id, name, unit_price_cents, quantity, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    [Crypto.randomUUID(), tripId, product.id, product.name ?? `Producto ${product.barcode.slice(-4)}`, product.priceCents, t, t]
  );
}

export async function addManualItem(
  db: SQLiteDatabase,
  tripId: string,
  name: string,
  priceCents: number
) {
  const t = now();
  await db.runAsync(
    `INSERT INTO shopping_items
       (id, trip_id, product_id, name, unit_price_cents, quantity, created_at, updated_at)
     VALUES (?, ?, NULL, ?, ?, 1, ?, ?)`,
    [Crypto.randomUUID(), tripId, name, priceCents, t, t]
  );
}

export async function changeQuantity(db: SQLiteDatabase, itemId: string, delta: number) {
  const t = now();
  await db.runAsync(
    `UPDATE shopping_items SET quantity = quantity + ?, updated_at = ? WHERE id = ?`,
    [delta, t, itemId]
  );
  // Si llegó a 0, se borra (borrado suave).
  await db.runAsync(
    `UPDATE shopping_items SET deleted_at = ?, quantity = 1 WHERE id = ? AND quantity <= 0`,
    [t, itemId]
  );
}

// Edita el ítem y, si viene de un producto del catálogo, también el catálogo.
export async function editItem(
  db: SQLiteDatabase,
  item: TripItem,
  name: string,
  priceCents: number
) {
  const t = now();
  await db.runAsync(
    `UPDATE shopping_items SET name = ?, unit_price_cents = ?, updated_at = ? WHERE id = ?`,
    [name, priceCents, t, item.id]
  );
  if (item.productId) {
    await db.runAsync(
      `UPDATE products SET name = ?, price_cents = ?, price_updated_at = ?, updated_at = ? WHERE id = ?`,
      [name, priceCents, t, t, item.productId]
    );
  }
}

export async function setBudget(db: SQLiteDatabase, tripId: string, cents: number | null) {
  await db.runAsync(
    `UPDATE shopping_trips SET budget_cents = ?, updated_at = ? WHERE id = ?`,
    [cents, now(), tripId]
  );
}

export async function finishTrip(db: SQLiteDatabase, tripId: string) {
  const t = now();
  await db.runAsync(
    `UPDATE shopping_trips SET status = 'done', closed_at = ?, updated_at = ? WHERE id = ?`,
    [t, t, tripId]
  );
}