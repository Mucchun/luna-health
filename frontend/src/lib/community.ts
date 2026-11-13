// Community API base.
//
// The anonymous community is the one feature that is meant to be SHARED between
// real users on different devices. Everything else (symptoms, cycle, labs, meds)
// stays on the user's own machine to preserve privacy.
//
// Set VITE_COMMUNITY_API_URL to a deployed backend (e.g. the fly.io app) and all
// community reads/writes go there — so posts from other users show up for you and
// yours show up for them. Leave it unset and community falls back to the local
// backend (single-device, same as before).
const COMMUNITY_BASE = ((import.meta.env.VITE_COMMUNITY_API_URL as string) || '').replace(/\/$/, '');

export const isSharedCommunity = COMMUNITY_BASE.length > 0;

// Build a community endpoint URL. Passing an absolute URL here also sidesteps the
// global /api fetch prefixing in main.tsx, so health data and community stay on
// separate backends.
export function capiUrl(path: string): string {
  return COMMUNITY_BASE + path;
}

export function capi(path: string, init?: RequestInit): Promise<Response> {
  return fetch(capiUrl(path), init);
}
