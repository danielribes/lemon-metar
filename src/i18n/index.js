import { ca } from './locales/ca.js';
import { en } from './locales/en.js';
import { es } from './locales/es.js';

const LOCALES = { en, ca, es };

export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = Object.keys(LOCALES);

/** Accepts `ca`, `CA` or `ca-ES`. Anything unknown falls back to the default locale. */
export function resolveLocale(locale = DEFAULT_LOCALE) {
  const language = String(locale).toLowerCase().split('-')[0];
  const code = Object.hasOwn(LOCALES, language) ? language : DEFAULT_LOCALE;
  return { code, messages: LOCALES[code] };
}
