import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';

const SPEC = new URL('../docs/metar-spec.md', import.meta.url);
const TESTS = new URL('./', import.meta.url);
const RULE_ROW = /^\| ([A-Z]+-\d+) \|/gm;
const THIS_FILE = 'spec-coverage.test.js';

test('every spec rule and vector has a test', async () => {
  const spec = await readFile(SPEC, 'utf8');
  const rules = [...spec.matchAll(RULE_ROW)].map((match) => match[1]);
  assert.ok(rules.length > 100);

  const files = (await readdir(TESTS, { recursive: true }))
    .filter((file) => file.endsWith('.test.js') && !file.endsWith(THIS_FILE));
  const sources = await Promise.all(files.map((file) => readFile(new URL(file, TESTS), 'utf8')));
  const tests = sources.join('\n');

  const missing = rules.filter((rule) => !new RegExp(`\\b${rule}:`).test(tests));
  assert.deepEqual(missing, []);
});
