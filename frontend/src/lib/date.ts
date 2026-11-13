// Calendar-date helpers.
//
// Dates are stored as 'YYYY-MM-DD' strings in the user's LOCAL calendar.
// `new Date().toISOString()` is UTC, so late-evening / early-morning logs landed
// on the wrong day for anyone not on UTC. Always use these helpers for "today".

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as 'YYYY-MM-DD'. */
export function localISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Add (or subtract) whole days to a 'YYYY-MM-DD' string. */
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return localISO(new Date(y, m - 1, d + n));
}

/** Whole days from a to b (both 'YYYY-MM-DD'); positive when b is later. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}
