import { createContext, runPipeline } from './core/pipeline.js';
import { buildSummary } from './core/summary.js';
import { TokenStream } from './core/token-stream.js';
import { tokenize } from './core/tokenizer.js';
import { REPORT_ELEMENTS } from './elements/index.js';
import { DEFAULT_REPORT_TYPE } from './elements/report-type.js';
import { resolveLocale } from './i18n/index.js';

export { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './i18n/index.js';

/** Parses a report into locale-free data. */
export function decodeMetar(input) {
  const stream = new TokenStream(tokenize(input));
  const { report, unparsed, warnings } = runPipeline(stream, REPORT_ELEMENTS, createContext(REPORT_ELEMENTS));

  return {
    raw: input.trim(),
    ...report,
    reportType: report.reportType ?? DEFAULT_REPORT_TYPE,
    unparsed,
    warnings,
  };
}

/** Adds the description of each element and the full summary to a decoded report. */
export function describeMetar(decoded, { locale } = {}) {
  const { code, messages } = resolveLocale(locale);
  const { raw, unparsed, warnings } = decoded;

  const elements = {};
  for (const element of REPORT_ELEMENTS) {
    const describe = (item) => ({ ...item, description: element.describe(item, messages, decoded) });
    const value = decoded[element.id];

    if (Array.isArray(value)) elements[element.id] = value.map(describe);
    else elements[element.id] = value === null ? null : describe(value);
  }

  return { raw, locale: code, ...elements, summary: buildSummary(elements), unparsed, warnings };
}

/** Parses a report and describes it in the requested language. */
export function parseMetar(input, options) {
  return describeMetar(decodeMetar(input), options);
}
