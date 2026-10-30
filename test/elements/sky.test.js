import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sky } from '../../src/elements/sky.js';
import { describeAll, run } from '../helpers.js';

const parsed = (text) => run(sky, text).data;
const texts = (text) => describeAll(sky, parsed(text));

test('SKY-01: reads the amounts', () => {
  for (const amount of ['FEW', 'SCT', 'BKN', 'OVC']) {
    assert.equal(parsed(`${amount}010`).layers[0].amount, amount);
  }
});

test('SKY-02: height is in hundreds of feet', () => {
  assert.equal(parsed('OVC009').layers[0].heightFt, 900);
});

test('SKY-03: reads the cloud type', () => {
  assert.equal(parsed('BKN022CB').layers[0].cloudType, 'CB');
  assert.equal(parsed('SCT015TCU').layers[0].cloudType, 'TCU');
  assert.equal(parsed('SCT015').layers[0].cloudType, null);
});

test('SKY-04: warns above 4 layers', () => {
  assert.deepEqual(run(sky, 'FEW010 SCT020 BKN030 OVC040').warnings, []);
  assert.deepEqual(run(sky, 'FEW010 SCT020 BKN030 BKN040 OVC050').warnings, [
    { code: 'sky.too-many-layers', token: 'FEW010 SCT020 BKN030 BKN040 OVC050' },
  ]);
});

test('SKY-05: reads vertical visibility', () => {
  const data = parsed('VV002');
  assert.equal(data.kind, 'verticalVisibility');
  assert.equal(data.verticalVisibilityFt, 200);
  assert.deepEqual(texts('VV002'), {
    en: 'Vertical visibility 200 ft.',
    ca: 'Visibilitat vertical de 200 ft.',
    es: 'Visibilidad vertical de 200 ft.',
  });
});

test('SKY-06: VV/// cannot be determined', () => {
  assert.equal(parsed('VV///').verticalVisibilityFt, null);
  assert.equal(texts('VV///').ca, 'La visibilitat vertical no es pot determinar.');
});

test('SKY-07: reads NSC', () => {
  assert.equal(parsed('NSC').kind, 'nsc');
  assert.equal(texts('NSC').ca, 'Cap núvol significatiu.');
});

test('SKY-08: reads NCD', () => {
  assert.equal(parsed('NCD').kind, 'ncd');
  assert.equal(texts('NCD').es, 'No se detectan nubes.');
});

test('SKY-09: trailing solidi mean unknown convective type', () => {
  const [layer] = parsed('SCT023///').layers;
  assert.equal(layer.cloudType, 'unknown');
  assert.equal(layer.heightFt, 2300);
  assert.equal(texts('SCT023///').en, 'Scattered clouds (3-4 oktas) at 2300 ft (unidentified convective cloud).');
});

test('SKY-10: reads convective cloud of unknown amount and height', () => {
  const [layer] = parsed('///CB').layers;
  assert.deepEqual(layer, { raw: '///CB', amount: null, heightFt: null, cloudType: 'CB' });
  assert.equal(parsed('///TCU').layers[0].cloudType, 'TCU');
  assert.equal(texts('///CB').ca, 'Cumulonimbus, quantitat i alçada desconegudes.');
});

test('SKY-11: ////// is a sensor fault', () => {
  const data = parsed('//////');
  assert.equal(data.kind, 'sensorFault');
  assert.deepEqual(data.layers, []);
  assert.equal(texts('//////').en, 'Cloud sensor out of order.');
});

test('layers with unknown amount or height', () => {
  assert.equal(parsed('///015').layers[0].amount, null);
  assert.equal(parsed('BKN///').layers[0].heightFt, null);
  assert.equal(texts('///015').ca, 'Núvols en quantitat desconeguda a 1500 ft.');
  assert.equal(texts('BKN///').es, 'Nubes fragmentadas (5-7 octas) a altura desconocida.');
});

test('reads several layers and stops at the first other token', () => {
  const { data, stream } = run(sky, 'FEW015 BKN025CB M03/M04');
  assert.equal(data.kind, 'layers');
  assert.equal(data.layers.length, 2);
  assert.equal(stream.peek(), 'M03/M04');
});

test('returns null on other tokens', () => {
  assert.equal(parsed('15/09'), null);
  assert.equal(parsed('FEW01'), null);
});

test('describes layers', () => {
  assert.deepEqual(texts('FEW010CB SCT017'), {
    en: 'Few clouds (1-2 oktas) at 1000 ft (cumulonimbus); scattered clouds (3-4 oktas) at 1700 ft.',
    ca: 'Pocs núvols (1-2 octes) a 1000 ft (cumulonimbus); núvols dispersos (3-4 octes) a 1700 ft.',
    es: 'Pocas nubes (1-2 octas) a 1000 ft (cumulonimbus); nubes dispersas (3-4 octas) a 1700 ft.',
  });
  assert.equal(texts('OVC009').ca, 'Cel cobert (8 octes) a 900 ft.');
});
