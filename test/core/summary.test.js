import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSummary } from '../../src/core/summary.js';

const element = (description) => ({ description });

test('joins elements of a block with spaces and blocks with new lines', () => {
  const summary = buildSummary({
    station: element('Station.'),
    time: element('Time.'),
    temperature: element('Temperature.'),
    pressure: element('Pressure.'),
  });
  assert.equal(summary, 'Station. Time.\nTemperature.\nPressure.');
});

test('flattens list elements and skips empty blocks', () => {
  const summary = buildSummary({
    wind: null,
    weather: [element('Rain.'), element('Mist.')],
    trend: [],
  });
  assert.equal(summary, 'Rain. Mist.');
});
