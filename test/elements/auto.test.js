import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auto } from '../../src/elements/auto.js';
import { describeAll, run } from '../helpers.js';

test('AUTO-01: recognises an automated report', () => {
  assert.deepEqual(run(auto, 'AUTO').data, {});
  assert.equal(run(auto, '21009KT').data, null);
});

test('AUTO-01: describes an automated report', () => {
  assert.deepEqual(describeAll(auto, {}), {
    en: 'Automatically generated observation.',
    ca: 'Observació generada automàticament.',
    es: 'Observación generada automáticamente.',
  });
});
