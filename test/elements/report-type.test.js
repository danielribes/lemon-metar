import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reportType } from '../../src/elements/report-type.js';
import { describeAll, run } from '../helpers.js';

test('TYPE-01: reads METAR and SPECI', () => {
  assert.deepEqual(run(reportType, 'METAR LEAM').data, { type: 'METAR', corrected: false });
  assert.deepEqual(run(reportType, 'SPECI LEAM').data, { type: 'SPECI', corrected: false });
});

test('TYPE-02: COR marks a corrected report', () => {
  assert.deepEqual(run(reportType, 'METAR COR LEAM').data, { type: 'METAR', corrected: true });
  assert.deepEqual(run(reportType, 'SPECI COR LEAM').data, { type: 'SPECI', corrected: true });
  assert.deepEqual(run(reportType, 'COR LEAM').data, { type: 'METAR', corrected: true });
});

test('TYPE-03: no type word gives null and consumes nothing', () => {
  const { data, stream } = run(reportType, 'LEAM 141200Z');
  assert.equal(data, null);
  assert.equal(stream.position, 0);
});

test('describes the report type', () => {
  assert.deepEqual(describeAll(reportType, { type: 'METAR', corrected: false }), {
    en: 'Routine meteorological report (METAR).',
    ca: 'Informe meteorològic ordinari (METAR).',
    es: 'Informe meteorológico ordinario (METAR).',
  });
  assert.equal(
    describeAll(reportType, { type: 'SPECI', corrected: true }).ca,
    'Informe meteorològic especial (SPECI). Informe corregit.',
  );
});
