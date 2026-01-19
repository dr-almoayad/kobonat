// lib/useLocalizedPath.js
import { useLocale } from 'next-intl';

export function useLocalizedPath() {
  const locale = useLocale();
  return (path) => `/${locale}${path}`;
}