import { describe, expect, it } from 'vitest';

import { getToolById, searchTools, TOOLS } from '../src/data/tools';
import { WORKSPACE_LOADERS } from '../src/app/ToolPage';

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

  it('能按 ID 取得独立编辑器入口', () => {
    expect(getToolById('editor')?.title).toBe('Substrata 图片编辑器');
  });
});
