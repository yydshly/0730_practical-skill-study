import { describe, expect, it } from 'vitest';

import { getToolById, searchTools, TOOLS } from '../src/data/tools';

describe('工具注册表', () => {
  it('每个工具 ID 唯一且中文标题完整', () => {
    expect(new Set(TOOLS.map((tool) => tool.id)).size).toBe(TOOLS.length);
    expect(TOOLS.every((tool) => /[\u4e00-\u9fff]/.test(tool.title))).toBe(true);
    expect(TOOLS.length).toBeGreaterThanOrEqual(56);
  });

  it('中文搜索能找到图片格式转换', () => {
    expect(searchTools('格式转换').map((tool) => tool.id)).toContain('image-converter');
  });

  it('能按 ID 取得独立编辑器入口', () => {
    expect(getToolById('editor')?.title).toBe('Substrata 图片编辑器');
  });
});
