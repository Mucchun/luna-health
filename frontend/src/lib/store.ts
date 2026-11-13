// On-device persistent storage.
//
// Replaces the old server-side SQLite database. Personal health data now lives
// entirely on the user's device — never sent anywhere — which is what makes the
// app privacy-safe and App-Store-shaped (no shared backend for health data).
//
// Uses Capacitor Preferences, which is backed by UserDefaults on iOS and
// localStorage on the web/desktop, so the same code persists everywhere.

import { Preferences } from '@capacitor/preferences';

const PREFIX = 'luna:';
const cache = new Map<string, unknown>();

// Format a timestamp the way the old SQLite `datetime('now')` did
// ("YYYY-MM-DD HH:MM:SS", UTC) so existing UI date parsing keeps working.
export function nowStamp(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export async function load<T>(key: string, fallback: T): Promise<T> {
  if (cache.has(key)) return cache.get(key) as T;
  const { value } = await Preferences.get({ key: PREFIX + key });
  const v = value != null ? (JSON.parse(value) as T) : fallback;
  cache.set(key, v);
  return v;
}

export async function save<T>(key: string, value: T): Promise<T> {
  cache.set(key, value);
  await Preferences.set({ key: PREFIX + key, value: JSON.stringify(value) });
  return value;
}

export async function remove(key: string): Promise<void> {
  cache.delete(key);
  await Preferences.remove({ key: PREFIX + key });
}

// ── Collection helpers (mimic the auto-increment tables) ──────────────────────

export interface Row { id: number; [k: string]: unknown }

export async function all<T extends Row>(coll: string): Promise<T[]> {
  return load<T[]>(coll, []);
}

export async function insert<T extends Row>(coll: string, row: Omit<T, 'id'>): Promise<number> {
  const rows = await all<T>(coll);
  const id = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
  rows.push({ ...(row as object), id } as T);
  await save(coll, rows);
  return id;
}

export async function update<T extends Row>(coll: string, id: number, patch: Partial<T>): Promise<void> {
  const rows = await all<T>(coll);
  const i = rows.findIndex(r => r.id === id);
  if (i >= 0) { rows[i] = { ...rows[i], ...patch }; await save(coll, rows); }
}

export async function del<T extends Row>(coll: string, id: number): Promise<void> {
  const rows = await all<T>(coll);
  await save(coll, rows.filter(r => r.id !== id));
}

export async function clear(coll: string): Promise<void> {
  await save(coll, []);
}
