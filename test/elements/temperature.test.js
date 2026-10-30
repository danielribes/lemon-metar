import assert from 'node:assert/strict';
import { test } from 'node:test';
import { temperature } from '../../src/elements/temperature.js';
import { describeAll, run } from '../helpers.js';

test('TEMP-01: reads air and dew point', () => {
  assert.deepEqual(run(temperature, '15/09').data, { air: 15, dewPoint: 9, unit: 'C' });
});

test('TEMP-02: M means below zero, and M00 is 0', () => {
  const { data } = run(temperature, 'M03/M04');
  assert.equal(data.air, -3);
  assert.equal(data.dewPoint, -4);
  assert.ok(Object.is(run(temperature, 'M00/M01').data.air, 0));
});

test('TEMP-03: solidi give null', () => {
  assert.equal(run(temperature, '/////').data.air, null);
  assert.equal(run(temperature, '/////').data.dewPoint, null);
  assert.equal(run(temperature, '15///').data.dewPoint, null);
});

test('TEMP-04: warns when dew point is above air temperature', () => {
  assert.deepEqual(run(temperature, '10/12').warnings, [
    { code: 'temperature.dew-point-above-air', token: '10/12' },
  ]);
  assert.deepEqual(run(temperature, '13/13').warnings, []);
});

test('rejects tokens that are not temperature', () => {
  for (const token of ['15-09', '1/9', 'Q1017']) assert.equal(run(temperature, token).data, null);
});

test('describes temperature', () => {
  assert.deepEqual(describeAll(temperature, { air: 15, dewPoint: 9 }), {
    en: 'Temperature 15 °C, dew point 9 °C.',
    ca: 'Temperatura de 15 °C, punt de rosada a 9 °C.',
    es: 'Temperatura de 15 °C, punto de rocío a 9 °C.',
  });
  assert.equal(
    describeAll(temperature, { air: null, dewPoint: null }).ca,
    'Temperatura no disponible, punt de rosada no disponible.',
  );
});
