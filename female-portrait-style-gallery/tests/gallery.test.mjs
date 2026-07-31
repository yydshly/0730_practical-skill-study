import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterStyles,
  formatResultCount,
  validateCatalog
} from '../js/gallery.js';
import { CATEGORIES, STYLES, getStyleById } from '../js/styles.js';

const fixture = [
  {
    id: 'clean-lifestyle',
    category: 'lifestyle',
    name: '清纯生活照',
    keywords: ['咖啡馆'],
    description: '温和自然',
    image: 'assets/styles/01.png',
    prompt: 'sample',
    details: { scene: '咖啡馆', outfit: '针织衫', camera: '半身', light: '窗光' }
  },
  {
    id: 'urban-fashion',
    category: 'fashion',
    name: '都市时尚写真',
    keywords: ['街拍'],
    description: '现代都市',
    image: 'assets/styles/02.png',
    prompt: 'sample',
    details: { scene: '街道', outfit: '西装', camera: '全身', light: '黄昏' }
  }
];

test('rejects a catalog record with an empty prompt', () => {
  assert.deepEqual(validateCatalog([{ ...fixture[0], prompt: '' }]), {
    valid: false,
    errors: ['clean-lifestyle 缺少 prompt']
  });
});

test('matches category and Chinese keyword without changing the input array', () => {
  const source = [...fixture];

  assert.deepEqual(filterStyles(source, 'lifestyle', '咖啡'), [fixture[0]]);
  assert.deepEqual(source, fixture);
});

test('uses the same result label for one and many styles', () => {
  assert.equal(formatResultCount(1), '1 个风格');
  assert.equal(formatResultCount(20), '20 个风格');
});

test('contains twenty valid styles across the nine library categories', () => {
  assert.equal(STYLES.length, 20);
  assert.deepEqual(CATEGORIES.map((category) => category.id), [
    'lifestyle',
    'curve',
    'fashion',
    'fantasy',
    'commercial',
    'oriental',
    'beauty',
    'realism',
    'cinematic'
  ]);
  assert.deepEqual(validateCatalog(STYLES), { valid: true, errors: [] });
  assert.equal(new Set(STYLES.map((style) => style.image)).size, 20);
});

test('resolves a known style image and returns undefined for an unknown id', () => {
  assert.equal(
    getStyleById('gufeng-xianxia').image,
    'assets/styles/04-gufeng-xianxia.png'
  );
  assert.equal(getStyleById('missing-style'), undefined);
});
