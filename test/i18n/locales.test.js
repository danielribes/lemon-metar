import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, resolveLocale } from '../../src/i18n/index.js';

/** Lists every leaf path of a locale, as `wind.calm`. */
function paths(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = `${prefix}${key}`;
    return typeof child === 'object' ? paths(child, `${path}.`) : [path];
  });
}

test('supports en, ca and es, with en by default', () => {
  assert.deepEqual([...SUPPORTED_LOCALES].sort(), ['ca', 'en', 'es']);
  assert.equal(DEFAULT_LOCALE, 'en');
  assert.equal(resolveLocale().code, 'en');
});

test('resolves case and regional variants', () => {
  assert.equal(resolveLocale('CA').code, 'ca');
  assert.equal(resolveLocale('ca-ES').code, 'ca');
  assert.equal(resolveLocale('es-419').code, 'es');
});

test('falls back to English on unknown locales', () => {
  assert.equal(resolveLocale('fr').code, 'en');
  assert.equal(resolveLocale('constructor').code, 'en');
});

test('all locales expose the same keys', () => {
  const reference = paths(resolveLocale('en').messages).sort();
  for (const code of SUPPORTED_LOCALES) {
    assert.deepEqual(paths(resolveLocale(code).messages).sort(), reference, code);
  }
});
