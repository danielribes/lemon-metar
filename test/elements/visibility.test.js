import assert from 'node:assert/strict';
import { test } from 'node:test';
import { visibility } from '../../src/elements/visibility.js';
import { describeAll, run } from '../helpers.js';

test('VIS-01: reads metres', () => {
  assert.deepEqual(run(visibility, '6000').data, { meters: 6000, orMore: false, noDirectionalVariation: false });
  assert.equal(run(visibility, '0000').data.meters, 0);
});

test('VIS-02: 9999 means 10 km or more', () => {
  const { data } = run(visibility, '9999');
  assert.equal(data.meters, 10000);
  assert.equal(data.orMore, true);
});

test('VIS-03: solidi give null', () => {
  assert.equal(run(visibility, '////').data.meters, null);
});

test('VIS-04: reads the NDV suffix', () => {
  const { data } = run(visibility, '9999NDV');
  assert.equal(data.noDirectionalVariation, true);
  assert.equal(data.orMore, true);
});

test('rejects tokens that are not visibility', () => {
  for (const token of ['123', '12345', '0800NW']) {
    assert.equal(run(visibility, token).data, null);
  }
});

test('describes visibility', () => {
  const texts = (token) => describeAll(visibility, run(visibility, token).data);

  assert.deepEqual(texts('6000'), {
    en: 'Visibility 6000 m.',
    ca: 'Visibilitat de 6000 m.',
    es: 'Visibilidad de 6000 m.',
  });
  assert.deepEqual(texts('9999'), {
    en: 'Visibility 10 km or more.',
    ca: 'Visibilitat de 10 km o més.',
    es: 'Visibilidad de 10 km o más.',
  });
  assert.equal(texts('////').ca, 'Visibilitat no disponible.');
  assert.equal(texts('9999NDV').en, 'Visibility 10 km or more, no directional variation available.');
});
