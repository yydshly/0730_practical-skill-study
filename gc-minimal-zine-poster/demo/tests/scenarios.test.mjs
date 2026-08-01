import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ASSET_MANIFEST, SCENARIO_SHOWCASES } from '../js/data.js';

test('provides ten distinct scenario product records', () => {
  assert.equal(SCENARIO_SHOWCASES.length, 10);
  assert.equal(new Set(SCENARIO_SHOWCASES.map((item) => item.id)).size, 10);

  for (const item of SCENARIO_SHOWCASES) {
    assert.ok(item.audience.length > 0);
    assert.ok(item.product.length > 0);
    assert.ok(item.brief.length > 0);
    assert.ok(item.visualGoal.length > 0);
    assert.ok(item.whyItFits.length > 0);
    assert.ok(item.deliverables.length >= 2);
    assert.equal(item.assetId, item.id);
  }
});

test('scenario records use the approved product situations', () => {
  assert.deepEqual(SCENARIO_SHOWCASES.map((item) => item.id), [
    'indie-zine-cover',
    'bookstore-event',
    'cafe-seasonal',
    'art-exhibition',
    'poetry-book',
    'music-ep-cover',
    'museum-culture',
    'film-title-card',
    'art-direction',
    'postcard-insert',
  ]);
});

test('each scenario has one registered local generated asset', () => {
  const scenarioAssets = ASSET_MANIFEST.filter((asset) => asset.scenarioId);

  assert.equal(scenarioAssets.length, SCENARIO_SHOWCASES.length);

  for (const scenario of SCENARIO_SHOWCASES) {
    const asset = scenarioAssets.find((item) => item.scenarioId === scenario.id);
    assert.ok(asset, `missing asset for ${scenario.id}`);
    assert.equal(asset.id, scenario.id);
    assert.equal(asset.assetPath, `assets/generated/scenarios/${scenario.id}.jpeg`);
    assert.ok(asset.prompt.length > 0);
    assert.ok(asset.note.includes('GENERATED'));
    assert.ok(
      existsSync(fileURLToPath(new URL(`../${asset.assetPath}`, import.meta.url))),
      `missing local file for ${scenario.id}`,
    );
  }
});
