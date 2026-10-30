import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cavok } from '../../src/elements/cavok.js';
import { describeAll, run } from '../helpers.js';

test('CAVOK-01: recognises the code word', () => {
  assert.deepEqual(run(cavok, 'CAVOK').data, {});
  assert.equal(run(cavok, '9999').data, null);
});

test('CAVOK-02: describes its meaning', () => {
  assert.deepEqual(describeAll(cavok, {}), {
    en: 'Visibility 10 km or more and no cloud below 5000 ft (1500 m).',
    ca: 'Visibilitat de 10 km o més i cap núvol per sota de 5000 ft (1500 m).',
    es: 'Visibilidad de 10 km o más y ninguna nube por debajo de 5000 ft (1500 m).',
  });
});
