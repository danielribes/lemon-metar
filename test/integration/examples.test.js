import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodeMetar, parseMetar } from '../../src/index.js';
import { EX_1, EX_2, EX_3, EX_4, EX_5, EX_6, EX_7, REFERENCE } from '../fixtures/reports.js';

const layers = (report) => report.sky.layers.map((layer) => [layer.amount, layer.heightFt, layer.cloudType]);

function decode(input) {
  const report = decodeMetar(input);
  assert.deepEqual(report.unparsed, [], 'all tokens are understood');
  assert.deepEqual(report.warnings, [], 'no rule is broken');
  return report;
}

test('EX-1: corrected METAR without trend', () => {
  const report = decode(EX_1);
  assert.equal(report.reportType.type, 'METAR');
  assert.equal(report.reportType.corrected, true);
  assert.equal(report.station.icao, 'LEAM');
  assert.deepEqual([report.time.day, report.time.hour, report.time.minute], [14, 12, 0]);
  assert.deepEqual([report.wind.direction, report.wind.speed], [210, 9]);
  assert.equal(report.visibility.meters, 6000);
  assert.equal(report.sky.kind, 'nsc');
  assert.deepEqual([report.temperature.air, report.temperature.dewPoint], [24, 10]);
  assert.equal(report.pressure.qnh, 1008);
  assert.deepEqual(report.trend, []);
});

test('EX-2: wind variation, minimum visibility, RVR and NOSIG', () => {
  const report = decode(EX_2);
  assert.deepEqual([report.windVariation.from, report.windVariation.to], [350, 100]);
  assert.deepEqual([report.minimumVisibility.meters, report.minimumVisibility.direction], [2000, 'E']);
  assert.deepEqual(
    [report.rvr[0].runway, report.rvr[0].meters, report.rvr[0].tendency],
    ['27', 900, 'up'],
  );
  assert.equal(report.weather[0].descriptor, 'PR');
  assert.deepEqual(report.weather[0].phenomena, ['FG']);
  assert.deepEqual(layers(report), [['OVC', 900, null]]);
  assert.equal(report.trend[0].kind, 'NOSIG');
});

test('EX-3: predominant phenomenon goes first', () => {
  const report = decode(EX_3);
  assert.equal(report.weather[0].descriptor, 'TS');
  assert.deepEqual(report.weather[0].phenomena, ['GR', 'RA']);
  assert.deepEqual(layers(report), [['SCT', 1500, 'TCU'], ['BKN', 2200, 'CB']]);
});

test('EX-4: full METAR with trend', () => {
  const report = decode(EX_4);
  assert.equal(report.wind.gust, 25);
  assert.deepEqual([report.windVariation.from, report.windVariation.to], [180, 250]);
  assert.deepEqual([report.visibility.meters, report.minimumVisibility.meters], [2000, 1200]);
  assert.equal(report.minimumVisibility.direction, null);
  assert.deepEqual(report.rvr.map((group) => group.runway), ['17', '35']);
  assert.equal(report.rvr[1].modifier, 'above');
  assert.equal(report.weather[0].intensity, 'heavy');
  assert.equal(report.sky.layers.length, 3);
  assert.equal(report.recentWeather[0].descriptor, 'TS');
  assert.deepEqual(report.windShear.runways, ['17']);

  const [change] = report.trend;
  assert.equal(change.kind, 'BECMG');
  assert.equal(change.visibility.meters, 7000);
  assert.equal(change.noSignificantWeather, true);
  assert.equal(change.sky.kind, 'nsc');
});

test('EX-5: SPECI with negative temperatures', () => {
  const report = decode(EX_5);
  assert.equal(report.reportType.type, 'SPECI');
  assert.deepEqual([report.temperature.air, report.temperature.dewPoint], [-3, -4]);
  assert.equal(report.rvr.length, 2);
  assert.deepEqual(layers(report), [['FEW', 1500, null], ['BKN', 2500, 'CB']]);
});

