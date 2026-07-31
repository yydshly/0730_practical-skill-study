import test from 'node:test';
import assert from 'node:assert/strict';
import { buildClassicBundle } from '../scripts/build-static.mjs';

test('builds one classic browser script without module syntax', async () => {
  const output = await buildClassicBundle({ rootDir: new URL('../', import.meta.url) });
  assert.match(output, /const STYLES =/);
  assert.match(output, /function filterStyles/);
  assert.match(output, /render\(\);/);
  assert.doesNotMatch(output, /^\s*(import|export)\s/m);
});
