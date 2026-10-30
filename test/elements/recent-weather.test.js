import assert from 'node:assert/strict';
import { test } from 'node:test';
import { recentWeather } from '../../src/elements/recent-weather.js';
import { describeAll, run } from '../helpers.js';

const first = (token) => run(recentWeather, token).data[0];

test('RE-01: reads a recent phenomenon', () => {
  assert.deepEqual(first('RERA'), { raw: 'RERA', descriptor: null, phenomena: ['RA'], notObserved: false });
  assert.deepEqual(describeAll(recentWeather, first('RERA')), {
    en: 'Recent weather: rain.',
    ca: 'Temps recent: pluja.',
    es: 'Tiempo reciente: lluvia.',
  });
});

test('RE-02: never carries intensity', () => {
  for (const token of ['RE+RA', 'RE-RA', 'REVCTS', 'RE']) {
    assert.equal(run(recentWeather, token).data, null, token);
  }
});

test('RE-03: warns above 3 groups', () => {
  assert.deepEqual(run(recentWeather, 'RERA RESN RETS').warnings, []);
  assert.deepEqual(run(recentWeather, 'RERA RESN RETS REFC').warnings, [
    { code: 'recentWeather.too-many-groups', token: 'RERA RESN RETS REFC' },
  ]);
});

test('RE-04: reads every form the guide lists', () => {
  const forms = `REFZDZ REFZRA REDZ RESG RERA RESN RESHRA RESHSN RERASN RESHGR RESHGS REPL
    REBLSN REDS RESS RETS RETSRA RETSSN RETSGR RETSGS REFC REVA REUP REFZUP RETSUP`;
  for (const token of forms.split(/\s+/)) {
    assert.notEqual(run(recentWeather, token).data, null, token);
  }
});

test('RE-05: RE// means not observed', () => {
  assert.deepEqual(first('RE//'), { raw: 'RE//', descriptor: null, phenomena: [], notObserved: true });
  assert.deepEqual(describeAll(recentWeather, first('RE//')), {
    en: 'Recent weather not observed.',
    ca: 'Temps recent no observat.',
    es: 'Tiempo reciente no observado.',
  });
});

test('stops at the first other token', () => {
  const { data, stream } = run(recentWeather, 'RETS WS R17');
  assert.equal(data.length, 1);
  assert.equal(stream.peek(), 'WS');
});
