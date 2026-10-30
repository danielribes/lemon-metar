# METAR / SPECI specification for lemon-metar

Working specification for the parser, extracted from AEMET guide
`reference/AU-GUI-0102_en.pdf`, pages 13-22. It is the source of truth for the
implementation and its tests.

## 0. Conventions

- **Rule IDs** (`WIND-03`) are stable. Tests quote them in their names, so every
  rule can be traced to a test.
- **Source tags:**
  - `[p.N]` the rule comes from page N of the PDF.
  - `[EXT]` the rule is not in the PDF. It is added because real-world reports
    need it. Section 8 lists every extension.
- **Regexes** are illustrative and anchored to one token. Avoid duplicate named
  groups: Node 22 rejects them.
- **Tolerance:** the parser never throws on malformed report content.
  - A token that matches nothing goes to `unparsed`.
  - A token that matches but breaks a semantic rule is kept, and a code is added
    to `warnings`.
- **Missing values:** a field the report encodes with solidi (`/`) is `null`.
  An element absent from the report is also `null` (or `[]` for lists).
- **Element shape:** every element, and every list item, carries `raw` with its
  source tokens and, once described, `description`. The `Output` lines below list
  the remaining fields.

## 1. Report grammar

Elements always appear in this order. `?` is optional, `*` is repeated. [p.13, p.17]

```
(METAR|SPECI)? COR? CCCC YYGGggZ
  NIL
| AUTO?
  wind? wind-variation?
  ( CAVOK | visibility minimum-visibility? rvr* weather{0,3} sky )
  temperature pressure
  recent-weather{0,3} wind-shear?
  trend*
  remarks?
```

`sky` is one of: `cloud{1,4}`, `VVhhh`, `NSC`, `NCD`.

The fixed order is what resolves ambiguous tokens. A bare `1200` can only be a
minimum visibility if a prevailing visibility has already been read (see `MVIS-01`).

## 2. Normalisation and tokenisation

| ID | Rule | Source |
|---|---|---|
| TOK-01 | Trim, and collapse any whitespace run (spaces, tabs, newlines) to one separator. The PDF examples use multiple spaces. | [p.20] |
| TOK-02 | Strip the trailing `=` terminator. | [p.18, p.20] |
| TOK-03 | Convert to upper case. | [EXT] |
| TOK-04 | Normalise the en dash and minus sign (`–`, `−`) to `-`. PDF example 6 prints `–UP`. | [p.22] |
| TOK-05 | Empty or non-string input throws `TypeError`. It is the only case that throws. | [EXT] |
| TOK-06 | `raw` in the output keeps the input as received, trimmed. | [EXT] |

Some groups span several tokens (`WS R17`, `WS ALL RWY`, `BECMG FM1100 7000`), so
elements consume from a token stream rather than receiving a single token.

## 3. Header elements

### TYPE: report type

| ID | Rule | Source |
|---|---|---|
| TYPE-01 | `METAR` is a routine report, `SPECI` a special report. | [p.13] |
| TYPE-02 | `COR` right after the type marks a corrected report. | [p.13] |
| TYPE-03 | If the type word is absent, `type` defaults to `METAR`. Needed for the reference example `LELL 282230Z ...`. | [EXT] |

Output: `reportType: { type: "METAR"|"SPECI", corrected }`. `raw` is `null` when the
report has no type word.

### STN: station

| ID | Rule | Source |
|---|---|---|
| STN-01 | `^[A-Z][A-Z0-9]{3}$`, ICAO location indicator of the aerodrome. | [p.13] |
| STN-02 | Phase 1 reports the code only. Name lookup is phase 2. | Project scope |

Output: `station: { icao }`.

### TIME: observation time

`^(?<day>\d{2})(?<hour>\d{2})(?<minute>\d{2})Z$`

| ID | Rule | Source |
|---|---|---|
| TIME-01 | Day of month, then hours and minutes UTC, then `Z`. | [p.13] |
| TIME-02 | Out of range (day 1-31, hour 0-23, minute 0-59): warning `time.out-of-range`. | [EXT] |
| TIME-03 | The report has no month or year, so no absolute date is produced. | [p.20] |

