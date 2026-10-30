# lemon-metar

JavaScript library that parses METAR and SPECI aviation weather reports into JSON,
with a description of each element in English, Catalan or Spanish.

It has no runtime dependencies. It runs on Node 22 or later and in browsers.

## Install

The production file is `dist/lemon-metar.min.js`, a single minified ES module. Copy it
into your project, or load it from a CDN:

```html
<script type="module">
  import { parseMetar } from 'https://cdn.jsdelivr.net/gh/danielribes/lemon-metar@v0.2.0/dist/lemon-metar.min.js';
</script>
```

With npm, install it from GitHub, as it is not on the npm registry:

```bash
npm install github:danielribes/lemon-metar#v0.2.0
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

## API

| Function | Result |
|---|---|
| `parseMetar(input, { locale })` | Report data with descriptions and a summary |
| `decodeMetar(input)` | Report data with no text |
| `describeMetar(decoded, { locale })` | Adds the texts to a decoded report, so changing language needs no new parsing |

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

Reports follow the ICAO format as described in the AEMET guide in `reference/`. The
airport name is not resolved yet, so the result has the ICAO code only. US formats
(`10SM`, `A2992`, `CLR`), TAF and `RMK` decoding are not supported.

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
