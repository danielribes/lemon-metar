import { createContext } from '../src/core/pipeline.js';
import { TokenStream } from '../src/core/token-stream.js';
import { SUPPORTED_LOCALES, resolveLocale } from '../src/i18n/index.js';

/** Runs one element over `text`, with `report` as the elements parsed so far. */
export function run(element, text, report = {}) {
  const stream = new TokenStream(text.split(' '));
  const context = createContext([element]);
  Object.assign(context.report, report);
  return { data: element.parse(stream, context), warnings: context.warnings, stream };
}

/** Returns the description of `data` in every locale, as `{ en, ca, es }`. */
export function describeAll(element, data, report) {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((code) => [code, element.describe(data, resolveLocale(code).messages, report)]),
  );
}
