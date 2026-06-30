import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// When building for mobile (VITE_API_URL set), prepend the hosted backend URL
// to all /api/* fetch calls so the Capacitor app reaches the real server.
const API_BASE = (import.meta.env.VITE_API_URL as string) || '';
if (API_BASE) {
  const _fetch = window.fetch.bind(window);
  (window as any).fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      return _fetch(API_BASE + input, init);
    }
    return _fetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
