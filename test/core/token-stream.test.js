import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TokenStream } from '../../src/core/token-stream.js';

test('peek looks ahead without consuming', () => {
  const stream = new TokenStream(['A', 'B']);
  assert.equal(stream.peek(), 'A');
  assert.equal(stream.peek(1), 'B');
  assert.equal(stream.peek(2), undefined);
  assert.equal(stream.position, 0);
});

test('next and advance move the cursor', () => {
  const stream = new TokenStream(['A', 'B', 'C']);
  assert.equal(stream.next(), 'A');
  stream.advance(2);
  assert.equal(stream.done, true);
});

test('take consumes only on match', () => {
  const stream = new TokenStream(['A']);
  assert.equal(stream.take(/^B$/), null);
  assert.equal(stream.position, 0);
  assert.equal(stream.take(/^A$/)[0], 'A');
  assert.equal(stream.take(/^A$/), null);
});

test('rest consumes everything left', () => {
  const stream = new TokenStream(['A', 'B', 'C']);
  stream.next();
  assert.deepEqual(stream.rest(), ['B', 'C']);
  assert.equal(stream.done, true);
});

test('textFrom returns the consumed tokens', () => {
  const stream = new TokenStream(['A', 'B', 'C']);
  stream.next();
  const start = stream.position;
  stream.next();
  stream.next();
  assert.equal(stream.textFrom(start), 'B C');
});
