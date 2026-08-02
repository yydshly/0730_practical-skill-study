import { describe, expect, it } from 'vitest';

import { getToolById, searchTools, TOOLS } from '../src/data/tools';
import { WORKSPACE_LOADERS } from '../src/app/ToolPage';
import type { ToolId } from '../src/core/types';

const EXPECTED_TOOL_IDS = [
  'matte-generator', 'scroll-generator', 'social-cropper', 'watermarker',
  'artwork-enhancer', 'background-remover', 'favicon-genny', 'image-clipper',
  'image-converter', 'image-splitter', 'image-stitcher', 'image-tracer',
  'paste-image', 'placeholder-genny', 'svg-optimiser', 'base64-image-encoder',
  'editor', 'colorblind-sim', 'colour-converter', 'contrast-checker',
  'gradient-genny', 'harmony-genny', 'palette-collection', 'palette-extractor',
  'palette-genny', 'pixel-picker', 'tailwind-shades', 'doc-converter',
  'text-editor', 'font-explorer', 'glyph-browser', 'large-type',
  'line-height-calc', 'paper-sizes', 'px-to-rem', 'text-diff', 'typo-calc',
  'word-counter', 'pdf-preflight', 'imposer', 'zine-imposer', 'code-genny',
  'decoder', 'meta-tag-genny', 'qr-genny', 'regex-tester',
  'tailwind-cheatsheet', 'markdown-writer', 'algebra-calc', 'base-converter',
  'encoder', 'graph-calc', 'sci-calc', 'time-calc', 'unit-converter',
  'shavian-transliterator',
] as const;

const EXPECTED_CALIBRATED_DESCRIPTIONS = {
  'artwork-enhancer': '调整图片对比度、饱和度、锐度与放大效果；彩色噪声纹理仍待补齐。',
  'background-remover': '使用边缘连通与颜色容差生成透明背景，复杂背景和毛发效果有限。',
  'image-converter': '在浏览器支持范围内转换 PNG、JPEG 和 WebP；其他格式与尺寸调整仍待补齐。',
  editor: '在画布中组合图片、文字和基础形状，并管理图层与导出 PNG。',
  'colour-converter': '在 HEX、RGB 和 HSL 三种颜色格式之间转换。',
  'gradient-genny': '生成基础双色渐变并复制 CSS。',
  'paper-sizes': '查询当前内置的常见纸张规格。',
  'pdf-preflight': '分析 PDF 的页数、页面尺寸、方向和基础元数据。',
  'tailwind-cheatsheet': '搜索当前内置的常用 Tailwind CSS 类名。',
  'shavian-transliterator': '使用有限字母规则近似转换英文文本，不等同于发音词典转写。',
} as const;

describe('工具注册表', () => {
  it('精确注册 56 个稳定且唯一的工具 ID', () => {
    expect(TOOLS.map((tool) => tool.id).sort()).toEqual([...EXPECTED_TOOL_IDS].sort());
    expect(new Set(TOOLS.map((tool) => tool.id)).size).toBe(TOOLS.length);
    expect(TOOLS).toHaveLength(56);
  });

  it('每个工具都有完整中文标题、说明和关键词', () => {
    for (const tool of TOOLS) {
      expect(tool.title, tool.id).toMatch(/[\u4e00-\u9fff]/);
      expect(tool.description, tool.id).toMatch(/[\u4e00-\u9fff]/);
      expect(tool.keywords.join(''), tool.id).toMatch(/[\u4e00-\u9fff]/);
    }
  });

  it('每个工具 ID 恰好映射到一个可动态加载的工作区', () => {
    for (const tool of TOOLS) {
      expect(Object.keys(WORKSPACE_LOADERS).filter((workspace) => workspace === tool.workspace), tool.id).toHaveLength(1);
      expect(WORKSPACE_LOADERS[tool.workspace], tool.id).toBeTypeOf('function');
    }
  });

  it('中文搜索能找到图片格式转换', () => {
    expect(searchTools('格式转换').map((tool) => tool.id)).toContain('image-converter');
  });

  it.each(Object.entries(EXPECTED_CALIBRATED_DESCRIPTIONS))('%s 的目录描述与校准文案完全一致', (toolId, expectedDescription) => {
    expect(getToolById(toolId as ToolId)?.description, toolId).toBe(expectedDescription);
  });

  it('能按 ID 取得独立编辑器入口', () => {
    expect(getToolById('editor')?.title).toBe('Substrata 图片编辑器');
  });
});
