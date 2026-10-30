import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodeMetar, parseMetar } from '../../src/index.js';

test('EDGE-1: NIL report', () => {
  const report = decodeMetar('METAR LEAM 141200Z NIL=');
  assert.ok(report.nil);
  assert.equal(report.wind, null);
  assert.deepEqual(report.unparsed, []);
  assert.equal(parseMetar('LEAM 141200Z NIL', { locale: 'ca' }).summary,
    'Observació a LEAM. Dia 14 a les 12:00 UTC. Informe no disponible.');
});

test('NIL-02: trailing tokens go to unparsed', () => {
  const report = decodeMetar('LEAM 141200Z NIL 21010KT');
  assert.equal(report.wind, null);
  assert.deepEqual(report.unparsed, ['21010KT']);
});

test('EDGE-2: calm wind', () => {
  assert.equal(decodeMetar('LEAM 141200Z 00000KT 9999 NSC 20/10 Q1020').wind.calm, true);
});

test('EDGE-3: automatic report with every value missing', () => {
  const report = decodeMetar('LEAM 141200Z AUTO /////KT //// // ////// ///// Q////');
  assert.equal(report.wind.speed, null);
  assert.equal(report.visibility.meters, null);
  assert.equal(report.weather[0].notObserved, true);
  assert.equal(report.sky.kind, 'sensorFault');
  assert.equal(report.temperature.air, null);
  assert.equal(report.pressure.qnh, null);
  assert.deepEqual(report.unparsed, []);
});

test('EDGE-4: gust rule keeps the value and warns', () => {
  const report = decodeMetar('LEAM 141200Z 21010G15KT 9999 NSC 20/10 Q1020');
  assert.equal(report.wind.gust, 15);
  assert.deepEqual(report.warnings, [{ code: 'wind.gust-too-low', token: '21010G15KT' }]);
});

test('EDGE-5: unknown token does not stop parsing', () => {
  const report = decodeMetar('LEAM 141200Z 21010KT 9999 XYZ123 NSC 20/10 Q1020');
  assert.deepEqual(report.unparsed, ['XYZ123']);
  assert.equal(report.sky.kind, 'nsc');
  assert.equal(report.pressure.qnh, 1020);
});

test('EDGE-6: M00 and remarks', () => {
  const report = decodeMetar('LEAM 141200Z 21010KT 9999 NSC M00/M01 Q1020 RMK AO2 SLP123');
  assert.equal(report.temperature.air, 0);
  assert.equal(report.temperature.dewPoint, -1);
  assert.equal(report.remarks.text, 'AO2 SLP123');
  assert.equal(report.remarks.raw, 'RMK AO2 SLP123');
});

test('EDGE-7: several trend groups', () => {
  const report = decodeMetar(
    'LEAM 141200Z 21010KT 3000 BR FEW010 15/14 Q1012 TEMPO FM1100 TL1200 1000 FG BKN002 BECMG AT1300 9999 NSW',
  );
  assert.deepEqual(report.unparsed, []);
  assert.deepEqual(report.trend.map((change) => change.kind), ['TEMPO', 'BECMG']);
  assert.equal(report.trend[0].times.length, 2);
  assert.equal(report.trend[1].times[0].type, 'at');
  assert.equal(report.trend[1].noSignificantWeather, true);
});

test('EDGE-8: lower case input', () => {
  const lower = decodeMetar('leam 141200z 21010kt 9999 nsc 20/10 q1020');
  const upper = decodeMetar('LEAM 141200Z 21010KT 9999 NSC 20/10 Q1020');
  assert.deepEqual({ ...lower, raw: '' }, { ...upper, raw: '' });
});

test('WIND-09: real report with wind in metres per second', () => {
  const report = parseMetar('UAAH 301400Z 03005MPS CAVOK 06/M03 Q1030 NOSIG RMK QFE734/0979', { locale: 'ca' });
  assert.deepEqual(report.unparsed, []);
  assert.equal(report.wind.unit, 'mps');
  assert.equal(report.wind.description, 'Vent de 30° a 5 m/s.');
});

test('WIND-09: the trend reuses metres per second', () => {
  const report = decodeMetar('UAAH 301400Z 03005MPS CAVOK 06/M03 Q1030 TEMPO 09012G18MPS');
  assert.equal(report.trend[0].wind.unit, 'mps');
  assert.deepEqual(report.warnings, []);
});

test('US format tokens land in unparsed', () => {
  const report = decodeMetar('KJFK 141200Z 21010KT 10SM CLR 20/10 A2992');
  assert.deepEqual(report.unparsed, ['10SM', 'CLR', 'A2992']);
  assert.equal(report.temperature.air, 20);
});

test('a report with no station still parses', () => {
  const report = decodeMetar('141200Z 21010KT 20/10 Q1020');
  assert.equal(report.station, null);
  assert.equal(report.wind.speed, 10);
  assert.equal(parseMetar('141200Z 21010KT').summary.includes('undefined'), false);
});
