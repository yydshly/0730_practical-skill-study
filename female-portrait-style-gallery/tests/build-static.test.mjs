import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildClassicBundle } from '../scripts/build-static.mjs';

test('builds one classic browser script without module syntax', async () => {
  const output = await buildClassicBundle({ rootDir: new URL('../', import.meta.url) });
  assert.match(output, /const STYLES =/);
  assert.match(output, /function filterStyles/);
  assert.match(output, /render\(\);/);
  assert.doesNotMatch(output, /^\s*(import|export)\s/m);
});

test('build output is identical for LF and CRLF source files', async (t) => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'portrait-static-build-'));
  t.after(() => rm(fixtureRoot, { recursive: true, force: true }));

  const sourceFiles = {
    'gallery.js': "export function render() {\n  return 'ok';\n}\n",
    'styles.js': "export const STYLES = [];\n",
    'main.js': "import { render } from './gallery.js';\n\nrender();\n",
  };

  async function buildFixture(directoryName, newline) {
    const root = join(fixtureRoot, directoryName);
    await mkdir(join(root, 'js'), { recursive: true });
    await Promise.all(Object.entries(sourceFiles).map(([name, source]) => (
      writeFile(join(root, 'js', name), source.replaceAll('\n', newline), 'utf8')
    )));
    return buildClassicBundle({ rootDir: pathToFileURL(`${root}/`) });
  }

  const lfOutput = await buildFixture('lf', '\n');
  const crlfOutput = await buildFixture('crlf', '\r\n');

  assert.equal(crlfOutput, lfOutput);
});
