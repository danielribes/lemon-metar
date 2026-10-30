import assert from 'node:assert/strict';
import { test } from 'node:test';
import { wind } from '../../src/elements/wind.js';
import { describeAll, run } from '../helpers.js';

test('WIND-01: reads the direction', () => {
  assert.equal(run(wind, '21009KT').data.direction, 210);
});

test('WIND-02: VRB is variable, with no direction', () => {
  const { data } = run(wind, 'VRB02KT');
  assert.equal(data.variable, true);
  assert.equal(data.direction, null);
  assert.equal(data.speed, 2);
});

test('WIND-03: reads the speed in knots', () => {
  const { data } = run(wind, '21009KT');
  assert.equal(data.speed, 9);
  assert.equal(data.unit, 'kt');
  assert.equal(data.gust, null);
});

test('WIND-04: reads the gust', () => {
  assert.equal(run(wind, '21010G25KT').data.gust, 25);
});

test('WIND-05: warns when gust is below speed + 10', () => {
  assert.deepEqual(run(wind, '21010G15KT').warnings, [{ code: 'wind.gust-too-low', token: '21010G15KT' }]);
  assert.deepEqual(run(wind, '21010G20KT').warnings, []);
});

test('WIND-06: solidi give null values', () => {
  assert.deepEqual(
    [run(wind, '/////KT').data.direction, run(wind, '/////KT').data.speed],
    [null, null],
  );
  assert.equal(run(wind, '210//KT').data.speed, null);
  assert.equal(run(wind, '///10KT').data.direction, null);
});

test('WIND-07: 00000KT is calm', () => {
  const { data } = run(wind, '00000KT');
  assert.equal(data.calm, true);
  assert.equal(data.direction, 0);
  assert.equal(data.speed, 0);
  assert.equal(run(wind, '21009KT').data.calm, false);
});

test('WIND-08: accepts three-digit speeds and gusts', () => {
  const { data } = run(wind, '270105G130KT');
  assert.equal(data.speed, 105);
  assert.equal(data.gust, 130);
});

test('WIND-09: reads metres per second, unconverted', () => {
  const { data } = run(wind, '03005MPS');
  assert.equal(data.direction, 30);
  assert.equal(data.speed, 5);
  assert.equal(data.unit, 'mps');
  assert.equal(run(wind, 'VRB02MPS').data.variable, true);
  assert.equal(run(wind, '00000MPS').data.calm, true);
  assert.equal(run(wind, '/////MPS').data.speed, null);
});

test('WIND-05: the gust margin in metres per second is 5', () => {
  assert.deepEqual(run(wind, '21005G10MPS').warnings, []);
  assert.deepEqual(run(wind, '21005G09MPS').warnings, [{ code: 'wind.gust-too-low', token: '21005G09MPS' }]);
});

test('WIND-09: texts use the reported unit', () => {
  const texts = (token) => describeAll(wind, run(wind, token).data);

  assert.deepEqual(texts('21005G10MPS'), {
    en: 'Wind from 210° at 5 m/s, gusting to 10 m/s.',
    ca: 'Vent de 210° a 5 m/s amb ratxes de 10 m/s.',
    es: 'Viento de 210° a 5 m/s con rachas de 10 m/s.',
  });
  assert.equal(texts('VRB02MPS').ca, 'Vent variable de 2 m/s.');
});

test('rejects tokens that are not wind', () => {
  for (const token of ['21010', 'VRB2KT', '2101KT', '21009KMH']) {
    assert.equal(run(wind, token).data, null);
  }
});

test('describes wind in every form', () => {
  const texts = (token) => describeAll(wind, run(wind, token).data);

  assert.deepEqual(texts('VRB02KT'), {
    en: 'Variable wind at 2 kt.',
    ca: 'Vent variable de 2 kt.',
    es: 'Viento variable de 2 kt.',
  });
  assert.deepEqual(texts('21010G25KT'), {
    en: 'Wind from 210° at 10 kt, gusting to 25 kt.',
    ca: 'Vent de 210° a 10 kt amb ratxes de 25 kt.',
    es: 'Viento de 210° a 10 kt con rachas de 25 kt.',
  });
  assert.deepEqual(texts('00000KT'), { en: 'Calm wind.', ca: 'Vent en calma.', es: 'Viento en calma.' });
  assert.equal(texts('/////KT').ca, 'Vent no disponible.');
  assert.equal(texts('210//KT').en, 'Wind from 210°, speed not available.');
  assert.equal(texts('///10KT').es, 'Viento de 10 kt, dirección no disponible.');
});
