import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalize, tokenize } from '../../src/core/tokenizer.js';

test('TOK-01: collapses spaces, tabs and newlines', () => {
  assert.deepEqual(tokenize('  METAR   LEBB\t160930Z\n03008KT  '), ['METAR', 'LEBB', '160930Z', '03008KT']);
});

test('TOK-02: strips the trailing terminator', () => {
  assert.deepEqual(tokenize('LEAM 141200Z NIL='), ['LEAM', '141200Z', 'NIL']);
  assert.deepEqual(tokenize('LEAM 141200Z NIL ='), ['LEAM', '141200Z', 'NIL']);
});

test('TOK-03: converts to upper case', () => {
  assert.equal(normalize('leam 141200z'), 'LEAM 141200Z');
});

test('TOK-04: normalises typographic dashes', () => {
  assert.equal(normalize('–UP −RA'), '-UP -RA');
});

test('TOK-05: rejects non-string and empty input', () => {
  for (const input of [undefined, null, 42, {}, '', '   ']) {
    assert.throws(() => tokenize(input), TypeError);
  }
});

test('TOK-07: removes control characters', () => {
  assert.deepEqual(tokenize('LEAM 141200Z NIL\n\0\0\0'), ['LEAM', '141200Z', 'NIL']);
});

test('a lone terminator has no tokens', () => {
  assert.deepEqual(tokenize('='), []);
});
