import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createContext, parseGroup, runPipeline } from '../../src/core/pipeline.js';
import { TokenStream } from '../../src/core/token-stream.js';

const word = (id, extra = {}) => ({
  id,
  ...extra,
  parse: (stream) => stream.take(new RegExp(`^${id}$`)) && {},
});

const execute = (text, elements) =>
  runPipeline(new TokenStream(text.split(' ')), elements, createContext(elements));

test('createContext starts elements as null and repeatable elements as empty lists', () => {
  const { report } = createContext([word('A'), word('B', { repeatable: true })]);
  assert.deepEqual(report, { A: null, B: [] });
});

test('warn records code and token', () => {
  const context = createContext([]);
  context.warn('some.code', 'TOKEN');
  assert.deepEqual(context.warnings, [{ code: 'some.code', token: 'TOKEN' }]);
});

test('parseGroup adds the source tokens, except on repeatable elements', () => {
  const list = { id: 'L', repeatable: true, parse: (stream) => [{ raw: stream.next() }] };
  const context = createContext([]);
  assert.deepEqual(parseGroup(word('A'), new TokenStream(['A']), context), { raw: 'A' });
  assert.deepEqual(parseGroup(list, new TokenStream(['X']), context), [{ raw: 'X' }]);
  assert.equal(parseGroup(word('A'), new TokenStream(['B']), context), null);
});

test('optional elements can be skipped', () => {
  const { report, unparsed } = execute('A C', [word('A'), word('B'), word('C')]);
  assert.deepEqual(report, { A: { raw: 'A' }, B: null, C: { raw: 'C' } });
  assert.deepEqual(unparsed, []);
});

test('an unknown token goes to unparsed and parsing continues', () => {
  const { report, unparsed } = execute('A X B', [word('A'), word('B')]);
  assert.deepEqual(unparsed, ['X']);
  assert.equal(report.B.raw, 'B');
});

test('an element never matches behind the current position', () => {
  const { report, unparsed } = execute('B A', [word('A'), word('B')]);
  assert.equal(report.A, null);
  assert.deepEqual(unparsed, ['A']);
});

test('a terminal element sends all later tokens to unparsed', () => {
  const { report, unparsed } = execute('A B', [word('A', { terminal: true }), word('B')]);
  assert.equal(report.B, null);
  assert.deepEqual(unparsed, ['B']);
});
