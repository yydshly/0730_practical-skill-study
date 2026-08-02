/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToolPage } from '../src/app/ToolPage';
import { renderAfterLazy } from './render-after-lazy';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function renderTool(toolId: string) {
  return renderAfterLazy(<ToolPage toolId={toolId} />);
}

function minimalSfntFont(): ArrayBuffer {
  const buffer = new ArrayBuffer(70);
  const view = new DataView(buffer);
  view.setUint32(0, 0x00010000);
  view.setUint16(4, 2);
  ['head', 'maxp'].forEach((tag, tableIndex) => {
    const record = 12 + tableIndex * 16;
    Array.from(tag).forEach((character, index) => view.setUint8(record + index, character.charCodeAt(0)));
  });
  view.setUint32(20, 44);
  view.setUint32(24, 20);
  view.setUint32(36, 64);
  view.setUint32(40, 6);
  view.setUint16(62, 1000);
  view.setUint32(64, 0x00010000);
  view.setUint16(68, 3);
  return buffer;
}

describe('11 个文字工具入口', () => {
  it.each([
    ['doc-converter', '输入格式'],
    ['text-editor', 'Markdown 源文'],
    ['font-explorer', '选择或拖放文件'],
    ['glyph-browser', 'Unicode 区段'],
    ['large-type', '展示文字'],
    ['line-height-calc', '字号（px）'],
    ['paper-sizes', '纸张规格'],
    ['px-to-rem', '像素值'],
    ['text-diff', '原始文本'],
    ['typo-calc', '原始单位'],
    ['word-counter', '待统计文本'],
  ])('%s 显示独立中文控件和可用默认值', async (toolId, label) => {
    const { unmount } = await renderTool(toolId);
    expect(screen.getByLabelText(label)).toBeVisible();
    expect(document.querySelector('.text-workspace')).not.toBeNull();
    unmount();
  });

  it('只接管指定文字入口，PDF 工具使用高级工作区', async () => {
    await renderTool('pdf-preflight');
    expect(screen.getByLabelText('PDF 印刷预检 工作区')).toBeVisible();
    expect(document.querySelector('.text-workspace')).toBeNull();
  });
});

