/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '../src/app/App';
import { renderAfterLazy } from './render-after-lazy';

type ControlledImageInstance = {
  onload: (() => void) | null;
  onerror: (() => void) | null;
  naturalWidth: number;
  naturalHeight: number;
  src: string;
};

const TOOL_ENTRIES = [
  ['colorblind-sim', '色盲模拟器'],
  ['colour-converter', '颜色格式转换'],
  ['contrast-checker', '对比度检查'],
  ['gradient-genny', '渐变生成器'],
  ['harmony-genny', '配色和谐生成器'],
  ['palette-collection', '调色板收藏'],
  ['palette-extractor', '图片调色板提取'],
  ['palette-genny', '调色板生成器'],
  ['pixel-picker', '像素取色器'],
  ['tailwind-shades', 'Tailwind 色阶生成器'],
] as const;
const originalClipboard = navigator.clipboard;

async function renderTool(toolId: string) {
  window.history.replaceState({}, '', `/tools/${toolId}`);
  return renderAfterLazy(<App />);
}

function installControlledImage() {
  const images: ControlledImageInstance[] = [];
  class ControlledImage implements ControlledImageInstance {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 2;
    naturalHeight = 2;
    private source = '';

    set src(value: string) {
      this.source = value;
    }

    get src() {
      return this.source;
    }

    constructor() {
      images.push(this);
    }
  }
  vi.stubGlobal('Image', ControlledImage);
  return images;
}

function uploadImage(file = new File(['image'], 'local.png', { type: 'image/png' })) {
  fireEvent.change(screen.getByLabelText('选择文件'), { target: { files: [file] } });
}

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
  window.localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: originalClipboard });
});