Output: `time: { day, hour, minute }`.

### NIL: missing report

| ID | Rule | Source |
|---|---|---|
| NIL-01 | `NIL` right after the time means the report is missing. | [p.18] |
| NIL-02 | With `NIL`, nothing else is parsed. Later elements stay empty and any trailing tokens go to `unparsed`. | [p.18] |

Output: `nil: {} | null`.

### AUTO

| ID | Rule | Source |
|---|---|---|
| AUTO-01 | `AUTO` before the wind group means fully automated, with no human intervention. | [p.13, p.17] |

Output: `auto: {} | null`.

## 4. Observation elements

### WIND: surface wind

`^(?<dir>\d{3}|VRB|///)(?<speed>\d{2,3}|//)(?:G(?<gust>\d{2,3}))?KT$`

| ID | Rule | Source |
|---|---|---|
| WIND-01 | `ddd` is the mean true direction, rounded to 10°, from which the wind blows. | [p.13] |
| WIND-02 | `VRB` is variable: ff < 3 kt and variation ≥ 60°, or ff ≥ 3 kt and variation ≥ 180°, or undetermined direction. | [p.13] |
| WIND-03 | `ff` is the mean speed over the preceding 10 minutes, in knots. | [p.13] |
| WIND-04 | `G` + `fmfm` is the maximum gust over the same period. | [p.13] |
| WIND-05 | A gust must satisfy `gust ≥ speed + 10`. Otherwise warning `wind.gust-too-low`. | [p.13] |
| WIND-06 | Unobservable parts use solidi (`/////KT`, `210//KT`): value `null`. | [p.18] |
| WIND-07 | `00000KT` is calm: `calm: true`, direction 0, speed 0. | [EXT] |
| WIND-08 | Three-digit speeds and gusts are accepted. | [EXT] |

Output: `wind: { direction, variable, speed, gust, calm, unit: "kt" }`.
`direction` is `null` when `VRB` or `///`.

### WVAR: wind direction variation

`^(?<from>\d{3})V(?<to>\d{3})$`

| ID | Rule | Source |
|---|---|---|
| WVAR-01 | Total variation over the preceding 10 minutes, from `from` to `to`, clockwise. | [p.13] |
| WVAR-02 | Reported when 60° ≤ variation < 180° and mean speed ≥ 3 kt. The span is computed modulo 360 (`350V100` = 110°). | [p.13, p.20] |

Output: `windVariation: { from, to }`.

### CAVOK

| ID | Rule | Source |
|---|---|---|
| CAVOK-01 | Replaces visibility, RVR, weather and sky groups. | [p.13] |
| CAVOK-02 | Means: visibility ≥ 10 km, no cloud below 1500 m (5000 ft) or the highest minimum sector altitude, whichever is greater, no CB, no TCU, no significant weather. | [p.13] |

Output: `cavok: {} | null`.

### VIS: prevailing visibility

`^(?<value>\d{4}|////)(?<ndv>NDV)?$`

| ID | Rule | Source |
|---|---|---|
| VIS-01 | Prevailing visibility in metres (or minimum, if prevailing cannot be determined). | [p.13] |
| VIS-02 | `9999` means 10 km or more: `meters: 10000, orMore: true`. | [p.13] |
| VIS-03 | `////` means not observed: `meters: null`. | [p.18] |
| VIS-04 | `NDV` suffix means no directional variation can be given. | [EXT] |

Output: `visibility: { meters, orMore, noDirectionalVariation }`.

### MVIS: minimum visibility

`^(?<value>\d{4})(?<direction>N|NE|E|SE|S|SW|W|NW)?$`

| ID | Rule | Source |
|---|---|---|
| MVIS-01 | Only valid right after a prevailing visibility. | [p.14, p.21] |
| MVIS-02 | Direction is one of the eight compass points and is optional (`2000E`, `1200`). | [p.14, p.20, p.21] |

Output: `minimumVisibility: { meters, direction }`.

### RVR: runway visual range

`^R(?<runway>\d{2}[LCR]?)/(?<modifier>[PM])?(?<value>\d{4}|////)(?:V(?<maxModifier>[PM])?(?<max>\d{4}))?(?<tendency>[UDN])?$`