describe('文档与 Markdown UI', () => {
  it('文档转换器提供真实 DOCX 与 EPUB 下载并说明格式边界', async () => {
    const user = userEvent.setup();
    const downloaded: Blob[] = [];
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((blob: Blob) => { downloaded.push(blob); return 'blob:document'; }),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    await renderTool('doc-converter');

    await user.selectOptions(screen.getByLabelText('输出格式'), 'docx');
    await user.click(screen.getByRole('button', { name: '下载 DOCX' }));
    expect(downloaded[0]?.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    await user.selectOptions(screen.getByLabelText('输出格式'), 'epub');
    await user.click(screen.getByRole('button', { name: '下载 EPUB' }));
    expect(downloaded[1]?.type).toBe('application/epub+zip');
    expect(screen.getByText(/DOCX 为基础文字 OOXML/)).toBeVisible();
  });

  it('Markdown 源文和安全预览可切换，并提供两种真实下载', async () => {
    const user = userEvent.setup();
    await renderTool('text-editor');
    const source = screen.getByLabelText('Markdown 源文');
    fireEvent.change(source, { target: { value: '# 标题\n\n<script>alert(1)</script>' } });

    await user.click(screen.getByRole('button', { name: '查看预览' }));

    const preview = screen.getByRole('region', { name: 'Markdown 预览' });
    expect(preview.querySelector('script')).toBeNull();
    expect(preview).toHaveTextContent('<script>alert(1)</script>');
    expect(screen.getByRole('button', { name: '下载 Markdown' })).toBeVisible();
    expect(screen.getByRole('button', { name: '下载 HTML' })).toBeVisible();
  });

  it('文档转换器生成真实 HTML 和纯文本并显示格式限制', async () => {
    const user = userEvent.setup();
    await renderTool('doc-converter');
    fireEvent.change(screen.getByLabelText('文档内容'), { target: { value: '# 标题' } });
    expect(screen.getByLabelText('转换结果')).toHaveTextContent('<h1>标题</h1>');
    expect(screen.getByText(/Word 和 EPUB/)).toBeVisible();
    expect(screen.getByRole('button', { name: '下载 HTML' })).toBeVisible();

    await user.selectOptions(screen.getByLabelText('输出格式'), 'text');
    expect(screen.getByLabelText('转换结果')).toHaveTextContent(/^标题$/);
    expect(screen.getByRole('button', { name: '下载纯文本' })).toBeVisible();
  });

  it('无效数字实体显示中文警告，安全替换后页面仍可继续转换', async () => {
    const user = userEvent.setup();
    await renderTool('doc-converter');

    await user.selectOptions(screen.getByLabelText('输入格式'), 'html');
    fireEvent.change(screen.getByLabelText('文档内容'), {
      target: { value: '<p>&#x110000; / &#55296; / 正文</p>' },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('文档包含无效的字符实体，已安全替换');
    expect(screen.getByLabelText('转换结果')).toHaveTextContent('� / � / 正文');

    await user.selectOptions(screen.getByLabelText('输出格式'), 'text');
    expect(screen.getByLabelText('转换结果')).toHaveTextContent('� / � / 正文');

    fireEvent.change(screen.getByLabelText('文档内容'), { target: { value: '<p>正常正文</p>' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('转换结果')).toHaveTextContent('正常正文');
  });
});

describe('字体、字形和文本反馈', () => {
  it('通用 MIME 的合法 TTF 通过扩展名和 SFNT 内容校验', async () => {
    await renderTool('font-explorer');
    const file = new File(['font'], 'valid.ttf', { type: 'application/octet-stream' });
    const read = vi.fn().mockResolvedValue(minimalSfntFont());
    Object.defineProperty(file, 'arrayBuffer', { value: read });

    fireEvent.change(screen.getByLabelText('选择文件'), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText('字形数量')).toBeVisible());
    expect(screen.getByText('3')).toBeVisible();
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('通用 MIME 的非字体扩展在读取内容前中文拒绝', async () => {
    await renderTool('font-explorer');
    const file = new File(['font'], 'not-font.bin', { type: 'application/octet-stream' });
    const read = vi.fn().mockResolvedValue(minimalSfntFont());
    Object.defineProperty(file, 'arrayBuffer', { value: read });

    fireEvent.change(screen.getByLabelText('选择文件'), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('请选择 TTF 或 OTF 字体文件'));
    expect(read).not.toHaveBeenCalled();
  });

  it('字体浏览器只读取单文件选择中的第一个文件并中文报告损坏', async () => {
    await renderTool('font-explorer');
    const first = new File(['bad'], 'first.ttf', { type: 'font/ttf' });
    const second = new File(['ignored'], 'second.ttf', { type: 'font/ttf' });
    const firstRead = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
    const secondRead = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
    Object.defineProperty(first, 'arrayBuffer', { value: firstRead });
    Object.defineProperty(second, 'arrayBuffer', { value: secondRead });

    fireEvent.change(screen.getByLabelText('选择文件'), { target: { files: [first, second] } });

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('字体文件无效或已损坏'));
    expect(firstRead).toHaveBeenCalledTimes(1);
    expect(secondRead).not.toHaveBeenCalled();
  });

  it('Unicode 浏览器默认最多渲染 120 个节点并可按码点精确搜索', async () => {
    const user = userEvent.setup();
    await renderTool('glyph-browser');
    expect(document.querySelectorAll('.glyph-card')).toHaveLength(120);

    const search = screen.getByLabelText('搜索字符或码点');
    await user.type(search, 'U+4E2D');

    expect(document.querySelectorAll('.glyph-card')).toHaveLength(1);
    expect(screen.getByRole('button', { name: '复制 中 U+4E2D' })).toBeVisible();
  });

  it('文本差异同时提供语义标签和文字摘要', async () => {
    await renderTool('text-diff');
    fireEvent.change(screen.getByLabelText('原始文本'), { target: { value: 'cat' } });
    fireEvent.change(screen.getByLabelText('修改后文本'), { target: { value: 'cart' } });

    expect(screen.getByText('新增 1 个字符，删除 0 个字符')).toBeVisible();
    expect(document.querySelector('ins')).toHaveTextContent('r');
    expect(screen.getByLabelText('文本差异结果')).toHaveTextContent('新增：r');
  });

  it('无效根字号显示中文反馈，大字在 390px 下使用受限响应字号', async () => {
    const user = userEvent.setup();
    await renderTool('px-to-rem');
    const root = screen.getByLabelText('根字号');
    await user.clear(root);
    await user.type(root, '0');
    expect(screen.getByRole('alert')).toHaveTextContent('根字号必须是大于 0 的数字');
    cleanup();

    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    await renderTool('large-type');
    expect(screen.getByLabelText('大字预览')).toHaveStyle({ maxWidth: '100%' });
    expect(screen.getByLabelText('大字预览')).toHaveTextContent('让重要文字清晰可见');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
  });
});