describe('颜色工具工作区', () => {
  it.each(TOOL_ENTRIES)('入口 %s 呈现标题和专属控件', async (toolId, title) => {
    const { unmount } = await renderTool(toolId);
    expect(screen.getByRole('heading', { name: title })).toBeVisible();
    if (toolId === 'colorblind-sim') expect(screen.getByRole('combobox', { name: '模拟模式' })).toBeVisible();
    if (toolId === 'colour-converter') expect(screen.getByRole('textbox', { name: '输入颜色' })).toBeVisible();
    if (toolId === 'contrast-checker') expect(screen.getByRole('textbox', { name: '前景色' })).toBeVisible();
    if (toolId === 'gradient-genny') expect(screen.getByRole('combobox', { name: '渐变类型' })).toBeVisible();
    if (toolId === 'harmony-genny') expect(screen.getByRole('combobox', { name: '配色方案' })).toBeVisible();
    if (toolId === 'palette-collection') expect(screen.getAllByRole('button', { name: '收藏调色板' })).not.toHaveLength(0);
    if (toolId === 'palette-extractor' || toolId === 'pixel-picker') expect(screen.getByRole('button', { name: '选择或拖放文件' })).toBeVisible();
    if (toolId === 'palette-genny') expect(screen.getByRole('textbox', { name: '生成种子' })).toBeVisible();
    if (toolId === 'tailwind-shades') expect(screen.getByText(/500 · #3b82f6 · oklch\(/u)).toBeVisible();
    unmount();
  });

  it('颜色路由呈现可操作的转换工作区且不接管二维码路由', async () => {
    const { unmount } = await renderTool('colour-converter');
    expect(screen.getByRole('textbox', { name: '输入颜色' })).toHaveValue('#3b82f6');
    expect(screen.getByText('HEX')).toBeVisible();
    unmount();

    await renderTool('qr-genny');
    expect(screen.getByLabelText('二维码内容')).toBeVisible();
    expect(document.querySelector('.color-workspace')).toBeNull();
  });

  it('转换器展示八种格式，并逐项复制 OKLCH 后提供中文反馈', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await renderTool('colour-converter');

    expect(document.querySelectorAll('.conversion-result dt')).toHaveLength(8);
    expect(screen.getByText('Decimal RGB')).toBeVisible();
    expect(screen.getByText('OKLCH')).toBeVisible();
    expect(screen.getByRole('button', { name: '复制 OKLCH' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '复制 OKLCH' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('oklch(62.3% 0.188 259.81)'));
    expect(screen.getByRole('status')).toHaveTextContent('已复制 OKLCH');
  });

  it('转换器逐项复制失败时显示中文错误', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('browser denied'));
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await renderTool('colour-converter');

    await user.click(screen.getByRole('button', { name: '复制 Lab' }));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.getByRole('status')).toHaveTextContent('复制 Lab 失败，请重试');
  });

  it('和谐工具提供十二个中文方案，并复制全部颜色和 CSS 变量', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await renderTool('harmony-genny');

    expect(screen.getAllByRole('option')).toHaveLength(12);
    expect(screen.getByRole('option', { name: '方形配色' })).toBeVisible();
    expect(screen.getByRole('option', { name: '强调类似色' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: '复制全部颜色' }));
    await user.click(screen.getByRole('button', { name: '复制 CSS Variables' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    expect(writeText.mock.calls[0][0]).toMatch(/^#[0-9a-f]{6}(\n#[0-9a-f]{6})+$/u);
    expect(writeText.mock.calls[1][0]).toMatch(/^:root \{\n  --harmony-1: #[0-9a-f]{6};/u);
  });

  it('Tailwind 工具以 vivid 模式展示同源 HEX/OKLCH，并提供可复制和下载导出', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    let downloadedBlob: Blob | undefined;
    const downloadedNames: string[] = [];
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((blob: Blob) => {
        downloadedBlob = blob;
        return 'blob:tailwind-colors';
      }),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function recordDownload(this: HTMLAnchorElement) {
      downloadedNames.push(this.download);
    });
    await renderTool('tailwind-shades');

    expect(screen.getByRole('textbox', { name: '色阶名称' })).toHaveValue('brand');
    expect(screen.getByRole('combobox', { name: '生成模式' })).toHaveValue('balanced');
    expect(screen.getByRole('button', { name: '复制 CSS Variables' })).toBeVisible();
    expect(screen.getByRole('button', { name: '下载 Tailwind 配置' })).toBeVisible();

    await user.selectOptions(screen.getByRole('combobox', { name: '生成模式' }), 'vivid');

    expect(screen.getByText(/500 · #[0-9a-f]{6} · oklch\(/u)).toBeVisible();
    await user.click(screen.getByRole('button', { name: '下载 Tailwind 配置' }));
    expect(downloadedNames).toEqual(['tailwind-colors.js']);
    expect(downloadedBlob?.type).toBe('text/javascript;charset=utf-8');
    const downloadedModule = await downloadedBlob?.text();
    const importedDownload = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(downloadedModule ?? '')}`);
    expect(importedDownload.default).toHaveProperty('brand');
    expect(importedDownload.default.brand).toMatchObject({ 50: '#f0f6ff', 500: '#3381ff', 950: '#001433' });

    await user.click(screen.getByRole('button', { name: '复制 CSS Variables' }));
    await user.click(screen.getByRole('button', { name: '复制 Tailwind 配置' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    expect(writeText.mock.calls[0][0]).toContain('--brand-50:');
    const importedCopy = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(writeText.mock.calls[1][0])}`);
    expect(importedCopy.default.brand).toMatchObject({ 50: '#f0f6ff', 500: '#3381ff', 950: '#001433' });
  });

  it('图片工具拒绝空选择且不会创建 Object URL', async () => {
    const createObjectURL = vi.fn(() => 'blob:unexpected');
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
    await renderTool('palette-extractor');

    fireEvent.change(screen.getByLabelText('选择文件'), { target: { files: [] } });

    expect(screen.getByRole('alert')).toHaveTextContent('请选择一张图片');
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('图片读取期间显示状态，原始读取异常显示中文错误并清理 Object URL', async () => {
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:local-image'), revokeObjectURL });
    const images = installControlledImage();
    await renderTool('palette-extractor');

    uploadImage();
    expect(screen.getByRole('status')).toHaveTextContent('正在读取图片');

    images[0].onerror?.();
    expect(await screen.findByRole('alert')).toHaveTextContent('图片读取失败，请重试');
    expect(screen.getByRole('alert')).not.toHaveTextContent('network decoder exploded');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:local-image');
  });

  it('浏览器底层抛出的英文读取异常会显示为中文可恢复错误', async () => {
    vi.stubGlobal('URL', {
      createObjectURL: () => { throw new Error('native decoder failed'); },
      revokeObjectURL: vi.fn(),
    });
    await renderTool('palette-extractor');

    uploadImage();

    expect(await screen.findByRole('alert')).toHaveTextContent('图片读取失败，请重试');
    expect(screen.getByRole('alert')).not.toHaveTextContent('native decoder failed');
  });

  it('像素取色器以方向键调整坐标', async () => {
    const images = installControlledImage();
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:pixel'), revokeObjectURL: vi.fn() });
    const context = {
      drawImage: vi.fn(),
      getImageData: () => ({ data: new Uint8ClampedArray([1, 2, 3, 255, 9, 8, 7, 255]) }),
      putImageData: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.stubGlobal('ImageData', class { constructor(..._args: unknown[]) {} });
    await renderTool('pixel-picker');

    uploadImage();
    images[0].onload?.();
    const canvas = await screen.findByLabelText('图片像素取色区域');
    fireEvent.keyDown(canvas, { key: 'ArrowRight' });

    await waitFor(() => expect(screen.getByRole('spinbutton', { name: '坐标 X' })).toHaveValue(1));
    expect(screen.getByRole('spinbutton', { name: '坐标 Y' })).toHaveValue(0);
  });

  it('收藏持久化，并在损坏的本地数据上回退为空列表', async () => {
    window.localStorage.setItem('delphitools-palette-favorites', '{not-json');
    const user = userEvent.setup();
    const { unmount } = await renderTool('palette-collection');

    const favorite = screen.getAllByRole('button', { name: '收藏调色板' })[0];
    await user.click(favorite);
    expect(window.localStorage.getItem('delphitools-palette-favorites')).toBe('["sea-glass"]');
    expect(screen.getByRole('button', { name: '取消收藏' })).toBeVisible();
    unmount();

    await renderTool('palette-collection');
    expect(screen.getByRole('button', { name: '取消收藏' })).toBeVisible();
  });
});