| ID | Rule | Source |
|---|---|---|
| RVR-01 | Runway designator, with optional `L`, `C` or `R` for parallel runways. | [p.14] |
| RVR-02 | Mean value in metres over the preceding 10 minutes. | [p.14] |
| RVR-03 | Tendency: `U` upward, `D` downward, `N` no change. It may be absent (`R35/P2000`). | [p.14, p.21] |
| RVR-04 | `P` means above the highest measurable value; more than 2000 m is `P2000`. | [p.14] |
| RVR-05 | `M` means below the lowest measurable value; less than 50 m is `M0050`. | [p.14] |
| RVR-06 | Several groups may appear, one per runway. | [p.21] |
| RVR-07 | Solidi for unobserved values (`R33/////`): value `null`. | [p.18] |
| RVR-08 | `V` variation between two values is accepted. | [EXT] |

Output: `rvr: [{ runway, meters, modifier: "above"|"below"|null, tendency: "up"|"down"|"none"|null, variation: { meters, modifier } | null }]`.

### WX: present weather

`^(?<qualifier>[-+]|VC)?(?<descriptor>MI|BC|PR|DR|BL|SH|TS|FZ)?(?<phenomena>(?:DZ|RA|SN|SG|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PO|SQ|FC|SS|DS)*)$`

At least one of `descriptor` or `phenomena` must be present, so a bare `+` or
an empty match is not weather. Codes are in section 6.

| ID | Rule | Source |
|---|---|---|
| WX-01 | Built as intensity or proximity, then descriptor, then phenomena. | [p.14, p.16] |
| WX-02 | Up to 3 groups. More: warning `weather.too-many-groups`. | [p.14] |
| WX-03 | No qualifier means moderate. | [p.16] |
| WX-04 | Several phenomena may be chained. The first one predominates (`TSGRRA`: mainly hail). | [p.20] |
| WX-05 | A descriptor can stand alone (`VCTS`, `TS`). | [p.22] |
| WX-06 | `UP` is unknown precipitation, combinable with `FZ` and `TS`. | [p.18] |
| WX-07 | `//` means weather not observed: `notObserved: true`. | [p.18] |
| WX-08 | Table 1 plus `UP` applies to every report. Table 2 is a subset for AUTO reports and is not enforced. | [p.16, p.18] |
| WX-09 | Text says "moderate" only for falling precipitation, so not with `DR` or `BL`. Data keeps `moderate` regardless. "Moderate fog" is not a meaningful phrase. | [EXT] |

Output: `weather: [{ intensity: "light"|"moderate"|"heavy"|null, proximity: boolean, descriptor, phenomena: [], notObserved: boolean }]`.
`intensity` is `null` with `VC` and with `//`.

### SKY: clouds and vertical visibility

- Cloud: `^(?<amount>FEW|SCT|BKN|OVC|///)(?<height>\d{3}|///)(?<cloudType>CB|TCU|///)?$`
- Convective only: `^///(?<convective>CB|TCU)$`
- Vertical visibility: `^VV(?<height>\d{3}|///)$`

| ID | Rule | Source |
|---|---|---|
| SKY-01 | Amount: `FEW` 1-2, `SCT` 3-4, `BKN` 5-7, `OVC` 8 oktas. | [p.14] |
| SKY-02 | Height of the cloud base in hundreds of feet: `heightFt = hhh × 100`. | [p.14] |
| SKY-03 | Type is `CB` (cumulonimbus) or `TCU` (towering cumulus). | [p.14] |
| SKY-04 | Up to 4 cloud groups. More: warning `sky.too-many-layers`. | [p.14, p.22] |
| SKY-05 | `VVhhh` replaces clouds when the sky is obscured. `heightFt = hhh × 100`. | [p.14] |
| SKY-06 | `VV///` means vertical visibility cannot be determined. | [p.14, p.17] |
| SKY-07 | `NSC`: no cloud below the CAVOK reference height, no CB, no TCU, no vertical visibility restriction, and CAVOK is not appropriate. | [p.14] |
| SKY-08 | `NCD`: no clouds detected (automatic systems). | [p.17, p.18] |
| SKY-09 | `SCT023///`: convective cloud exists, but cannot be tied to this layer. `cloudType: "unknown"`. | [p.17, p.18] |
| SKY-10 | `///CB`, `///TCU`: convective cloud with unknown amount and height. | [p.17, p.18] |
| SKY-11 | `//////`: cloud sensor out of order. `sensorFault: true`. | [p.18] |

