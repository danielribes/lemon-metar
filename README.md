# lemon-metar

JavaScript library that parses METAR and SPECI aviation weather reports into JSON,
with a description of each element in English, Catalan or Spanish.

It has no runtime dependencies. It runs on Node 22 or later and in browsers.

## Install

The production file is `dist/lemon-metar.min.js`, a single minified ES module. Copy it
into your project, or load it from a CDN:

```html
<script type="module">
  import { parseMetar } from 'https://cdn.jsdelivr.net/gh/danielribes/lemon-metar@v0.3.0/dist/lemon-metar.min.js';
</script>
```

With npm, install it from GitHub, as it is not on the npm registry:

```bash
npm install github:danielribes/lemon-metar#v0.3.0
```

## Usage

```js
import { parseMetar } from 'lemon-metar';

const report = parseMetar('LELL 282230Z AUTO VRB02KT CAVOK 15/09 Q1017', { locale: 'ca' });

report.wind.speed;        // 2
report.wind.description;  // 'Vent variable de 2 kt.'
report.temperature.air;   // 15
console.log(report.summary);
```

```text
Observació a LELL. Dia 28 a les 22:30 UTC. Observació generada automàticament.
Vent variable de 2 kt. Visibilitat de 10 km o més i cap núvol per sota de 5000 ft (1500 m).
Temperatura de 15 °C, punt de rosada a 9 °C.
QNH 1017 hPa.
```

## Validate before relying on it

METAR data can inform decisions that affect safety. Do not use this library for flight
planning, navigation or any other operational purpose without exhaustive prior testing
and validation for that use.

The library follows the specifications in the
[AEMET aeronautical guide](https://www.aemet.es/en/conocermas/aeronautica/detalles/Guia_MET)
and has a test suite that validates each rule. It is not an official product, and is
not affiliated with or endorsed by AEMET. Airport names and translations may contain
errors.

Its use and results are the sole responsibility of whoever uses it. The original report
and official aeronautical weather sources remain the reference.

## Airport names

Names are an optional module, as they are ten times the size of the library:

```js
import { parseMetar } from 'lemon-metar';
import { airports } from 'lemon-metar/airports';

const report = parseMetar('LELL 282230Z AUTO VRB02KT CAVOK 15/09 Q1017', { locale: 'ca', airports });

report.station.name;         // 'Aeroport de Sabadell'
report.station.description;  // "Observació a l'Aeroport de Sabadell (LELL)."
```

From a CDN, load `dist/airports.min.js` the same way as the main file.

Airports of Spain have names in Catalan and Spanish. Everywhere else, and in English,
the name comes as the source gives it, such as `Sabadell Airfield`. A code with no
known name shows the code alone.

Names come from [OurAirports](https://ourairports.com/data/), which is public domain.
To update them, run `npm run airports`, then `npm run verify`.

## API

| Function | Result |
|---|---|
| `parseMetar(input, { locale, airports })` | Report data with descriptions and a summary |
| `decodeMetar(input)` | Report data with no text |
| `describeMetar(decoded, { locale, airports })` | Adds the texts to a decoded report, so changing language needs no new parsing |

`SUPPORTED_LOCALES` lists the languages (`en`, `ca`, `es`) and `DEFAULT_LOCALE` is `en`.
An unknown locale falls back to English. The `locale` field of the result shows the one
that was used.

## Result

Each element holds its source tokens in `raw`, its values, and its `description`.

| Field | Content |
|---|---|
| `raw`, `locale`, `summary` | Input, language used, full text |
| `reportType`, `station`, `time` | Report header |
| `nil`, `auto`, `cavok` | Present when the code word appears, otherwise `null` |
| `wind`, `windVariation` | Surface wind |
| `visibility`, `minimumVisibility`, `rvr` | Visibility and runway visual range |
| `weather`, `recentWeather` | Present and recent weather |
| `sky` | Clouds or vertical visibility |
| `temperature`, `pressure` | Temperature, dew point and QNH |
| `windShear`, `trend`, `remarks` | Trailing sections |
| `unparsed` | Tokens that were not understood |
| `warnings` | Values that break a rule, as `{ code, token }` |

An element absent from the report is `null`, or `[]` for `rvr`, `weather`,
`recentWeather` and `trend`. A value the report encodes with solidi is `null`.
`docs/metar-spec.md` has the fields of each element.

## Errors

Only empty or non-string input throws, with a `TypeError`. Malformed report content
never throws: unknown tokens go to `unparsed`, and broken rules go to `warnings`.

## Scope

Reports follow the ICAO format as described in the
[AEMET aeronautical guide](https://www.aemet.es/en/conocermas/aeronautica/detalles/Guia_MET),
which `docs/metar-spec.md` is based on. US formats (`10SM`, `A2992`, `CLR`), TAF and
`RMK` decoding are not supported.

## Development

`src/` runs as is, so development needs no build.

```bash
npm install
npm test                 # Tests over src/
npm run test:coverage    # Same, with coverage thresholds
npm run build            # Generates dist/lemon-metar.min.js
npm run test:dist        # Checks dist/ gives the same results as src/
npm run verify           # All of the above, in order
```

Run `npm run verify` before committing a change to `src/`, so `dist/` stays in sync.
Never edit `dist/` by hand.

- `docs/metar-spec.md`: parsing rules and test vectors.
- `docs/plan.md`: action plan.
- `CLAUDE.md`: project rules and architecture.

## License

MIT
