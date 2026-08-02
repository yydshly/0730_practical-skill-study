/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToolPage } from '../src/app/ToolPage';
import { testRegex, type RegexTestResult } from '../src/engines/developer';
import { renderAfterLazy } from './render-after-lazy';

class ImmediateRegexWorker {
  onmessage: ((event: MessageEvent<{ id: number; result: RegexTestResult }>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  postMessage(input: { id: number; pattern: string; flags: string; sample: string }) {
    queueMicrotask(() => this.onmessage?.({
      data: { id: input.id, result: testRegex(input.pattern, input.flags, input.sample) },
    } as MessageEvent<{ id: number; result: RegexTestResult }>));
  }

  terminate() {}
}

beforeEach(() => {
  vi.stubGlobal('Worker', ImmediateRegexWorker);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function renderTool(toolId: string) {
  return renderAfterLazy(<ToolPage toolId={toolId} />);
}

describe('十个开发与编码入口', () => {
  it.each([
    ['code-genny', '条码格式'],
    ['decoder', '解码方式'],
    ['meta-tag-genny', '页面标题'],
    ['qr-genny', '二维码内容'],
    ['regex-tester', '正则表达式'],
    ['tailwind-cheatsheet', '搜索 Tailwind 类名'],
    ['markdown-writer', '待处理文本'],
    ['base-converter', '原始进制'],
    ['encoder', '编码输入'],
    ['shavian-transliterator', '英文原文'],
  ])('%s 显示专属中文控件', async (toolId, label) => {
    const { unmount } = await renderTool(toolId);
    expect(screen.getByLabelText(label)).toBeVisible();
    expect(document.querySelector('.developer-workspace')).not.toBeNull();
    unmount();
  });

  it('只接管指定十个入口，PDF 工具使用高级工作区', async () => {
    await renderTool('pdf-preflight');
    expect(screen.getByLabelText('PDF 印刷预检 工作区')).toBeVisible();
    expect(document.querySelector('.developer-workspace')).toBeNull();
  });
});

describe('开发工作台关键交互', () => {
  it('正则测试器显示匹配文本、索引、捕获组并安全呈现错误', async () => {
    const user = userEvent.setup();
    await renderTool('regex-tester');
    const pattern = screen.getByLabelText('正则表达式');
    const flags = screen.getByLabelText('正则标志');
    const sample = screen.getByLabelText('样本文本');

    await user.clear(pattern);
    await user.type(pattern, '(a)(b)');
    await user.clear(flags);
    await user.type(flags, 'g');
    await user.clear(sample);
    await user.type(sample, 'zab');

    expect(await screen.findByText('ab')).toBeVisible();
    expect(screen.getByText('索引 1')).toBeVisible();
    expect(screen.getByText('捕获组：a、b')).toBeVisible();

    await user.clear(pattern);
    await user.type(pattern, '(');
    expect(await screen.findByRole('alert')).toHaveTextContent('正则表达式无效');
  });

  it('正则 Worker 超时后会终止隔离计算并显示中文错误', async () => {
    class HangingRegexWorker {
      onmessage = null;
      onerror = null;
      postMessage() {}
      terminate() {}
    }
    vi.stubGlobal('Worker', HangingRegexWorker);

    await renderTool('regex-tester');

    expect(await screen.findByRole('alert', {}, { timeout: 1_500 })).toHaveTextContent('正则计算超时');
  });

  it('正则 Worker 无法启动时显示可恢复的中文错误', async () => {
    class BlockedRegexWorker {
      constructor() {
        throw new Error('CSP blocked worker');
      }
    }
    vi.stubGlobal('Worker', BlockedRegexWorker);

    await renderTool('regex-tester');

    expect(await screen.findByRole('alert')).toHaveTextContent('无法启动安全的正则隔离区');
  });

  it('编码、解码和哈希分区清晰且 Base64 保留 Unicode', async () => {
    const user = userEvent.setup();
    await renderTool('encoder');

    expect(screen.getByRole('heading', { name: '编码' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '解码' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '哈希' })).toBeVisible();

    const input = screen.getByLabelText('编码输入');
    await user.clear(input);
    await user.type(input, '你好');
    await user.click(screen.getByRole('button', { name: 'Base64 编码' }));
    expect(screen.getByLabelText('编码结果')).toHaveTextContent('5L2g5aW9');

    fireEvent.change(screen.getByLabelText('解码输入'), { target: { value: '5L2g5aW9' } });
    await user.click(screen.getByRole('button', { name: 'Base64 解码' }));
    expect(screen.getByLabelText('解码结果')).toHaveTextContent('你好');
  });

  it('Meta 源码转义危险字符并支持真实下载', async () => {
    const user = userEvent.setup();
    const blobs: Blob[] = [];
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((blob: Blob) => { blobs.push(blob); return 'blob:meta'; }),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    await renderTool('meta-tag-genny');

    fireEvent.change(screen.getByLabelText('页面标题'), { target: { value: '<script>& 标题' } });
    expect(screen.getByLabelText('Meta HTML 源码')).toHaveTextContent('&lt;script&gt;&amp; 标题');
    expect(screen.getByLabelText('Meta HTML 源码')).not.toHaveTextContent('<script>');

    await user.click(screen.getByRole('button', { name: '下载 Meta HTML' }));
    expect(blobs[0]).toBeInstanceOf(Blob);
    expect(blobs[0]?.type).toBe('text/html;charset=utf-8');
  });

  it('文本处理执行转换，并可重置和下载结果', async () => {
    const user = userEvent.setup();
    const blobs: Blob[] = [];
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((blob: Blob) => { blobs.push(blob); return 'blob:text'; }),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    await renderTool('markdown-writer');

    fireEvent.change(screen.getByLabelText('待处理文本'), { target: { value: '  b  \n a \n b ' } });
    await user.selectOptions(screen.getByLabelText('处理方式'), 'deduplicate');
    await user.click(screen.getByRole('button', { name: '应用处理' }));
    expect(screen.getByLabelText('处理结果文本')).toHaveValue('b\na');

    await user.click(screen.getByRole('button', { name: '下载文本' }));
    expect(blobs[0]?.type).toBe('text/plain;charset=utf-8');
    await user.click(screen.getByRole('button', { name: '重置文本' }));
    expect(screen.getByLabelText('处理结果文本')).toHaveValue('');
  });

  it('Shavian 页面说明映射边界并保留未知文字', async () => {
    await renderTool('shavian-transliterator');
    fireEvent.change(screen.getByLabelText('英文原文'), { target: { value: 'Hi, 世界!' } });
    expect(screen.getByText(/基于规则和显式映射/)).toBeVisible();
    expect(screen.getByLabelText('Shavian 转写结果')).toHaveTextContent('世界!');
  });

  it('条形码和二维码生成真实 SVG 并提供下载', async () => {
    await renderTool('code-genny');
    expect(await screen.findByLabelText('条形码 SVG 预览')).toContainHTML('<svg');
    expect(screen.getByRole('button', { name: '下载条形码 SVG' })).toBeVisible();
    cleanup();

    await renderTool('qr-genny');
    await waitFor(() => expect(screen.getByLabelText('二维码 SVG 预览')).toContainHTML('<svg'));
    expect(screen.getByRole('button', { name: '下载二维码 SVG' })).toBeVisible();
  });
});
