import assert from 'node:assert/strict';
import { test } from 'node:test';
import { station } from '../../src/elements/station.js';
import { describeAll, run } from '../helpers.js';

const report = (type, corrected) => ({ reportType: { type, corrected } });

test('STN-01: reads the ICAO indicator', () => {
  assert.deepEqual(run(station, 'LELL 282230Z').data, { icao: 'LELL' });
  assert.deepEqual(run(station, 'K2B3').data, { icao: 'K2B3' });
});

test('STN-01: rejects anything else', () => {
  for (const token of ['LEL', 'LELLL', '6000', '282230Z']) {
    assert.equal(run(station, token).data, null);
  }
});

test('STN-02: reports the code, not an airport name', () => {
  assert.deepEqual(describeAll(station, { icao: 'LELL' }, report('METAR', false)), {
    en: 'Observation at LELL.',
    ca: 'Observació a LELL.',
    es: 'Observación en LELL.',
  });
});

test('STN-04: a known name goes with its code, untranslated', () => {
  const data = { icao: 'LELL', name: 'Sabadell Airfield' };
  assert.deepEqual(describeAll(station, data, report('METAR', false)), {
    en: 'Observation at Sabadell Airfield (LELL).',
    ca: 'Observació a Sabadell Airfield (LELL).',
    es: 'Observación en Sabadell Airfield (LELL).',
  });
});

test('STN-06: translated names take their article', () => {
  const texts = (name) => describeAll(station, { icao: 'LELL', name, translated: true }, report('METAR', false));

  assert.equal(texts('Aeroport de Sabadell').ca, "Observació a l'Aeroport de Sabadell (LELL).");
  assert.equal(texts('Aeropuerto de Sabadell').es, 'Observación en el Aeropuerto de Sabadell (LELL).');
  assert.equal(texts('Base Aèria de Getafe').ca, 'Observació a la Base Aèria de Getafe (LELL).');
  assert.equal(texts('Base Aérea de Getafe').es, 'Observación en la Base Aérea de Getafe (LELL).');
  assert.equal(texts('Heliport de Ceuta').ca, "Observació a l'Heliport de Ceuta (LELL).");
});

test('the text reflects special and corrected reports', () => {
  assert.deepEqual(describeAll(station, { icao: 'LEPP' }, report('SPECI', false)), {
    en: 'Special observation at LEPP.',
    ca: 'Observació especial a LEPP.',
    es: 'Observación especial en LEPP.',
  });
  assert.deepEqual(describeAll(station, { icao: 'LEPP' }, report('SPECI', true)), {
    en: 'Corrected special observation at LEPP.',
    ca: 'Observació especial corregida a LEPP.',
    es: 'Observación especial corregida en LEPP.',
  });
});
