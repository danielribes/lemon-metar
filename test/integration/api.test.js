import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  decodeMetar,
  describeMetar,
  parseMetar,
} from '../../src/index.js';

const REPORT = 'LELL 282230Z AUTO VRB02KT CAVOK 15/09 Q1017';

test('TOK-06: raw keeps the input as received, trimmed', () => {
  assert.equal(decodeMetar(`  lell   282230Z= `).raw, 'lell   282230Z=');
});

test('decodeMetar has no language', () => {
  const report = decodeMetar(REPORT);
  assert.equal(report.summary, undefined);
  assert.equal(report.wind.description, undefined);
  assert.equal(report.locale, undefined);
});

test('describeMetar gives another language without parsing again', () => {
  const decoded = decodeMetar(REPORT);
  assert.equal(describeMetar(decoded, { locale: 'ca' }).wind.description, 'Vent variable de 2 kt.');
  assert.equal(describeMetar(decoded, { locale: 'es' }).wind.description, 'Viento variable de 2 kt.');
});

test('describeMetar does not change the decoded report', () => {
  const decoded = decodeMetar(REPORT);
  const snapshot = structuredClone(decoded);
  describeMetar(decoded, { locale: 'ca' });
  assert.deepEqual(decoded, snapshot);
});

test('parseMetar uses the default locale', () => {
  const report = parseMetar(REPORT);
  assert.equal(report.locale, DEFAULT_LOCALE);
  assert.equal(report.wind.description, 'Variable wind at 2 kt.');
});

test('parseMetar reports the resolved locale', () => {
  assert.equal(parseMetar(REPORT, { locale: 'fr' }).locale, 'en');
  assert.equal(parseMetar(REPORT, { locale: 'ca-ES' }).locale, 'ca');
});

test('every element present carries raw and description', () => {
  const report = parseMetar(
    'SPECI COR LEST 201230Z 21010G25KT 180V250 2000 1200 R17/1300U +SHRA FEW010CB 12/07 Q1002 RETS WS R17 BECMG 7000 RMK X',
    { locale: 'ca' },
  );
  const elements = [
    report.reportType, report.station, report.time, report.wind, report.windVariation,
    report.visibility, report.minimumVisibility, ...report.rvr, ...report.weather, report.sky,
    report.temperature, report.pressure, ...report.recentWeather, report.windShear,
    ...report.trend, report.remarks,
  ];
  for (const element of elements) {
    assert.equal(typeof element.raw, 'string');
    assert.equal(typeof element.description, 'string');
  }
  assert.equal(report.windShear.raw, 'WS R17');
  assert.equal(report.reportType.raw, 'SPECI COR');
});

test('the result is plain JSON', () => {
  const report = parseMetar(REPORT);
  assert.deepEqual(JSON.parse(JSON.stringify(report)), report);
});

test('exports the supported locales', () => {
  assert.deepEqual([...SUPPORTED_LOCALES].sort(), ['ca', 'en', 'es']);
});
