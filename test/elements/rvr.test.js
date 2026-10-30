import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rvr } from '../../src/elements/rvr.js';
import { describeAll, run } from '../helpers.js';

const first = (token) => run(rvr, token).data[0];

test('RVR-01: reads the runway with optional side', () => {
  assert.equal(first('R27/0900U').runway, '27');
  assert.equal(first('R06L/0900U').runway, '06L');
  assert.equal(first('R06C/0900U').runway, '06C');
  assert.equal(first('R06R/0900U').runway, '06R');
});

test('RVR-02: reads the mean value', () => {
  assert.equal(first('R27/0900U').meters, 900);
});

test('RVR-03: reads the tendency, which may be absent', () => {
  assert.equal(first('R27/0900U').tendency, 'up');
  assert.equal(first('R27/0900D').tendency, 'down');
  assert.equal(first('R27/0900N').tendency, 'none');
  assert.equal(first('R35/P2000').tendency, null);
});

test('RVR-04: P means above', () => {
  const group = first('R35/P2000');
  assert.equal(group.meters, 2000);
  assert.equal(group.modifier, 'above');
});

test('RVR-05: M means below', () => {
  const group = first('R35/M0050');
  assert.equal(group.meters, 50);
  assert.equal(group.modifier, 'below');
});

test('RVR-06: reads several groups, stopping at the first other token', () => {
  const { data, stream } = run(rvr, 'R15/0400U R33/0600U +SHSN');
  assert.deepEqual(data.map((group) => group.runway), ['15', '33']);
  assert.equal(stream.peek(), '+SHSN');
});

test('RVR-07: solidi give null', () => {
  assert.equal(first('R33/////').meters, null);
});

test('RVR-08: reads a variation', () => {
  assert.deepEqual(first('R06L/0800VP1200U').variation, { meters: 1200, modifier: 'above' });
  assert.deepEqual(first('R06L/0800V1200').variation, { meters: 1200, modifier: null });
  assert.equal(first('R06L/0800U').variation, null);
});

test('keeps the raw token and returns null on other tokens', () => {
  assert.equal(first('R27/0900U').raw, 'R27/0900U');
  assert.equal(run(rvr, 'R27/90U').data, null);
});

test('describes RVR', () => {
  const texts = (token) => describeAll(rvr, first(token));

  assert.deepEqual(texts('R27/0900U'), {
    en: 'RVR on runway 27: 900 m, rising.',
    ca: 'RVR a la pista 27: 900 m, en augment.',
    es: 'RVR en la pista 27: 900 m, en aumento.',
  });
  assert.deepEqual(texts('R35/P2000'), {
    en: 'RVR on runway 35: above 2000 m.',
    ca: 'RVR a la pista 35: més de 2000 m.',
    es: 'RVR en la pista 35: más de 2000 m.',
  });
  assert.equal(texts('R35/M0050D').ca, 'RVR a la pista 35: menys de 50 m, en disminució.');
  assert.equal(texts('R35/0800N').es, 'RVR en la pista 35: 800 m, sin cambios.');
  assert.equal(texts('R06L/0800V1200U').en, 'RVR on runway 06L: between 800 m and 1200 m, rising.');
  assert.equal(texts('R33/////').ca, 'RVR a la pista 33 no disponible.');
});
