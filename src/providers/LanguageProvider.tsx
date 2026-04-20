'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { type Locale, type TranslationKey, translations } from '@/lib/i18n';

const STORAGE_KEY = 'br_lang';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('az');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === 'az' || stored === 'en' || stored === 'ru')) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLocaleState(l);
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