Output: `sky: { kind: "layers"|"verticalVisibility"|"nsc"|"ncd"|"sensorFault", layers: [{ amount, heightFt, cloudType }], verticalVisibilityFt }`.

### TEMP: temperature and dew point

`^(?<temperature>M?\d{2}|//)/(?<dewPoint>M?\d{2}|//)$`

| ID | Rule | Source |
|---|---|---|
| TEMP-01 | Air temperature and dew point in whole °C. | [p.15] |
| TEMP-02 | `M` means below zero. `M00` is returned as `0`, never `-0`. | [p.15] |
| TEMP-03 | `//` means not observed: `null`. | [p.18] |
| TEMP-04 | Dew point above temperature: warning `temperature.dew-point-above-air`. | [EXT] |

Output: `temperature: { air, dewPoint, unit: "C" }`.

### QNH

`^Q(?<value>\d{4}|////)$`

| ID | Rule | Source |
|---|---|---|
| QNH-01 | QNH rounded down to the whole hectopascal. | [p.15] |
| QNH-02 | `Q////` means not observed: `null`. | [p.18] |

Output: `pressure: { qnh, unit: "hPa" }`.

### RE: recent weather

`RE` followed by a weather group, with no qualifier.

| ID | Rule | Source |
|---|---|---|
| RE-01 | Observed since the last routine report or last hour, whichever is shorter, but not at observation time. | [p.15] |
| RE-02 | Never carries intensity. `RE+RA` goes to `unparsed`. | [p.15] |
| RE-03 | Up to 3 groups. More: warning `recentWeather.too-many-groups`. | [p.15] |
| RE-04 | Known forms: `REFZDZ REFZRA REDZ RESG RERA RESN RESHRA RESHSN RERASN RESHGR RESHGS REPL REBLSN REDS RESS RETS RETSRA RETSSN RETSGR RETSGS REFC REVA REUP REFZUP RETSUP`. Others still parse, as the list is descriptive. | [p.15, p.18] |

Output: `recentWeather: [{ descriptor, phenomena: [] }]`.

### WS: wind shear

Token sequence: `WS R<dd>[LCR]?` or `WS ALL RWY`.

| ID | Rule | Source |
|---|---|---|
| WS-01 | Wind shear in the layer below 500 m. | [p.15] |
| WS-02 | `WS R17` affects a runway's take-off or approach path. | [p.15, p.21] |
| WS-03 | `WS ALL RWY` affects all runways. | [p.15] |

Output: `windShear: { allRunways, runways: [] }`.

## 5. Trailing sections

### TREND: two-hour forecast

```
trend := NOSIG | change
change := (BECMG|TEMPO) time* wind? (visibility|CAVOK)? (weather{0,3}|NSW)? (sky|NSC)?
time := (FM|TL|AT)GGgg
```

| ID | Rule | Source |
|---|---|---|
| TRD-01 | A forecast for the 2 hours after the observation, appended to the report. | [p.19] |
| TRD-02 | `NOSIG`: no significant change expected. | [p.19] |
| TRD-03 | `BECMG`: changes reaching thresholds at a regular or irregular rate. | [p.19] |
| TRD-04 | `TEMPO`: temporary fluctuations, each under 1 h, together under half of the period. | [p.19] |
| TRD-05 | Optional time: `FM` from, `TL` until, `AT` at, with `GGgg` in UTC. | [p.19] |
| TRD-06 | Only groups that change are included. | [p.19] |
| TRD-07 | `NSW`: end of significant weather. | [p.19] |
| TRD-08 | Wind, visibility, weather and sky groups reuse the observation elements. | [p.19] |
| TRD-09 | Several change groups may follow each other. | [EXT] |

