import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nil } from '../../src/elements/nil.js';
import { describeAll, run } from '../helpers.js';

test('NIL-01: recognises a missing report', () => {
  assert.deepEqual(run(nil, 'NIL').data, {});
  assert.equal(run(nil, 'AUTO').data, null);
});

test('NIL-02: is terminal', () => {
  assert.equal(nil.terminal, true);
});

test('describes a missing report', () => {
  assert.deepEqual(describeAll(nil, {}), {
    en: 'Report missing.',
    ca: 'Informe no disponible.',
    es: 'Informe no disponible.',
  });
});
