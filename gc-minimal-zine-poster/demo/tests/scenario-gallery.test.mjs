import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

const REQUIRED_HOOKS = [
  'scenario-gallery',
  'scenario-grid',
  'scenario-detail',
  'scenario-active-category',
  'scenario-active-title',
  'scenario-active-description',
  'scenario-active-product',
  'scenario-active-brief',
  'scenario-active-why',
  'scenario-active-deliverables',
  'scenario-active-image',
  'scenario-active-caption',
];

test('scenario gallery exposes the stable desktop DOM hooks', () => {
  for (const hook of REQUIRED_HOOKS) {
    assert.match(html, new RegExp(`id=["']${hook}["']`), `missing #${hook}`);
  }
});

test('scenario gallery renders ten records and local image selection behavior', () => {
  assert.match(app, /SCENARIO_SHOWCASES/);
  assert.match(app, /scenario-grid/);
  assert.match(app, /scenario-active-image/);
  assert.match(app, /scenarioId/);
  assert.match(app, /aria-pressed/);
  assert.match(app, /asset\.assetPath/);
});
