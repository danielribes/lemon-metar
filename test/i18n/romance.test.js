import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adjective, composeWeather, joinList, noun } from '../../src/i18n/romance.js';

const GRAMMAR = {
  conjunction: 'i',
  vicinity: 'a prop',
  phenomena: { RA: noun('pluja', 'f'), DZ: noun('plugim'), GR: noun('granets', 'm', true) },
  intensities: { heavy: adjective('fort forta forts fortes') },
  descriptors: {
    FZ: adjective('gelant gelant gelants gelants'),
    BL: adjective('alt alta alts altes', ' pel vent'),
  },
  heads: { SH: { ...noun('xàfecs', 'm', true), link: 'de' } },
};

const compose = (parts) =>
  composeWeather(GRAMMAR, { intensity: null, proximity: false, descriptor: null, phenomena: [], ...parts });

test('joinList handles any length', () => {
  assert.equal(joinList([], 'i'), '');
  assert.equal(joinList(['a'], 'i'), 'a');
  assert.equal(joinList(['a', 'b'], 'i'), 'a i b');
  assert.equal(joinList(['a', 'b', 'c'], 'i'), 'a, b i c');
});

test('adjectives agree with one noun', () => {
  assert.equal(compose({ phenomena: ['RA'], intensity: 'heavy' }), 'pluja forta');
  assert.equal(compose({ phenomena: ['DZ'], intensity: 'heavy' }), 'plugim fort');
  assert.equal(compose({ phenomena: ['GR'], intensity: 'heavy' }), 'granets forts');
});

test('a list is plural, and masculine unless all nouns are feminine', () => {
  assert.equal(compose({ phenomena: ['RA', 'RA'], intensity: 'heavy' }), 'pluja i pluja fortes');
  assert.equal(compose({ phenomena: ['RA', 'DZ'], intensity: 'heavy' }), 'pluja i plugim forts');
});

test('descriptor adjectives go before intensity, unless they have text after them', () => {
  assert.equal(compose({ phenomena: ['RA'], descriptor: 'FZ', intensity: 'heavy' }), 'pluja gelant forta');
  assert.equal(compose({ phenomena: ['RA'], descriptor: 'BL', intensity: 'heavy' }), 'pluja forta alta pel vent');
});

test('head descriptors take the agreement and the link', () => {
  assert.equal(compose({ phenomena: ['RA'], descriptor: 'SH', intensity: 'heavy' }), 'xàfecs forts de pluja');
  assert.equal(compose({ descriptor: 'SH' }), 'xàfecs');
});

test('proximity goes last', () => {
  assert.equal(compose({ descriptor: 'SH', proximity: true }), 'xàfecs a prop');
});