Output: `trend: [{ kind: "NOSIG"|"BECMG"|"TEMPO", times: [{ type: "from"|"until"|"at", hour, minute }], wind, visibility, cavok, weather, noSignificantWeather, sky }]`.

### RMK: remarks

| ID | Rule | Source |
|---|---|---|
| RMK-01 | `RMK` opens a national section that lasts to the end of the report. | [p.15] |
| RMK-02 | Kept as normalised text, not decoded. | [p.15] |

Output: `remarks: { text } | null`.

## 6. Weather code tables

Table 1 [p.16], plus `UP` [p.18].

**Qualifier:** `-` light · none moderate · `+` heavy (well developed for dust/sand
whirls and funnel clouds) · `VC` in the vicinity

**Descriptor**

| Code | Meaning |
|---|---|
| MI | Shallow |
| BC | Patches |
| PR | Partial (covering part of the aerodrome) |
| DR | Low drifting (height < 2 m) |
| BL | Blowing (height ≥ 2 m) |
| SH | Shower(s) |
| TS | Thunderstorm |
| FZ | Freezing (supercooled) |

**Precipitation**

| Code | Meaning |
|---|---|
| DZ | Drizzle |
| RA | Rain |
| SN | Snow |
| SG | Snow grains |
| PL | Ice pellets |
| GR | Hail |
| GS | Small hail and/or snow pellets |
| UP | Unknown precipitation (automatic systems) |

**Obscuration**

| Code | Meaning |
|---|---|
| BR | Mist |
| FG | Fog |
| FU | Smoke |
| VA | Volcanic ash |
| DU | Widespread dust |
| SA | Sand |
| HZ | Haze |

**Other**

| Code | Meaning |
|---|---|
| PO | Dust/sand whirls (dust devils) |
| SQ | Squalls |
| FC | Funnel cloud(s) (tornado or waterspout) |
| SS | Sandstorm |
| DS | Duststorm |

## 7. Test vectors

### PDF examples

The expected values are the PDF's own explanations of each example.

| ID | Report | Key expectations |
|---|---|---|
| EX-1 | `METAR COR LEAM 141200Z 21009KT 6000 NSC 24/10 Q1008=` | corrected; 210°/9 kt; 6000 m; NSC; 24/10; 1008 |
| EX-2 | `METAR LEZL 150800Z 06003KT 350V100 6000 2000E R27/0900U PRFG OVC009 13/13 Q1022 NOSIG=` | variation 350-100; min 2000 E; RVR 27 900 m up; fog partial; OVC 900 ft; NOSIG |
| EX-3 | `METAR LEBB 160930Z 03008KT 3000 TSGRRA SCT015TCU BKN022CB 09/06 Q0993 NOSIG=` | TS with GR, RA (GR first); layers TCU and CB |
| EX-4 | `METAR LEST 201230Z 21010G25KT 180V250 2000 1200 R17/1300U R35/P2000 +SHRA FEW010CB SCT017 BKN027 12/07 Q1002 RETS WS R17 BECMG 7000 NSW NSC=` | gust 25; min 1200 no direction; 2 RVR; 3 layers; recent TS; WS R17; BECMG 7000 NSW NSC |
| EX-5 | `SPECI LEPP 050820Z 21015KT 1000 R15/0400U R33/0600U +SHSN FEW015 BKN025CB M03/M04 Q1000=` | SPECI; negative temperatures |
| EX-6 | `METAR LEPP 230200Z AUTO 10002KT 3700 0800NW R33/1800U R15/P2000 –UP BCFG SCT003 BKN008 OVC014 01/01 Q1006=` | AUTO; min 800 NW; `-UP` from en dash; BCFG |
| EX-7 | `METAR LEBG 022230Z AUTO 21017KT 9999 VCTS SCT023/// BKN029/// BKN050/// ///CB 06/05 Q0991=` | 10 km+; VC TS; unknown-type layers; `///CB` |

### Reference example and summary golden

`LELL 282230Z AUTO VRB02KT CAVOK 15/09 Q1017` gives type `METAR` (TYPE-03), auto,
variable wind 2 kt, CAVOK, 15/9, QNH 1017.

