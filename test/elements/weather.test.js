import assert from 'node:assert/strict';
import { test } from 'node:test';
import { weather } from '../../src/elements/weather.js';
import { DESCRIPTORS, PHENOMENA } from '../../src/elements/weather-codes.js';
import { describeAll, run } from '../helpers.js';

const first = (token) => run(weather, token).data[0];
const texts = (token) => describeAll(weather, first(token));

test('WX-01: reads qualifier, descriptor and phenomenon', () => {
  const group = first('+SHRA');
  assert.equal(group.intensity, 'heavy');
  assert.equal(group.descriptor, 'SH');
  assert.deepEqual(group.phenomena, ['RA']);
  assert.equal(first('-RA').intensity, 'light');
  assert.equal(first('VCFG').proximity, true);
  assert.equal(first('VCFG').intensity, null);
});

test('WX-01: reads every table code', () => {
  for (const code of PHENOMENA) assert.deepEqual(first(code).phenomena, [code]);
  for (const code of DESCRIPTORS) assert.equal(first(code).descriptor, code);
});

test('WX-02: warns above 3 groups', () => {
  assert.deepEqual(run(weather, 'RA BR HZ').warnings, []);
  assert.deepEqual(run(weather, 'RA BR HZ FU').warnings, [
    { code: 'weather.too-many-groups', token: 'RA BR HZ FU' },
  ]);
});

test('WX-03: no qualifier means moderate', () => {
  assert.equal(first('RA').intensity, 'moderate');
});

test('WX-04: chained phenomena keep their order', () => {
  const group = first('TSGRRA');
  assert.equal(group.descriptor, 'TS');
  assert.deepEqual(group.phenomena, ['GR', 'RA']);
});

test('WX-05: a descriptor can stand alone', () => {
  assert.deepEqual(first('VCTS').phenomena, []);
  assert.equal(first('VCTS').descriptor, 'TS');
  assert.equal(first('TS').descriptor, 'TS');
});

test('WX-06: UP combines with FZ and TS', () => {
  assert.deepEqual(first('-UP').phenomena, ['UP']);
  assert.equal(first('FZUP').descriptor, 'FZ');
  assert.equal(first('TSUP').descriptor, 'TS');
});

test('WX-07: // means not observed', () => {
  const { data, stream } = run(weather, '// //////');
  assert.equal(data[0].notObserved, true);
  assert.equal(stream.peek(), '//////');
  assert.deepEqual(describeAll(weather, data[0]), {
    en: 'Present weather not observed.',
    ca: 'Temps present no observat.',
    es: 'Tiempo presente no observado.',
  });
});

test('WX-08: AUTO table does not restrict codes', () => {
  assert.deepEqual(first('MIFG').phenomena, ['FG']);
  assert.deepEqual(first('SG').phenomena, ['SG']);
});

test('WX-09: moderate shows only for precipitation', () => {
  assert.equal(first('FG').intensity, 'moderate');
  assert.equal(texts('FG').en, 'Fog.');
  assert.equal(texts('RA').en, 'Moderate rain.');
  assert.equal(texts('TS').ca, 'Tempesta.');
  assert.equal(texts('TSGRRA').ca, 'Tempesta moderada amb calamarsa i pluja.');
  assert.equal(first('BLSN').intensity, 'moderate');
  assert.equal(texts('BLSN').en, 'Blowing snow.');
  assert.equal(texts('DRSN').es, 'Nieve arrastrada a baja altura.');
  assert.equal(texts('+BLSN').ca, 'Neu forta aixecada pel vent.');
  assert.equal(texts('+FZRA').ca, 'Pluja gelant forta.');
});

test('rejects qualifiers alone and tokens that are not weather', () => {
  for (const token of ['-', '+', 'VC', 'NSC', 'CAVOK', 'NSW', 'BKN008', '+-RA', 'RE+RA']) {
    assert.equal(run(weather, token).data, null, token);
  }
});

test('composes phrases with each language word order', () => {
  assert.deepEqual(texts('+SHRA'), {
    en: 'Heavy showers of rain.',
    ca: 'Xàfecs forts de pluja.',
    es: 'Chubascos fuertes de lluvia.',
  });
  assert.deepEqual(texts('-RA'), {
    en: 'Light rain.',
    ca: 'Pluja lleugera.',
    es: 'Lluvia ligera.',
  });
  assert.deepEqual(texts('VCTS'), {
    en: 'Thunderstorm in the vicinity.',
    ca: 'Tempesta a les proximitats.',
    es: 'Tormenta en las proximidades.',
  });
  assert.deepEqual(texts('PRFG'), {
    en: 'Partial fog.',
    ca: 'Boira parcial.',
    es: 'Niebla parcial.',
  });
  assert.deepEqual(texts('BCFG'), {
    en: 'Patches of fog.',
    ca: 'Bancs de boira.',
    es: 'Bancos de niebla.',
  });
  assert.deepEqual(texts('FZFG'), {
    en: 'Freezing fog.',
    ca: 'Boira gelant.',
    es: 'Niebla engelante.',
  });
  assert.deepEqual(texts('BLSN'), {
    en: 'Blowing snow.',
    ca: 'Neu aixecada pel vent.',
    es: 'Nieve levantada por el viento.',
  });
  assert.deepEqual(texts('MIFG'), {
    en: 'Shallow fog.',
    ca: 'Boira baixa.',
    es: 'Niebla baja.',
  });
  assert.deepEqual(texts('DRSA'), {
    en: 'Low drifting sand.',
    ca: 'Sorra arrossegada a poca alçada.',
    es: 'Arena arrastrada a baja altura.',
  });
});

test('adjectives agree with gender and number', () => {
  assert.equal(texts('-DZ').ca, 'Plugim lleuger.');
  assert.equal(texts('-DZ').es, 'Llovizna ligera.');
  assert.equal(texts('-PL').ca, 'Grànuls de gel lleugers.');
  assert.equal(texts('+RASN').ca, 'Pluja i neu fortes.');
  assert.equal(texts('+RAGR').es, 'Lluvia y granizo fuertes.');
  assert.equal(texts('-RASN').es, 'Lluvia y nieve ligeras.');
  assert.equal(texts('+GRRASN').en, 'Heavy hail, rain and snow.');
});

test('every code has text in every language', () => {
  for (const code of PHENOMENA) {
    for (const text of Object.values(texts(code))) assert.doesNotMatch(text, /undefined/, code);
  }
  for (const code of DESCRIPTORS) {
    for (const text of Object.values(texts(`${code}RA`))) assert.doesNotMatch(text, /undefined/, code);
    for (const text of Object.values(texts(code))) assert.doesNotMatch(text, /undefined/, code);
  }
});
