// Lightweight i18n for Luna Health.
//
// A tiny context-based translator — no external dependency. The translate
// function is deliberately named `tr` (NOT `t`), because several screens use
// `t` as a loop variable (e.g. `TOPICS.map(t => …)`); a global `t()` would be
// shadowed and throw "t is not a function".
//
// Supported: English (base), Russian, Turkish, French, Spanish, Italian, Korean.
// Language is detected from the device on first launch and can be changed in
// Settings; the choice is persisted in localStorage.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { en } from './strings/en';
import { ru } from './strings/ru';
import { tr as trTR } from './strings/tr';
import { fr } from './strings/fr';
import { es } from './strings/es';
import { it } from './strings/it';
import { ko } from './strings/ko';

export type Lang = 'en' | 'ru' | 'tr' | 'fr' | 'es' | 'it' | 'ko';
export type StringKey = keyof typeof en;

// Every language is typed against the English key set, so a missing translation
// is a compile error rather than a silent fallback.
const DICTS: Record<Lang, Record<StringKey, string>> = { en, ru, tr: trTR, fr, es, it, ko };

export const LANGUAGES: { code: Lang; label: string; english: string }[] = [
  { code: 'en', label: 'English', english: 'English' },
  { code: 'ru', label: 'Русский', english: 'Russian' },
  { code: 'tr', label: 'Türkçe', english: 'Turkish' },
  { code: 'fr', label: 'Français', english: 'French' },
  { code: 'es', label: 'Español', english: 'Spanish' },
  { code: 'it', label: 'Italiano', english: 'Italian' },
  { code: 'ko', label: '한국어', english: 'Korean' },
];

const STORAGE_KEY = 'luna_lang';

function detectLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && saved in DICTS) return saved;
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return (nav in DICTS ? nav : 'en') as Lang;
}

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: (key: StringKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  };

  const tr = (key: StringKey, vars?: Record<string, string | number>) => {
    let s = DICTS[lang][key] ?? en[key] ?? String(key);
    if (vars) for (const k in vars) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
    return s;
  };

  return <I18nContext.Provider value={{ lang, setLang, tr }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
