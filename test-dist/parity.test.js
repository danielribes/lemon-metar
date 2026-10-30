import assert from 'node:assert/strict';
import { test } from 'node:test';
import { airports as distAirports } from '../dist/airports.min.js';
import * as dist from '../dist/lemon-metar.min.js';
import { airports as srcAirports } from '../src/airports/index.js';
import * as src from '../src/index.js';
import { ALL_REPORTS, REFERENCE } from '../test/fixtures/reports.js';

test('dist exports the same API as src', () => {
  assert.deepEqual(Object.keys(dist).sort(), Object.keys(src).sort());
  assert.deepEqual(dist.SUPPORTED_LOCALES, src.SUPPORTED_LOCALES);
  assert.equal(dist.DEFAULT_LOCALE, src.DEFAULT_LOCALE);
});

test('dist gives the same result as src in every language', () => {
  for (const report of ALL_REPORTS) {
    for (const locale of src.SUPPORTED_LOCALES) {
      assert.deepEqual(dist.parseMetar(report, { locale }), src.parseMetar(report, { locale }));
    }
  }
});

test('dist rejects invalid input as src does', () => {
  assert.throws(() => dist.parseMetar(''), TypeError);
});

test('dist airports match src and work with the parser', () => {
  assert.deepEqual(distAirports, srcAirports);
  const options = { locale: 'ca', airports: distAirports };
  assert.deepEqual(
    dist.parseMetar(REFERENCE, options).station,
    src.parseMetar(REFERENCE, { locale: 'ca', airports: srcAirports }).station,
  );
});
