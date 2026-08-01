import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterStyles,
  formatResultCount,
  getSampleAsset,
  getSampleDescription,
  validateCatalog
} from '../js/gallery.js';
import { CATEGORIES, STYLES, getStyleById } from '../js/styles.js';

const fixture = [
  {
    id: 'clean-lifestyle',
    number: '01',
    category: 'lifestyle',
    name: '清纯生活照',
    keywords: ['咖啡馆'],
    description: '温和自然',
    image: 'assets/styles/01.png',
    geminiImage: 'assets/styles/gemini/01.png',
    geminiDescription: 'Gemini 样例保留了窗边阅读和柔和自然光。',
    prompt: 'sample',
    details: { scene: '咖啡馆', outfit: '针织衫', camera: '半身', light: '窗光' }
  },
  {
    id: 'urban-fashion',
    number: '02',
    category: 'fashion',
    name: '都市时尚写真',
    keywords: ['街拍'],
    description: '现代都市',
    image: 'assets/styles/02.png',
    geminiImage: 'assets/styles/gemini/02.png',
    geminiDescription: 'Gemini 样例强调了雨后街头的反光与步态。',
    prompt: 'sample',
    details: { scene: '街道', outfit: '西装', camera: '全身', light: '黄昏' }
  }
];

test('rejects a catalog record with an empty prompt', () => {
  assert.deepEqual(validateCatalog([{ ...fixture[0], prompt: '' }], { categories: CATEGORIES }), {
    valid: false,
    errors: ['clean-lifestyle 缺少 prompt']
  });
});

test('matches category and Chinese keyword without changing the input array', () => {
  const source = [...fixture];

  assert.deepEqual(filterStyles(source, {
    categories: CATEGORIES,
    category: 'lifestyle',
    query: '咖啡'
  }), [fixture[0]]);
  assert.deepEqual(source, fixture);
});

test('indexes all nine visible Chinese category labels', () => {
  const cases = [
    ['生活方式', 'lifestyle'],
    ['曲线', 'curve'],
    ['时尚', 'fashion'],
    ['幻想', 'fantasy'],
    ['商业', 'commercial'],
    ['东方', 'oriental'],
    ['美妆', 'beauty'],
    ['写实', 'realism'],
    ['电影感', 'cinematic']
  ];
  const styles = cases.map(([, category], index) => ({
    ...fixture[0],
    id: `style-${index}`,
    number: String(index + 1).padStart(2, '0'),
    category,
    name: '中性名称',
    keywords: ['中性关键词'],
    description: '中性描述'
  }));

  for (const [label, expectedCategory] of cases) {
    assert.deepEqual(
      filterStyles(styles, { categories: CATEGORIES, query: label }).map((style) => style.category),
      [expectedCategory],
      `${label} 应只命中 ${expectedCategory}`
    );
  }
});

test('rejects duplicate catalog ids', () => {
  assert.deepEqual(validateCatalog([
    fixture[0],
    { ...fixture[1], id: fixture[0].id }
  ], { categories: CATEGORIES }), {
    valid: false,
    errors: ['目录包含重复 id: clean-lifestyle']
  });
});

test('rejects a category outside the visible category catalog', () => {
  assert.deepEqual(validateCatalog([
    { ...fixture[0], category: 'unknown' }
  ], { categories: CATEGORIES }), {
    valid: false,
    errors: ['clean-lifestyle 的 category 不在允许分类中: unknown']
  });
});

test('rejects all missing required catalog fields', () => {
  assert.deepEqual(validateCatalog([{
    ...fixture[0],
    number: '',
    name: ' ',
    keywords: [],
    description: '',
    image: '',
    geminiImage: '',
    geminiDescription: '',
    prompt: '',
    details: { scene: '', outfit: ' ', camera: '', light: '' }
  }], { categories: CATEGORIES }), {
    valid: false,
    errors: [
      'clean-lifestyle 缺少 number',
      'clean-lifestyle 缺少 name',
      'clean-lifestyle 缺少 keywords',
      'clean-lifestyle 缺少 description',
      'clean-lifestyle 缺少 image',
      'clean-lifestyle 缺少 geminiImage',
      'clean-lifestyle 缺少 geminiDescription',
      'clean-lifestyle 缺少 prompt',
      'clean-lifestyle 缺少 details.scene',
      'clean-lifestyle 缺少 details.outfit',
      'clean-lifestyle 缺少 details.camera',
      'clean-lifestyle 缺少 details.light'
    ]
  });
});

test('rejects a Gemini image outside the Gemini asset directory', () => {
  assert.deepEqual(validateCatalog([{
    ...fixture[0],
    geminiImage: 'assets/styles/01.png'
  }], { categories: CATEGORIES }), {
    valid: false,
    errors: [
      'clean-lifestyle 的 geminiImage 必须是 assets/styles/gemini/ 下的 PNG 或 JPEG: assets/styles/01.png'
    ]
  });
});

test('accepts a Gemini JPEG asset downloaded from Gemini', () => {
  assert.deepEqual(validateCatalog([{
    ...fixture[0],
    geminiImage: 'assets/styles/gemini/01-clean-lifestyle.jpg'
  }], { categories: CATEGORIES }), {
    valid: true,
    errors: []
  });
});

test('resolves the selected sample asset and description without mutating the style', () => {
  const style = fixture[0];

  assert.equal(getSampleAsset(style, 'original'), style.image);
  assert.equal(getSampleAsset(style, 'gemini'), style.geminiImage);
  assert.equal(getSampleDescription(style, 'original'), style.description);
  assert.equal(getSampleDescription(style, 'gemini'), style.geminiDescription);
  assert.equal(getSampleAsset(style, 'unknown'), style.image);
  assert.equal(getSampleDescription(style, 'unknown'), style.description);
});

test('rejects malformed numbering and image paths', () => {
  assert.deepEqual(validateCatalog([{
    ...fixture[0],
    number: '1',
    image: '../outside.jpg'
  }], { categories: CATEGORIES }), {
    valid: false,
    errors: [
      'clean-lifestyle 的 number 必须是两位数字: 1',
      'clean-lifestyle 的 image 必须是 assets/styles/ 下的 PNG: ../outside.jpg'
    ]
  });
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
  assert.deepEqual(validateCatalog(STYLES, { categories: CATEGORIES }), { valid: true, errors: [] });
  assert.equal(new Set(STYLES.map((style) => style.image)).size, 20);
  assert.equal(new Set(STYLES.map((style) => style.geminiImage)).size, 20);
});

test('resolves a known style image and returns undefined for an unknown id', () => {
  assert.equal(
    getStyleById('gufeng-xianxia').image,
    'assets/styles/04-gufeng-xianxia.png'
  );
  assert.equal(getStyleById('missing-style'), undefined);
});