test('EX-6: METAR AUTO, with the en dash of the PDF', () => {
  const report = decode(EX_6);
  assert.equal(report.auto.raw, 'AUTO');
  assert.deepEqual([report.minimumVisibility.meters, report.minimumVisibility.direction], [800, 'NW']);
  assert.equal(report.weather[0].intensity, 'light');
  assert.deepEqual(report.weather[0].phenomena, ['UP']);
  assert.equal(report.weather[1].descriptor, 'BC');
  assert.equal(report.sky.layers.length, 3);
});

test('EX-7: METAR AUTO with unknown convective cloud', () => {
  const report = decode(EX_7);
  assert.equal(report.visibility.orMore, true);
  assert.equal(report.weather[0].proximity, true);
  assert.deepEqual(layers(report), [
    ['SCT', 2300, 'unknown'],
    ['BKN', 2900, 'unknown'],
    ['BKN', 5000, 'unknown'],
    [null, null, 'CB'],
  ]);
});

test('reference example decodes', () => {
  const report = decode(REFERENCE);
  assert.equal(report.reportType.type, 'METAR');
  assert.equal(report.reportType.raw, null);
  assert.ok(report.auto);
  assert.equal(report.wind.variable, true);
  assert.ok(report.cavok);
  assert.equal(report.visibility, null);
});

test('reference summary in Catalan', () => {
  assert.equal(parseMetar(REFERENCE, { locale: 'ca' }).summary, [
    'Observació a LELL. Dia 28 a les 22:30 UTC. Observació generada automàticament.',
    'Vent variable de 2 kt. Visibilitat de 10 km o més i cap núvol per sota de 5000 ft (1500 m).',
    'Temperatura de 15 °C, punt de rosada a 9 °C.',
    'QNH 1017 hPa.',
  ].join('\n'));
});

test('reference summary in Spanish', () => {
  assert.equal(parseMetar(REFERENCE, { locale: 'es' }).summary, [
    'Observación en LELL. Día 28 a las 22:30 UTC. Observación generada automáticamente.',
    'Viento variable de 2 kt. Visibilidad de 10 km o más y ninguna nube por debajo de 5000 ft (1500 m).',
    'Temperatura de 15 °C, punto de rocío a 9 °C.',
    'QNH 1017 hPa.',
  ].join('\n'));
});

test('reference summary in English', () => {
  assert.equal(parseMetar(REFERENCE, { locale: 'en' }).summary, [
    'Observation at LELL. Day 28 at 22:30 UTC. Automatically generated observation.',
    'Variable wind at 2 kt. Visibility 10 km or more and no cloud below 5000 ft (1500 m).',
    'Temperature 15 °C, dew point 9 °C.',
    'QNH 1017 hPa.',
  ].join('\n'));
});

test('full report summary reads in order', () => {
  assert.equal(parseMetar(EX_4, { locale: 'en' }).summary, [
    'Observation at LEST. Day 20 at 12:30 UTC.',
    'Wind from 210° at 10 kt, gusting to 25 kt. Wind direction varying between 180° and 250°. '
      + 'Visibility 2000 m. Minimum visibility 1200 m. RVR on runway 17: 1300 m, rising. '
      + 'RVR on runway 35: above 2000 m. Heavy showers of rain. '
      + 'Few clouds (1-2 oktas) at 1000 ft (cumulonimbus); scattered clouds (3-4 oktas) at 1700 ft; '
      + 'broken clouds (5-7 oktas) at 2700 ft.',
    'Temperature 12 °C, dew point 7 °C.',
    'QNH 1002 hPa.',
    'Recent weather: thunderstorm.',
    'Wind shear on runway 17.',
    'Forecast, becoming: Visibility 7000 m. End of significant weather. No significant cloud.',
  ].join('\n'));
});

test('every example has a complete summary in every language', () => {
  for (const input of [EX_1, EX_2, EX_3, EX_4, EX_5, EX_6, EX_7, REFERENCE]) {
    for (const locale of ['en', 'ca', 'es']) {
      assert.doesNotMatch(parseMetar(input, { locale }).summary, /undefined|null|false/);
    }
  }
});
