# lemon-metar action plan

Plan for phase 1 of the library. Project rules are in `CLAUDE.md`, and parsing rules
are in `docs/metar-spec.md`.

## Goal

Parse a METAR or SPECI report into JSON, with a description of each element and a
full text summary, in English, Catalan and Spanish.

## Decisions

| Topic | Decision |
|---|---|
| Runtime | Modern JavaScript, native ES modules. `src/` must run as is on Node 22, with no build step during development |
| Dependencies | None at runtime. Tests use `node:test` and `node:assert`. `esbuild` is a development dependency, for the production file only |
| Distribution | `dist/lemon-metar.min.js`, committed to the repository. No npm package for now |
| Report type word | Optional, defaults to `METAR`, as in the reference example |
| Summary wording | "Observation" rather than "forecast", as a METAR is an observation and only TREND is a forecast. "Núvol" for cloud, "punt de rosada" for dew point |
| Non-European formats | Out of scope. US formats (`SM`, `A2992`, `CLR`) are not supported for now and land in `unparsed` |
| Malformed content | Never throws. Unknown tokens go to `unparsed`, broken rules go to `warnings` |
| License | MIT |

## Steps

All steps of phase 1 are done.

1. **Foundation.** `git init`, `package.json`, `.gitignore`, license, tokenizer, token
   stream and pipeline, with tests.
2. **Internationalisation.** Locale resolution for `en`, `ca` and `es`, and a test that
   forces all locales to expose the same keys.
3. **Simple elements.** Report type, station, observation time, NIL, AUTO, temperature,
   QNH, CAVOK and remarks. Each one with its tests and texts.
4. **Wind and visibility.** Wind, wind variation, prevailing and minimum visibility, RVR.
5. **Weather and sky.** Present and recent weather, clouds, vertical visibility, wind
   shear. This step carries the hardest language work, as word order and agreement
   differ between languages.
6. **TREND.** Composition of the previous elements.
7. **Full output.** Public API, text summary and integration tests with every spec
   vector.
8. **Closing.** Coverage of at least 95% of lines and 90% of branches, a check that each
   spec rule has a test, and the README.

## Phase 2

Airport list, to turn the ICAO code into the real airport name.
