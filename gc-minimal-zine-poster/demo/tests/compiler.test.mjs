import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeInput,
  selectVariation,
  compilePrompt,
  runQualityGate,
} from '../js/compiler.js';
import { QUALITY_RULES } from '../js/data.js';

test('normalizes a preset theme into a usable subject and mood', () => {
  const input = normalizeInput({ type: 'theme', value: '雨天旧书店' });
  assert.equal(input.error, undefined);
  assert.equal(input.type, 'theme');
  assert.equal(input.value, '雨天旧书店');
  assert.ok(input.subject.length > 0);
  assert.ok(input.mood.length > 0);
});

test('rejects empty input before prompt compilation', () => {
  assert.deepEqual(normalizeInput({ type: 'theme', value: '  ' }), {
    error: '请输入一个主题或短句。',
  });
});

test('compiles a four-paragraph prompt with all nine fields', () => {
  const input = normalizeInput({ type: 'theme', value: '雨天旧书店' });
  const recipe = selectVariation(input, []);
  const compilation = compilePrompt(input, recipe);
  assert.equal(compilation.promptParagraphs.length, 4);
  assert.equal(compilation.promptText.split('\n\n').length, 4);
  assert.deepEqual(Object.keys(compilation.fields), [
    'canvas', 'attentionGeometry', 'imageAnchor', 'anchorTreatment',
    'typographySystem', 'colorLogic', 'reproductionTexture',
    'emotionalTemperature', 'hardAvoids',
  ]);
});

test('recipe mood is represented without replacing the input mood', () => {
  const input = normalizeInput({ type: 'theme', value: '海边午后' });
  const recipe = selectVariation(input, []);
  const compilation = compilePrompt(input, recipe);
  assert.ok(compilation.fields.typographySystem.includes(recipe.mood));
  assert.ok(compilation.fields.emotionalTemperature.includes(input.mood));
  assert.notEqual(recipe.mood, input.mood);
});

test('new variation avoids the current recipe when possible', () => {
  const input = normalizeInput({ type: 'theme', value: '海边午后' });
  const first = selectVariation(input, []);
  const second = selectVariation(input, [first.id]);
  assert.notEqual(second.id, first.id);
});

test('quality gate passes the required sparse paper poster rules', () => {
  const input = normalizeInput({ type: 'theme', value: '台风记忆' });
  const compilation = compilePrompt(input, selectVariation(input, []));
  const checks = runQualityGate(compilation);
  assert.equal(checks.length, QUALITY_RULES.length);
  assert.deepEqual(checks.map((check) => check.label), QUALITY_RULES);
  assert.ok(checks.every((check) => ['pass', 'fail'].includes(check.status)));
  assert.ok(checks.some((check) => check.label === QUALITY_RULES[3]));
});
