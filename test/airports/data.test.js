import assert from 'node:assert/strict';
import { test } from 'node:test';
import { airports } from '../../src/airports/index.js';
import { decodeMetar, parseMetar } from '../../src/index.js';

const { names, translations } = airports;
const REPORT = 'LELL 282230Z AUTO VRB02KT CAVOK 15/09 Q1017';
const SPAIN = /^(LE|GC|GE)/;

test('holds the expected data', () => {
  const codes = Object.keys(names);
  assert.ok(codes.length > 5000);
  assert.deepEqual(codes, [...codes].sort());
  for (const [code, name] of Object.entries(names)) {
    assert.match(code, /^[A-Z][A-Z0-9]{3}$/);
    assert.ok(name.trim().length > 0, code);
  }
});

test('every code can be read as a station', () => {
  for (const code of Object.keys(names).slice(0, 500)) {
    assert.equal(decodeMetar(`${code} 141200Z`).station.icao, code);
  }
});

test('finds the airports of the reference reports', () => {
  assert.equal(names.LELL, 'Sabadell Airfield');
  assert.equal(names.LEZL, 'Seville Airport');
});

test('AIR-06: every airport of Spain is translated', () => {
  const spanish = Object.keys(names).filter((code) => SPAIN.test(code));
  assert.ok(spanish.length > 60);
  assert.deepEqual(spanish.filter((code) => !translations[code]), []);
});

test('AIR-06: every translation matches a known airport, in both languages', () => {
  for (const [code, name] of Object.entries(translations)) {
    assert.ok(names[code], code);
    assert.ok(name.ca, code);
    assert.ok(name.es, code);
  }
});

test('AIR-07: translated names start with a known kind of place', () => {
  for (const [code, { ca, es }] of Object.entries(translations)) {
    assert.match(ca, /^(Aeroport|Aeròdrom|Heliport|Base) /, code);
    assert.match(es, /^(Aeropuerto|Aeródromo|Helipuerto|Base) /, code);
  }
});

test('works with the parser in every language', () => {
  const stationIn = (locale) => parseMetar(REPORT, { locale, airports }).station.description;

  assert.equal(stationIn('ca'), "Observació a l'Aeroport de Sabadell (LELL).");
  assert.equal(stationIn('es'), 'Observación en el Aeropuerto de Sabadell (LELL).');
  assert.equal(stationIn('en'), 'Observation at Sabadell Airfield (LELL).');
});

test('airports outside Spain keep their name', () => {
  const { station } = parseMetar('EGLL 282230Z', { locale: 'ca', airports });
  assert.equal(station.name, 'London Heathrow Airport');
  assert.equal(station.translated, false);
  assert.equal(station.description, 'Observació a London Heathrow Airport (EGLL).');
});
