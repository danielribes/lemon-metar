import assert from 'node:assert/strict';
import { test } from 'node:test';
import { REPORT_ELEMENTS } from '../../src/elements/index.js';

test('every element fulfils the contract', () => {
  for (const element of REPORT_ELEMENTS) {
    assert.equal(typeof element.id, 'string');
    assert.equal(typeof element.parse, 'function', element.id);
    assert.equal(typeof element.describe, 'function', element.id);
  }
});

test('elements follow report order', () => {
  assert.deepEqual(REPORT_ELEMENTS.map((element) => element.id), [
    'reportType', 'station', 'time', 'nil', 'auto', 'wind', 'windVariation', 'cavok', 'visibility',
    'minimumVisibility', 'rvr', 'weather', 'sky', 'temperature', 'pressure', 'recentWeather',
    'windShear', 'trend', 'remarks',
  ]);
});
