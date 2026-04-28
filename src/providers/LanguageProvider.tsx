'use client';

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { LANGUAGE_COOKIE, isLocale, type Locale, type TranslationKey, translations } from '@/lib/i18n';

const STORAGE_KEY = LANGUAGE_COOKIE;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const listeners = new Set<() => void>();
let currentLocale: Locale = 'az';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLocale(fallback: Locale) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

function persistLocale(l: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, l);
    document.cookie = `${LANGUAGE_COOKIE}=${l}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function notifyLocaleChange(l: Locale) {
  currentLocale = l;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;

    notifyLocaleChange(readStoredLocale(currentLocale));
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

export function LanguageProvider({
  children,
  initialLocale = 'az',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const locale = useSyncExternalStore(
    subscribe,
    () => {
      currentLocale = readStoredLocale(initialLocale);
      return currentLocale;
    },
    () => initialLocale,
  );

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  const setLocale = (l: Locale) => {
    persistLocale(l);
    notifyLocaleChange(l);
  };

  const t = (key: TranslationKey): string => translations[locale][key] as string;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