Expected summary, one line per block. In phase 2 the ICAO code becomes the airport name.

**ca**
```
Observació a LELL. Dia 28 a les 22:30 UTC. Observació generada automàticament.
Vent variable de 2 kt. Visibilitat de 10 km o més i cap núvol per sota de 5000 ft (1500 m).
Temperatura de 15 °C, punt de rosada a 9 °C.
QNH 1017 hPa.
```

**es**
```
Observación en LELL. Día 28 a las 22:30 UTC. Observación generada automáticamente.
Viento variable de 2 kt. Visibilidad de 10 km o más y ninguna nube por debajo de 5000 ft (1500 m).
Temperatura de 15 °C, punto de rocío a 9 °C.
QNH 1017 hPa.
```

**en**
```
Observation at LELL. Day 28 at 22:30 UTC. Automatically generated observation.
Variable wind at 2 kt. Visibility 10 km or more and no cloud below 5000 ft (1500 m).
Temperature 15 °C, dew point 9 °C.
QNH 1017 hPa.
```

Summary blocks: (1) header, (2) wind, visibility and sky, (3) temperature,
(4) pressure. Weather, RVR, recent weather, wind shear and trend each add their
own sentences to block 2 or their own lines after block 4.

### Edge vectors

| ID | Input | Expected |
|---|---|---|
| EDGE-1 | `METAR LEAM 141200Z NIL=` | `nil` present; no later elements |
| EDGE-2 | `LEAM 141200Z 00000KT 9999 NSC 20/10 Q1020` | calm |
| EDGE-3 | `LEAM 141200Z AUTO /////KT //// // ////// ///// Q////` | wind, visibility, temperature and QNH values `null`; `//` is weather `notObserved` (WX-07); `//////` is `sensorFault`; `/////` is temperature; nothing in `unparsed` |
| EDGE-4 | `LEAM 141200Z 21010G15KT 9999 NSC 20/10 Q1020` | gust parsed; warning `wind.gust-too-low` |
| EDGE-5 | `LEAM 141200Z 21010KT 9999 XYZ123 NSC 20/10 Q1020` | `XYZ123` in `unparsed`; the rest parsed |
| EDGE-6 | `LEAM 141200Z 21010KT 9999 NSC M00/M01 Q1020 RMK AO2 SLP123` | air `0`; dew `-1`; remarks `AO2 SLP123` |
| EDGE-7 | `LEAM 141200Z 21010KT 3000 BR FEW010 15/14 Q1012 TEMPO FM1100 TL1200 1000 FG BKN002 BECMG AT1300 9999 NSW` | two trend groups with their times |
| EDGE-8 | `leam 141200z 21010kt 9999 nsc 20/10 q1020` | same result as upper case |

## 8. Scope notes

### Extensions

Everything tagged `[EXT]`:

| Extension | Reason |
|---|---|
| Type word optional | The project's reference example omits it |
| `00000KT` calm | Very common; the PDF does not describe it |
| Three-digit wind speed | Hurricane-force reports |
| `NDV` suffix | Common on European AUTO reports |
| RVR `V` variation | Allowed by ICAO; absent from the PDF |
| Several trend groups | The PDF's diagram shows one; real reports have more |
| Upper-casing, `TypeError`, range and dew-point warnings | Robustness |

### Out of scope, sent to `unparsed`

- US and other national formats: `SM` visibility, `A2992` altimeter, `SKC`, `CLR`, `MPS`.
- Runway state and sea state groups.
- TAF (PDF pages 24 onward).
- Decoding of `RMK`.

### Notes on the PDF

- The AEMET guide is a summary centred on Spain ("knot is the reporting unit in
  Spain"), not the full ICAO Annex 3 or WMO FM 15 code.
- The AUTO grammar on p.17 has no TREND, but the parser accepts one in any report.
- CAVOK on p.19 omits the minimum sector altitude clause given on p.13. The p.13
  definition applies.
- Pages 13-22 use `[cc]` as optional, and example 4 omits `i` in RVR. Both are
  treated as optional.
