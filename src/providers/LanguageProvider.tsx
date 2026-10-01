'use client';

import { createContext, useContext, useEffect } from 'react';
import { LANGUAGE_COOKIE, type Locale, type TranslationKey, translations } from '@/lib/i18n';

const STORAGE_KEY = LANGUAGE_COOKIE;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function persistLocale(l: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, l);
    document.cookie = `${LANGUAGE_COOKIE}=${l}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export function LanguageProvider({
  children,
  initialLocale = 'az',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  // The URL's locale segment is the source of truth (/en/shop is always English).
  // Storage/cookie only remember the choice for locale-less URLs (middleware redirect);
  // callers of setLocale navigate to the new locale path themselves.
  const locale = initialLocale;

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  const t = (key: TranslationKey): string => translations[locale][key] as string;

  return (
    <LanguageContext.Provider value={{ locale, setLocale: persistLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
