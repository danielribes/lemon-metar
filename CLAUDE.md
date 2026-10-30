# lemon-metar

JavaScript library that parses METAR/SPECI aviation weather reports into JSON,
with a human-readable description of every element in several languages.

## Working rules

- **Conversation with the user: Catalan.**
- **Code, comments and documentation: English.**
- Be pragmatic. A METAR is a string of tokens, and most can be parsed with regular
  expressions. No grammar generators or parser frameworks.
- Do not copy or take code from other METAR libraries, and do not consult them.
  Work from `docs/metar-spec.md`.
- `docs/metar-spec.md` is the source of truth. It was extracted from pages 13-22 of the
  [AEMET aeronautical guide](https://www.aemet.es/en/conocermas/aeronautica/detalles/Guia_MET)
  (`AU-GUI-0102_en.pdf`). The PDF is not committed: it goes in `reference/`, which git
  ignores. When behaviour changes, update the spec first, then the tests, then the code.

## Tech

- Modern JavaScript (ES2026 target), native ES modules. `src/` runs as is, with no
  build step or transpiler during development.
- No runtime dependencies. Tests use the built-in `node:test` and `node:assert`.
  `esbuild` is the only development dependency, and is used only by `npm run build`.
- `src/` must stay runtime-agnostic: no `node:` imports, so it also works in browsers.
- Only use features the current Node runs natively. On Node 22 (V8 12.4) these are
  not available: duplicate named regex groups, `RegExp.escape`, regex modifiers,
  `using`, `Map.prototype.getOrInsert`, `Iterator.concat`, `Math.sumPrecise`,
  `Error.isError`.

## Architecture

Small pure units, combined by composition (SOLID). One module per METAR element.
Plain functions and objects by default. Use a class only if it holds real state,
as the token stream does.

```
src/
  index.js              Public API
  core/
    tokenizer.js        Normalisation and splitting
    token-stream.js     Cursor over tokens, supports multi-token groups
    pipeline.js         Runs element parsers in report order
    summary.js          Builds the full text from element descriptions
  elements/             One module per element
    report-type.js  station.js  observation-time.js  nil.js  auto.js
    wind.js  wind-variation.js  cavok.js  visibility.js  minimum-visibility.js
    rvr.js  weather.js  sky.js  temperature.js  pressure.js
    recent-weather.js  wind-shear.js  trend.js  remarks.js
    weather-codes.js    Weather tables shared by weather and recent weather
    values.js           Small value helpers
    index.js            Elements in report order
  airports/
    index.js            Airports module: { names, translations }
    data.js             Generated code to name map. Never edit
    translations.js     Hand-kept names by language
  i18n/
    index.js            Locale resolution and fallback to English
    romance.js          Shared phrase composition for Catalan and Spanish
    locales/            en.js  ca.js  es.js
test/
  core/  elements/  i18n/  integration/  fixtures/
test-dist/              Checks the production files against src/
scripts/                Maintenance scripts, may use Node APIs
dist/                   Generated production files
```

Design rules:

- **Element contract.** Each element module exposes `id`, `parse(stream, context)`,
  which returns locale-free data or `null` without consuming tokens, and
  `describe(data, locale, report)`, which returns text. List elements set
  `repeatable: true`, and consume all their consecutive groups in one `parse` call.
- **Parsing and description are separate.** Parsing produces data and never touches
  languages. Text is derived from that data, so changing language needs no re-parse.
- **Adding an element** means a new module plus one line in the pipeline order.
  Existing elements do not change.
- **The pipeline is ordered.** METAR order is fixed and resolves ambiguous tokens.
  For each token, try the elements from the current position forward. A token that
  nothing matches goes to `unparsed`.
- **TREND composes** the wind, visibility, weather and sky elements. It does not
  redefine them.
- **Never throw on report content.** Only non-string or empty input throws. Bad
  tokens go to `unparsed`, broken semantic rules go to `warnings`.

## Public API

```js
import { parseMetar } from 'lemon-metar';

const report = parseMetar('LELL 282230Z AUTO VRB02KT CAVOK 15/09 Q1017', { locale: 'ca' });
```

Result shape:

```jsonc
{
  "raw": "LELL 282230Z AUTO VRB02KT CAVOK 15/09 Q1017",
  "locale": "ca",
  "reportType": { "raw": null, "type": "METAR", "corrected": false, "description": "..." },
  "station": { "raw": "LELL", "icao": "LELL", "description": "..." },
  "nil": null,
  "auto": { "raw": "AUTO", "description": "..." },
  "time": { "raw": "282230Z", "day": 28, "hour": 22, "minute": 30, "description": "..." },
  "wind": { "raw": "VRB02KT", "variable": true, "speed": 2, "description": "..." },
  // ...one entry per element, field details in docs/metar-spec.md
  "summary": "Full text in the requested language",
  "unparsed": [],
  "warnings": []
}
```

Each element carries its `raw` token(s), its data and its `description`. An element
absent from the report is `null`, or `[]` for lists. `decodeMetar` returns the
locale-free data, and `describeMetar` adds the texts.

## Airport names

- `src/airports/data.js` is generated by `npm run airports` from OurAirports (public
  domain) and the NOAA station list.
- It is a separate optional module, as it is ten times the size of the library. It
  must never be imported from `src/index.js`. Callers pass it as the `airports` option.
- Regenerate it only on purpose, never as part of the build: it needs the network and
  its source changes daily, while the build must stay reproducible.
- The source has one name per airport, mostly in English. `src/airports/translations.js`
  holds hand-kept `ca` and `es` names for every airport of Spain, which take priority.
  A test fails if a regeneration adds an airport of Spain with no translation.
- The text shows the name with its code, and falls back to the code alone.

## Internationalisation

- Locales: `en`, `ca`, `es`. Default `en`. Unknown locale falls back to `en`.
- All user-facing text lives in `src/i18n/locales/`, never in element modules.
- A locale provides functions, not only strings, because word order and agreement
  differ between languages: "heavy showers of rain" / "xàfecs forts de pluja" /
  "chubascos fuertes de lluvia". Terms carry gender and number where needed.
- All locales must expose the same keys. A test enforces it.
- Use aviation terminology, for example "punt de rosada" (not "rocío"), "núvol"
  for cloud, "boira" for fog. A METAR is an observation; only TREND is a forecast.

## Testing

- `node --test` runner, one test file per module.
- Every element and every functional part has its own tests.
- Test names quote the spec rule ID: `WIND-05: warns when gust is below speed + 10`.
- Every rule in the spec needs at least one test.
- `test/integration/` covers all vectors from section 7 of the spec. Summaries are
  checked per locale.
- Coverage goal: at least 95% of lines and 90% of branches.

Commands:

```bash
npm test                 # Tests over src/
npm run test:coverage    # Same, with coverage thresholds
npm run build            # Generates the files in dist/
npm run test:dist        # Checks dist/ gives the same results as src/
npm run verify           # All of the above, in order
npm run airports         # Regenerates src/airports/data.js. Needs the network
```

## Production build

- `dist/lemon-metar.min.js` is the production file: one minified ES module.
  `dist/airports.min.js` is the optional airport names module.
- They are generated from `src/`. Never edit `dist/`.
- `dist/` is committed, as it is how consumers get the library. There is no npm
  package yet.
- Any change to `src/` must be followed by `npm run verify` before committing, so
  `dist/` stays in sync. `npm test` does not touch `dist/`.

## Scope

- **Phase 1 (done):** full METAR/SPECI parsing per the spec, in `en`, `ca`, `es`.
- **Phase 2 (done):** airport names, with translated names for Spain.
- **Not planned:** TAF, RMK decoding, US and other national formats. Those tokens
  land in `unparsed`.
