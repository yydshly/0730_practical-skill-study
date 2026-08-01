import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FULL_COPY_SAMPLE } from '../js/data.js';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

const hooks = [
  'text-sample',
  'text-sample-original-image',
  'text-sample-composed',
  'text-sample-composed-image',
  'text-sample-eyebrow',
  'text-sample-title',
  'text-sample-date',
  'text-sample-location',
  'text-sample-description',
  'text-sample-footer',
  'text-sample-caption',
];

test('full copy sample contains the approved bookstore event copy', () => {
  assert.equal(FULL_COPY_SAMPLE.scenarioId, 'bookstore-event');
  assert.equal(
    FULL_COPY_SAMPLE.assetPath,
    'assets/generated/scenarios/bookstore-event.jpeg',
  );
  for (const key of ['eyebrow', 'title', 'date', 'location', 'description', 'footer']) {
    assert.ok(FULL_COPY_SAMPLE[key].length > 0, `${key} should be populated`);
  }
});

test('full copy sample exposes stable hooks and render mapping', () => {
  for (const hook of hooks) {
    assert.match(html, new RegExp(`id=["']${hook}["']`), `missing #${hook}`);
  }
  assert.match(app, /FULL_COPY_SAMPLE/);
  assert.match(app, /text-sample-composed-image/);
  assert.match(app, /text-sample-title/);
});

test('full copy sample keeps typography inside the generated image safe zone', () => {
  assert.match(
    html,
    /class=["']text-sample-copy text-sample-copy-safe-zone["']/,
    'composed copy should opt into the image-specific safe zone',
  );
  assert.match(
    styles,
    /\.text-sample-copy-safe-zone\s*\{[^}]*inset:\s*8%\s+8%\s+8%\s+43%;/s,
    'copy should be anchored to the right-side negative space',
  );
  assert.match(
    styles,
    /\.text-sample-copy h4\s*\{[^}]*max-width:\s*6ch;/s,
    'title should stay narrow enough to remain in the safe zone',
  );
  assert.match(
    styles,
    /\.text-sample-footer\s*\{[^}]*margin-top:\s*18%;/s,
    'footer should follow the copy block instead of pinning to the image bottom',
  );
});
