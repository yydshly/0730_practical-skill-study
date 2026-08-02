/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '../src/app/App';
import { renderAfterLazy } from './render-after-lazy';
import { IMAGE_FIXTURES } from './fixtures/image-fixtures';

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

const TOOL_CASES = [
  ['matte-generator', '方形衬底', '画布尺寸'],
  ['scroll-generator', '无缝轮播拆分', '单片高度'],
  ['social-cropper', '社交媒体裁剪', '裁剪场景'],
  ['watermarker', '图片水印', '水印类型'],
  ['artwork-enhancer', '艺术品增强', '对比度'],
  ['favicon-genny', 'Favicon 生成器', '图标尺寸'],
  ['image-clipper', '透明边缘裁剪', '裁剪方式'],
  ['image-converter', '图片格式转换', '输出格式'],
  ['image-splitter', '图片分割', '分割列数'],
  ['image-stitcher', '图片拼接', '拼接方向'],
  ['paste-image', '剪贴板图片', '粘贴剪贴板图片'],
  ['placeholder-genny', '占位图生成器', '占位文字'],
  ['base64-image-encoder', '图片 Base64 编码', '图片 Data URL'],
] as const;

async function renderTool(toolId: string) {
  window.history.replaceState({}, '', `/tools/${toolId}`);
  return renderAfterLazy(<App />);
}

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevokeObjectURL });
});

describe('图片工具路由', () => {
  it.each(TOOL_CASES)('%s 显示不同中文标题、关键控件与本地处理入口', async (toolId, title, control) => {
    const { unmount } = await renderTool(toolId);
    expect(screen.getByRole('heading', { name: title })).toBeVisible();
    expect(screen.getByLabelText(control)).toBeVisible();
    expect(screen.getByRole('button', { name: '选择或拖放文件' })).toBeVisible();
    expect(screen.getByText(/只在你的设备本地处理/)).toBeVisible();
    unmount();
  });

  it.each(TOOL_CASES.filter(([id]) => !['paste-image', 'placeholder-genny', 'base64-image-encoder'].includes(id)))('%s 的文件核心交互拒绝非图片并保持错误状态', async (toolId) => {
    await renderTool(toolId);
    fireEvent.change(screen.getByLabelText('选择文件'), {
      target: { files: [new File(['文本'], 'note.txt', { type: 'text/plain' })] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('请选择图片文件');
  });

  it('社交裁剪可切换中文场景并显示对应比例', async () => {
    await renderTool('social-cropper');
    await userEvent.selectOptions(screen.getByLabelText('裁剪场景'), 'story');
    expect(screen.getByText('竖屏故事 · 9:16')).toBeVisible();
  });

  it('图片水印可在文字和图片类型之间切换', async () => {
    await renderTool('watermarker');
    expect(screen.getByLabelText('水印文字')).toBeVisible();
    await userEvent.selectOptions(screen.getByLabelText('水印类型'), 'image');
    expect(screen.getByLabelText('选择水印图片')).toBeVisible();
  });

  it('拼接工具允许横向与纵向切换并支持多选', async () => {
    await renderTool('image-stitcher');
    await userEvent.selectOptions(screen.getByLabelText('拼接方向'), 'vertical');
    expect(screen.getByLabelText('拼接方向')).toHaveValue('vertical');
    expect(screen.getByLabelText('选择文件')).toHaveAttribute('multiple');
  });

  it('占位图核心交互生成可下载的安全 SVG', async () => {
    await renderTool('placeholder-genny');
    await userEvent.clear(screen.getByLabelText('占位文字'));
    await userEvent.type(screen.getByLabelText('占位文字'), '<标题>');
    await userEvent.click(screen.getByRole('button', { name: '生成占位图' }));
    expect(screen.getByRole('status')).toHaveTextContent('占位图已生成');
    expect(screen.getByRole('button', { name: '下载 SVG' })).toBeVisible();
  });

  it('新上传校验失败会清除旧的成功图片结果', async () => {
    await renderTool('placeholder-genny');
    await userEvent.click(screen.getByRole('button', { name: '生成占位图' }));
    expect(screen.getByRole('button', { name: '下载 SVG' })).toBeVisible();

    fireEvent.change(screen.getByLabelText('选择文件'), {
      target: { files: [new File(['文本'], 'note.txt', { type: 'text/plain' })] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('请选择图片文件');
    expect(screen.queryByRole('button', { name: '下载 SVG' })).toBeNull();
  });

  it('替换结果和卸载工作区都会释放对象 URL', async () => {
    const createObjectURL = vi.fn()
      .mockReturnValueOnce('blob:placeholder-first')
      .mockReturnValueOnce('blob:placeholder-second');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    const { unmount } = await renderTool('placeholder-genny');

    await userEvent.click(screen.getByRole('button', { name: '生成占位图' }));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));

    await userEvent.clear(screen.getByLabelText('占位文字'));
    await userEvent.type(screen.getByLabelText('占位文字'), '第二张占位图');
    await userEvent.click(screen.getByRole('button', { name: '生成占位图' }));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(2));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:placeholder-first');

    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:placeholder-second');
  });

  it('Base64 核心交互解析有效 Data URL，失败后清除旧结果', async () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:base64-test') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    class ImmediateImage {
      onload: ((event: Event) => void) | null = null;
      onerror: ((event: Event | string) => void) | null = null;
      naturalWidth = 1;
      naturalHeight = 1;
      width = 1;
      height = 1;
      set src(_value: string) { queueMicrotask(() => this.onload?.(new Event('load'))); }
    }
    vi.stubGlobal('Image', ImmediateImage as unknown as typeof Image);
    await renderTool('base64-image-encoder');
    const input = screen.getByLabelText('图片 Data URL');
    await userEvent.type(input, `data:image/png;base64,${IMAGE_FIXTURES.png.base64}`);
    await userEvent.click(screen.getByRole('button', { name: '解析 Data URL' }));
    expect(screen.getByRole('status')).toHaveTextContent('已解析 image/png 图片');
    expect(screen.getByRole('button', { name: '下载解码图片' })).toBeVisible();
    expect(screen.getByRole('button', { name: '复制 Data URL' })).toBeVisible();

    await userEvent.clear(input);
    await userEvent.type(input, '错误内容');
    await userEvent.click(screen.getByRole('button', { name: '解析 Data URL' }));
    expect(screen.getByRole('alert')).toHaveTextContent('图片 Data URL 格式无效');
    expect(screen.queryByRole('button', { name: '下载解码图片' })).toBeNull();
    expect(screen.queryByRole('button', { name: '复制 Data URL' })).toBeNull();
  });

  it('格式转换器只启用真实支持格式并解释禁用项', async () => {
    await renderTool('image-converter');
    const gif = screen.getByRole('option', { name: /GIF/ });
    expect(gif).toBeDisabled();
    expect(screen.getByText(/GIF.*无法可靠编码/)).toBeVisible();
  });

  it('剪贴板读取失败时显示中文错误且没有遗留成功下载', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { read: vi.fn().mockRejectedValue(new Error('permission denied')) },
    });
    await renderTool('paste-image');
    await userEvent.click(screen.getByRole('button', { name: '粘贴剪贴板图片' }));
    expect(screen.getByRole('alert')).toHaveTextContent('无法读取剪贴板图片');
    expect(screen.queryByRole('button', { name: /下载/ })).toBeNull();
  });
});
