import assert from 'node:assert/strict';
import { test } from 'node:test';
import { remarks } from '../../src/elements/remarks.js';
import { describeAll, run } from '../helpers.js';

test('RMK-01: lasts to the end of the report', () => {
  const { data, stream } = run(remarks, 'RMK AO2 SLP123 Q1000');
  assert.equal(data.text, 'AO2 SLP123 Q1000');
  assert.equal(stream.done, true);
  assert.equal(run(remarks, 'NOSIG').data, null);
});

test('RMK-02: keeps the text undecoded', () => {
  assert.deepEqual(describeAll(remarks, { text: 'AO2 SLP123' }), {
    en: 'Remarks: AO2 SLP123',
    ca: 'Observacions: AO2 SLP123',
    es: 'Observaciones: AO2 SLP123',
  });
});
