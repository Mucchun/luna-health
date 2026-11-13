import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { handleLocal } from './lib/localApi'
import { I18nProvider } from './i18n'

// ── On-device API ────────────────────────────────────────────────────────────
// The app is now fully on-device: personal health data lives on the device (see
// lib/store.ts) and every `/api/*` call is served locally by lib/localApi.ts —
// there is no health backend to host or share. This is what makes it App-Store
// safe: nothing about a user's health ever leaves their device.
//
// The one exception is the anonymous Community, which routes through
// lib/community.ts to a shared backend (an absolute URL) when configured; those
// requests are absolute, so they skip this interceptor and go to the network.
// When no shared backend is set, community falls back to a local handler here.
const _fetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  if (urlStr && urlStr.startsWith('/api')) {
    const method = (init?.method || (typeof input !== 'string' && !(input instanceof URL) ? (input as Request).method : 'GET') || 'GET');
    let body: unknown = undefined;
    if (init?.body && typeof init.body === 'string') {
      try { body = JSON.parse(init.body); } catch { body = init.body; }
    }
    try {
      const { status, data } = await handleLocal(method, urlStr, body);
      return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error)?.message || 'Local API error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
  return _fetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
