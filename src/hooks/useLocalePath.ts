'use client';

import { useLang } from '@/providers/LanguageProvider';

export function useLocalePath() {
  const { locale } = useLang();
  return (path: string) => `/${locale}${path === '/' ? '' : path}`;
}
