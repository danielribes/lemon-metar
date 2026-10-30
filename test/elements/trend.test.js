import assert from 'node:assert/strict';
import { test } from 'node:test';
import { trend } from '../../src/elements/trend.js';
import { describeAll, run } from '../helpers.js';

const first = (text) => run(trend, text).data[0];
const texts = (text) => describeAll(trend, first(text));

test('TRD-01: returns null on anything else', () => {
  assert.equal(run(trend, 'RMK').data, null);
});

test('TRD-02: reads NOSIG', () => {
  assert.equal(first('NOSIG').kind, 'NOSIG');
  assert.deepEqual(texts('NOSIG'), {
    en: 'No significant change expected in the next 2 hours.',
    ca: 'Cap canvi significatiu previst en les pròximes 2 hores.',
    es: 'Sin cambios significativos previstos en las próximas 2 horas.',
  });
});

test('TRD-03: reads BECMG', () => {
  assert.equal(first('BECMG 7000').kind, 'BECMG');
  assert.equal(texts('BECMG 7000').en, 'Forecast, becoming: Visibility 7000 m.');
});

test('TRD-04: reads TEMPO', () => {
  assert.equal(first('TEMPO 1000').kind, 'TEMPO');
  assert.equal(texts('TEMPO 1000').ca, 'Previsió, temporalment: Visibilitat de 1000 m.');
});

test('TRD-05: reads the time groups', () => {
  assert.deepEqual(first('TEMPO FM1100 TL1230 1000').times, [
    { type: 'from', hour: 11, minute: 0 },
    { type: 'until', hour: 12, minute: 30 },
  ]);
  assert.deepEqual(first('BECMG AT1300 9999').times, [{ type: 'at', hour: 13, minute: 0 }]);
  assert.deepEqual(texts('TEMPO FM1100 TL0130 AT0200 1000'), {
    en: 'Forecast, temporarily from 11:00 UTC until 01:30 UTC at 02:00 UTC: Visibility 1000 m.',
    ca: 'Previsió, temporalment des de les 11:00 UTC fins a la 01:30 UTC a les 02:00 UTC: Visibilitat de 1000 m.',
    es: 'Previsión, temporalmente desde las 11:00 UTC hasta la 01:30 UTC a las 02:00 UTC: Visibilidad de 1000 m.',
  });
});

test('TRD-06: only present groups are set', () => {
  const change = first('BECMG 7000');
  assert.equal(change.wind, null);
  assert.equal(change.sky, null);
  assert.deepEqual(change.weather, []);
  assert.equal(change.raw, 'BECMG 7000');
});

test('TRD-07: reads NSW', () => {
  assert.equal(first('BECMG NSW').noSignificantWeather, true);
  assert.equal(texts('BECMG NSW').ca, 'Previsió, canvi progressiu: Fi dels fenòmens significatius.');
});

test('TRD-08: reuses wind, visibility, weather and sky', () => {
  const change = first('TEMPO 25015G30KT 3000 +TSRA BKN015CB');
  assert.equal(change.wind.gust, 30);
  assert.equal(change.visibility.meters, 3000);
  assert.equal(change.weather[0].intensity, 'heavy');
  assert.equal(change.sky.layers[0].cloudType, 'CB');
  assert.equal(
    texts('TEMPO 25015G30KT 3000 +TSRA BKN015CB').es,
    'Previsión, temporalmente: Viento de 250° a 15 kt con rachas de 30 kt. Visibilidad de 3000 m. '
      + 'Tormenta fuerte con lluvia. Nubes fragmentadas (5-7 octas) a 1500 ft (cumulonimbus).',
  );
  assert.equal(first('BECMG CAVOK').cavok.raw, 'CAVOK');
  assert.equal(first('BECMG CAVOK').visibility, null);
  assert.match(texts('BECMG CAVOK').en, /Visibility 10 km or more and no cloud/);
  assert.equal(first('BECMG NSC').sky.kind, 'nsc');
});

test('TRD-09: reads several change groups', () => {
  const { data, stream } = run(trend, 'TEMPO 1000 BECMG 9999 RMK AO2');
  assert.deepEqual(data.map((change) => change.kind), ['TEMPO', 'BECMG']);
  assert.equal(data[0].raw, 'TEMPO 1000');
  assert.equal(stream.peek(), 'RMK');
});

test('a change with no groups still describes itself', () => {
  assert.equal(texts('BECMG').en, 'Forecast, becoming.');
});
