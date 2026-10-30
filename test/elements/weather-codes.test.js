import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PHENOMENA, hasPrecipitation, splitPhenomena } from '../../src/elements/weather-codes.js';

test('splits phenomena keeping report order', () => {
  assert.deepEqual(splitPhenomena('GRRA'), ['GR', 'RA']);
  assert.deepEqual(splitPhenomena(''), []);
});

test('tells precipitation from other phenomena', () => {
  assert.equal(hasPrecipitation(['FG', 'RA']), true);
  assert.equal(hasPrecipitation(['FG']), false);
  assert.equal(hasPrecipitation([]), false);
});

test('holds the 20 phenomena of the tables', () => {
  assert.equal(new Set(PHENOMENA).size, 20);
});
