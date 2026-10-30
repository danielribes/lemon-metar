import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pressure } from '../../src/elements/pressure.js';
import { describeAll, run } from '../helpers.js';

test('QNH-01: reads hectopascals', () => {
  assert.deepEqual(run(pressure, 'Q1017').data, { qnh: 1017, unit: 'hPa' });
  assert.equal(run(pressure, 'Q0993').data.qnh, 993);
  assert.equal(run(pressure, 'A2992').data, null);
});

test('QNH-02: solidi give null', () => {
  assert.equal(run(pressure, 'Q////').data.qnh, null);
});

test('describes pressure', () => {
  assert.deepEqual(describeAll(pressure, { qnh: 1017 }), {
    en: 'QNH 1017 hPa.',
    ca: 'QNH 1017 hPa.',
    es: 'QNH 1017 hPa.',
  });
  assert.equal(describeAll(pressure, { qnh: null }).ca, 'QNH no disponible.');
});
