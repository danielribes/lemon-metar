import assert from 'node:assert/strict';
import { test } from 'node:test';
import { observationTime } from '../../src/elements/observation-time.js';
import { describeAll, run } from '../helpers.js';

test('TIME-01: reads day, hour and minute', () => {
  assert.deepEqual(run(observationTime, '282230Z').data, { day: 28, hour: 22, minute: 30 });
});

test('TIME-01: requires the Z suffix', () => {
  assert.equal(run(observationTime, '282230').data, null);
});

test('TIME-02: warns on out of range values', () => {
  for (const token of ['002230Z', '322230Z', '282430Z', '282260Z']) {
    assert.deepEqual(run(observationTime, token).warnings, [{ code: 'time.out-of-range', token }]);
  }
  assert.deepEqual(run(observationTime, '312359Z').warnings, []);
});

test('TIME-03: gives no absolute date', () => {
  assert.deepEqual(Object.keys(run(observationTime, '282230Z').data), ['day', 'hour', 'minute']);
});

test('describes the time, with zero padding', () => {
  assert.deepEqual(describeAll(observationTime, { day: 28, hour: 22, minute: 30 }), {
    en: 'Day 28 at 22:30 UTC.',
    ca: 'Dia 28 a les 22:30 UTC.',
    es: 'Día 28 a las 22:30 UTC.',
  });
  assert.equal(describeAll(observationTime, { day: 2, hour: 7, minute: 5 }).en, 'Day 2 at 07:05 UTC.');
});

test('uses the singular article for one o’clock', () => {
  const { ca, es } = describeAll(observationTime, { day: 2, hour: 1, minute: 30 });
  assert.equal(ca, 'Dia 2 a la 01:30 UTC.');
  assert.equal(es, 'Día 2 a la 01:30 UTC.');
});
