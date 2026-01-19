// i18n.config.js
import { defineConfig } from 'next-intl/config';
import { routing } from './routing';

export default defineConfig({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix,
  pathnames: routing.pathnames
});