import type { SQLiteDatabase } from 'expo-sqlite';
import { supabase } from '../supabase/client';
import { ALL_TABLES, ENABLED_TABLES, SyncTable, WIPE_ORDER } from './tables';
import { toIso } from './time';

let db: SQLiteDatabase | null = null;
let onPulled: (() => void) | null = null;
let running = false;
let again = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let retryDelay = 5000;  

export function registerSync(d: SQLiteDatabase, cb?: () => void) {
    db = d;
    onPulled = cb ?? null;
}

export function requestSync(delay = 1500) {
    if (!db) return;
    clearTimeout(timer);
    timer = setTimeout(runSync, delay);
}

async function getMeta(key: string) {
    const r = await db!.getFirstAsync<{ value: string }>(
        'SELECT value FROM sync_meta WHERE key = ?', [key]);
    return r?.value ?? null;
}
async function setMeta(key: string, value: string) {
    await db!.runAsync(
        'INSERT INTO sync_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        [key, value]);
}

async function ensureOwner(uid: string) {
    const owner = await getMeta('owner');
    if (owner && owner !== uid) {
        console.warn('[sync] cambio de cuenta: limpiando datos locales');
        await db!.withTransactionAsync(async () => {
            for (const t of WIPE_ORDER) await db!.runAsync(`DELETE FROM ${t}`);
            await db!.runAsync(`DELETE FROM sync_meta WHERE key LIKE 'cursor:%'`);
        });
        onPulled?.();
    }
    if (owner !== uid) await setMeta('owner', uid);
}

async function push(t: SyncTable, uid: string) {
    let total = 0;
    while (true) {
        const rows = await db!.getAllAsync<Record<string, any>>(
            `SELECT ${t.columns.join(',')} FROM ${t.name} WHERE dirty = 1 ORDER BY updated_at LIMIT 200`);
        if (!rows.length) break;
        const payload = rows.map((r) => {
            const o: Record<string, any> = { ...r, user_id: uid };
            for (const k of Object.keys(o)) if (k.endsWith('_at')) o[k] = toIso(o[k]);
            return o;
        });
        const { error } = await supabase.from(t.name).upsert(payload, { onConflict: 'id' });
        if (error) throw error;
        for (const r of rows) {
            await db!.runAsync(
                `UPDATE ${t.name} SET dirty = 0 WHERE id = ? AND updated_at = ? AND dirty = 1`,
                [r.id, r.updated_at]);
        }
        total += rows.length;
    }
    return total;
}

async function pull(t: SyncTable) {
    const key = `cursor:${t.name}`;
    const saved = await getMeta(key);
    let since = saved
        ? new Date(Date.parse(saved) - 10_000).toISOString() // solape de 10 s
        : '1970-01-01T00:00:00.000Z';
    let last: string | null = null;
    let total = 0;

    const cols = t.columns;
    const sql = `
    INSERT INTO ${t.name} (${cols.join(',')}, dirty)
    VALUES (${cols.map(() => '?').join(',')}, 2)
    ON CONFLICT(id) DO UPDATE SET
      ${cols.filter((c) => c !== 'id').map((c) => `${c} = excluded.${c}`).join(', ')},
      dirty = 2
    WHERE strftime('%Y-%m-%dT%H:%M:%fZ', excluded.updated_at)
       >= strftime('%Y-%m-%dT%H:%M:%fZ', ${t.name}.updated_at)`;

    while (true) {
        const { data, error } = await supabase.from(t.name).select('*')
            .gt('server_updated_at', since)
            .order('server_updated_at', { ascending: true })
            .limit(500);
        if (error) throw error;
        if (!data?.length) break;

        await db!.withTransactionAsync(async () => {
            for (const r of data) {
                const vals = cols.map((c) => (c.endsWith('_at') ? toIso(r[c]) : r[c] ?? null));
                await db!.runAsync(sql, vals);
            }
            await db!.runAsync(`UPDATE ${t.name} SET dirty = 0 WHERE dirty = 2`);
        });

        total += data.length;
        last = toIso(data[data.length - 1].server_updated_at);
        since = last!;
        if (data.length < 500) break;
    }
    if (last) await setMeta(key, last);
    return total;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

async function doSync() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('sin sesión todavía');
  await ensureOwner(session.user.id);
  let up = 0, down = 0;
  for (const name of ENABLED_TABLES) {
    const t = ALL_TABLES[name];
    up += await push(t, session.user.id);
    down += await pull(t);
  }
  console.log(`[sync] subidas ${up}, bajadas ${down}`);
  if (down > 0) onPulled?.();
}

export async function runSync() {
  if (!db) return;
  if (running) { again = true; return; }
  running = true;
  console.log('[sync] iniciando');
  try {
    await withTimeout(doSync(), 20000);
    retryDelay = 5000;
  } catch (e) {
    console.warn('[sync] error', e);
    requestSync(retryDelay);
    retryDelay = Math.min(retryDelay * 2, 60000);
  } finally {
    running = false;
    if (again) { again = false; requestSync(500); }
  }
}