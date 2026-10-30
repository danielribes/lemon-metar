import assert from 'node:assert/strict';
import { test } from 'node:test';
import { windVariation } from '../../src/elements/wind-variation.js';
import { describeAll, run } from '../helpers.js';

test('WVAR-01: reads both limits', () => {
  assert.deepEqual(run(windVariation, '180V250').data, { from: 180, to: 250 });
  assert.equal(run(windVariation, '180250').data, null);
});

test('WVAR-02: accepts a span crossing north', () => {
  assert.deepEqual(run(windVariation, '350V100').data, { from: 350, to: 100 });
});

test('describes the variation', () => {
  assert.deepEqual(describeAll(windVariation, { from: 350, to: 100 }), {
    en: 'Wind direction varying between 350° and 100°.',
    ca: 'Direcció del vent variable entre 350° i 100°.',
    es: 'Dirección del viento variable entre 350° y 100°.',
  });
});
