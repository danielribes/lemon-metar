import assert from 'node:assert/strict';
import { test } from 'node:test';
import { windShear } from '../../src/elements/wind-shear.js';
import { describeAll, run } from '../helpers.js';

test('WS-01: needs the WS indicator', () => {
  assert.equal(run(windShear, 'R17').data, null);
});

test('WS-02: reads a runway, consuming both tokens', () => {
  const { data, stream } = run(windShear, 'WS R17L BECMG');
  assert.deepEqual(data, { allRunways: false, runways: ['17L'] });
  assert.equal(stream.peek(), 'BECMG');
  assert.deepEqual(describeAll(windShear, { allRunways: false, runways: ['17'] }), {
    en: 'Wind shear on runway 17.',
    ca: 'Cisallament del vent a la pista 17.',
    es: 'Cizalladura del viento en la pista 17.',
  });
});

test('WS-03: reads all runways, consuming the three tokens', () => {
  const { data, stream } = run(windShear, 'WS ALL RWY NOSIG');
  assert.deepEqual(data, { allRunways: true, runways: [] });
  assert.equal(stream.peek(), 'NOSIG');
  assert.deepEqual(describeAll(windShear, data), {
    en: 'Wind shear on all runways.',
    ca: 'Cisallament del vent a totes les pistes.',
    es: 'Cizalladura del viento en todas las pistas.',
  });
});

test('reads repeated groups', () => {
  assert.deepEqual(run(windShear, 'WS R17 WS R35').data.runways, ['17', '35']);
});

test('consumes nothing on an incomplete group', () => {
  for (const text of ['WS', 'WS ALL', 'WS XYZ']) {
    const { data, stream } = run(windShear, text);
    assert.equal(data, null);
    assert.equal(stream.position, 0);
  }
});
