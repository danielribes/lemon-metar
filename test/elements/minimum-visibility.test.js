import assert from 'node:assert/strict';
import { test } from 'node:test';
import { minimumVisibility } from '../../src/elements/minimum-visibility.js';
import { describeAll, run } from '../helpers.js';

const afterVisibility = { visibility: { meters: 6000 } };

test('MVIS-01: requires a prevailing visibility', () => {
  assert.equal(run(minimumVisibility, '1200').data, null);
  assert.deepEqual(run(minimumVisibility, '1200', afterVisibility).data, { meters: 1200, direction: null });
});

test('MVIS-02: reads the eight compass points', () => {
  for (const direction of ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']) {
    assert.equal(run(minimumVisibility, `2000${direction}`, afterVisibility).data.direction, direction);
  }
  assert.equal(run(minimumVisibility, '2000X', afterVisibility).data, null);
});

test('describes minimum visibility', () => {
  assert.deepEqual(describeAll(minimumVisibility, { meters: 2000, direction: 'E' }), {
    en: 'Minimum visibility 2000 m to the east.',
    ca: "Visibilitat mínima de 2000 m cap a l'est.",
    es: 'Visibilidad mínima de 2000 m hacia el este.',
  });
  assert.equal(describeAll(minimumVisibility, { meters: 1200, direction: null }).ca, 'Visibilitat mínima de 1200 m.');
});
