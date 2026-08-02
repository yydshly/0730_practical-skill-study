import { describe, expect, it } from 'vitest';

import { TOOLS } from '../src/data/tools';
import {
  getIncompleteToolExplanations,
  getToolExplanation,
  getToolCapabilityStatusLabel,
  TOOL_CAPABILITY_STATUS_META,
  TOOL_EXPLANATIONS,
} from '../src/data/toolExplanations';

describe('工具能力说明状态', () => {
  it('为四种状态提供固定中文标签', () => {
    expect(Object.keys(TOOL_CAPABILITY_STATUS_META).sort()).toEqual([
      'complete', 'core-complete', 'partial', 'unavailable',
    ]);
    expect(getToolCapabilityStatusLabel('complete')).toBe('完整实现');
    expect(getToolCapabilityStatusLabel('core-complete')).toBe('主要能力完整');
    expect(getToolCapabilityStatusLabel('partial')).toBe('部分实现');
    expect(getToolCapabilityStatusLabel('unavailable')).toBe('当前无法完整实现');
  });

  it('完整覆盖 56 个工具且没有重复 ID', () => {
    expect(TOOL_EXPLANATIONS).toHaveLength(56);
    expect(new Set(TOOL_EXPLANATIONS.map((item) => item.toolId)).size).toBe(56);
    expect(TOOL_EXPLANATIONS.map((item) => item.toolId).sort())
      .toEqual(TOOLS.map((tool) => tool.id).sort());
  });

  it('同步批次一后的状态数量和关键工具状态', () => {
    const counts = TOOL_EXPLANATIONS.reduce<Partial<Record<string, number[]>>>((result, item) => {
      (result[item.status] ??= []).push(1);
      return result;
    }, {});
    expect(counts.complete ?? []).toHaveLength(0);
    expect(counts['core-complete'] ?? []).toHaveLength(17);
    expect(counts.partial ?? []).toHaveLength(24);
    expect(counts.unavailable ?? []).toHaveLength(15);
    expect(getToolExplanation('qr-genny').status).toBe('unavailable');
    expect(getToolExplanation('regex-tester').status).toBe('core-complete');
    expect(getToolExplanation('paper-sizes').status).toBe('partial');
    for (const toolId of [
      'colour-converter', 'harmony-genny', 'tailwind-shades', 'decoder',
      'meta-tag-genny', 'markdown-writer', 'base-converter', 'sci-calc',
    ] as const) {
      expect(getToolExplanation(toolId).status, toolId).toBe('core-complete');
    }
  });

  it('为批次一工具记录已验证能力和仍未实现边界', () => {
    const requiredFacts: ReadonlyArray<readonly [Parameters<typeof getToolExplanation>[0], string]> = [
      ['colour-converter', 'OKLCH'],
      ['harmony-genny', '12 种方案'],
      ['tailwind-shades', '有效 ESM'],
      ['paper-sizes', '36–2400 DPI'],
      ['decoder', 'Vigenère'],
      ['meta-tag-genny', 'Twitter'],
      ['regex-tester', '日期'],
      ['markdown-writer', '查找替换'],
      ['base-converter', 'Bit Toggle'],
      ['sci-calc', 'DEG/RAD'],
    ];
    for (const [toolId, fact] of requiredFacts) {
      const item = getToolExplanation(toolId);
      expect([
        item.summary,
        ...item.capabilities,
        ...item.inputs,
        ...item.outputs,
        ...item.principle,
        ...item.workflow,
        ...item.limitations,
      ].join('\n'), toolId).toContain(fact);
    }
    expect(getToolExplanation('paper-sizes').limitations.join('\n'))
      .toContain('尚未提供图片上传后的实物覆盖叠放');
  });

  it('所有说明字段完整，未完整项给出具体限制', () => {
    for (const item of TOOL_EXPLANATIONS) {
      expect(item.summary.trim(), item.toolId).not.toBe('');
      expect(item.capabilities.length, item.toolId).toBeGreaterThan(0);
      expect(item.inputs.length, item.toolId).toBeGreaterThan(0);
      expect(item.outputs.length, item.toolId).toBeGreaterThan(0);
      expect(item.principle.length, item.toolId).toBeGreaterThan(0);
      expect(item.workflow.length, item.toolId).toBeGreaterThan(0);
      expect(item.privacy.trim(), item.toolId).not.toBe('');
      if (item.status === 'partial' || item.status === 'unavailable') {
        expect(item.limitations.length, item.toolId).toBeGreaterThan(0);
      }
      if (item.status === 'unavailable') {
        expect([
          ...(item.unavailableReasons ?? []),
          ...(item.futureRequirements ?? []),
        ].length, item.toolId).toBeGreaterThan(0);
      }
    }
    expect(getIncompleteToolExplanations()).toHaveLength(39);
  });
});
