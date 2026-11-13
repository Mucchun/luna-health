// Community API client.
//
// The anonymous Community is the one feature that is SHARED between real users
// on different devices. Everything else (symptoms, cycle, labs, meds) stays on
// the user's own device.
//
// Community requests go to the shared server (community-api/ in this repo,
// deployed on Vercel). Only what the user chooses to post is sent: a made-up
// display name, a colour, and the text.
//
// Override with VITE_COMMUNITY_API_URL to point at another server, or set it to
// "local" to keep the community on this device only (useful for development).
const DEFAULT_BASE = 'https://luna-community.vercel.app';
const configured = ((import.meta.env.VITE_COMMUNITY_API_URL as string) || '').trim();
const COMMUNITY_BASE = (configured === 'local' ? '' : configured || DEFAULT_BASE).replace(/\/$/, '');

export const isSharedCommunity = COMMUNITY_BASE.length > 0;

// A random secret that identifies this install to the community server. It is
// never shown to anyone; the server stores only a hash of it, and uses it so
// that you (and only you) can delete your own posts and replies.
const OWNER_KEY = 'luna_community_secret';
function ownerSecret(): string {
  let s = localStorage.getItem(OWNER_KEY);
  if (!s) {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    s = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(OWNER_KEY, s);
  }
  return s;
}

// Build a community endpoint URL. An absolute URL also bypasses the on-device
// /api interceptor in main.tsx, so health data and community never mix.
export function capiUrl(path: string): string {
  return COMMUNITY_BASE + path;
}

export function capi(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (isSharedCommunity) headers.set('X-Luna-Owner', ownerSecret());
  return fetch(capiUrl(path), { ...init, headers });
}

// Same as capi(), but returns parsed JSON and throws a readable Error when the
// server refuses the request or the device is offline.
export async function capiJson<T = any>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try { res = await capi(path, init); }
  catch { throw new Error("Can't reach the community right now. Check your connection and try again."); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || 'Something went wrong. Please try again.');
  return data as T;
}
