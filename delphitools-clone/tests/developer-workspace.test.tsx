/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToolPage } from '../src/app/ToolPage';
import { REGEX_PRESETS } from '../src/data/regexPresets';
import { testRegex, type RegexTestResult } from '../src/engines/developer';
import { renderAfterLazy } from './render-after-lazy';

const componentStyles = readFileSync(resolve(process.cwd(), 'src/styles/components.css'), 'utf8');

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
    ['base-converter', '二进制'],
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

  it('解码器提供 Vigenere、Morse、十六进制和 Base64 手动选项及密码参考', async () => {
    const user = userEvent.setup();
    await renderTool('decoder');

    const method = screen.getByLabelText('解码方式');
    expect(screen.getByRole('option', { name: 'Vigenere' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Morse' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '十六进制 UTF-8' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Base64' })).toBeInTheDocument();
    await user.selectOptions(method, 'vigenere');
    expect(screen.getByLabelText('密钥')).toBeVisible();
    expect(screen.getByText('密码参考')).toBeVisible();
  });

  it('自动模式显示带方法标签的 Base64 候选', async () => {
    const user = userEvent.setup();
    await renderTool('decoder');

    fireEvent.change(screen.getByLabelText('密文'), { target: { value: 'SGVsbG8gd29ybGQ=' } });
    await user.selectOptions(screen.getByLabelText('解码方式'), 'auto');
    expect(await screen.findByLabelText('自动识别候选')).toHaveTextContent('Base64');
    expect(screen.getByLabelText('自动识别候选')).toHaveTextContent('Hello world');
  });

  it('Vigenere 的空密钥显示中文错误而不回显密文', async () => {
    const user = userEvent.setup();
    await renderTool('decoder');

    fireEvent.change(screen.getByLabelText('密文'), { target: { value: 'LXFOPVEFRNHR' } });
    await user.selectOptions(screen.getByLabelText('解码方式'), 'vigenere');
    await user.clear(screen.getByLabelText('密钥'));
    expect(screen.getByRole('alert')).toHaveTextContent('Vigenere 密钥不能为空');
    expect(screen.queryByLabelText('解码结果')).not.toBeInTheDocument();
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

  it('Meta 支持社交字段并以本地占位预览分享图片', async () => {
    const user = userEvent.setup();
    await renderTool('meta-tag-genny');

    fireEvent.change(screen.getByLabelText('站点名称'), { target: { value: '本地工具站' } });
    fireEvent.change(screen.getByLabelText('Twitter 账号'), { target: { value: '@@local-tools' } });
    await user.selectOptions(screen.getByLabelText('Twitter 卡片'), 'summary_large_image');
    fireEvent.change(screen.getByLabelText('分享图片网址'), { target: { value: 'https://cdn.example.com/card.png' } });

    expect(screen.getByLabelText('Meta HTML 源码')).toHaveTextContent('twitter:site" content="@local-tools');
    const preview = screen.getByLabelText('社交分享预览');
    expect(preview).toHaveTextContent('本地图片占位');
    expect(preview).toHaveTextContent('https://cdn.example.com/card.png');
    expect(preview.querySelector('img')).toBeNull();
  });

  it('Meta 内容栈允许在移动端网格中收缩', async () => {
    await renderTool('meta-tag-genny');

    const stack = screen.getByLabelText('社交分享预览').closest('.developer-stack');
    expect(stack).toHaveStyle({ minWidth: '0' });
  });

  it('Meta 长源码被约束在可横向滚动的结果容器内', async () => {
    await renderTool('meta-tag-genny');

    const source = screen.getByLabelText('Meta HTML 源码');
    const result = source.closest('.result-panel');
    expect(result).not.toBeNull();
    expect(source).toHaveClass('source-preview');
    expect(componentStyles).toMatch(/\.result-panel\s*\{[^}]*min-width:\s*0;[^}]*max-width:\s*100%/);
    expect(componentStyles).toMatch(/\.source-preview\s*\{[^}]*max-width:\s*100%;[^}]*overflow-x:\s*auto/);
  });

  it('正则预设会更新全部输入，flags 快捷按钮可访问且稳定排序', async () => {
    const user = userEvent.setup();
    await renderTool('regex-tester');

    expect(screen.getAllByRole('button', { name: /电子邮箱|网址|中国大陆手机号|ISO 日期/ })).toHaveLength(4);
    await user.click(screen.getByRole('button', { name: '电子邮箱' }));
    const email = REGEX_PRESETS.find((preset) => preset.id === 'email')!;
    expect(screen.getByLabelText('正则表达式')).toHaveValue(email.pattern);
    expect(screen.getByLabelText('正则标志')).toHaveValue(email.flags);
    expect(screen.getByLabelText('样本文本')).toHaveValue(email.sample);

    const global = screen.getByRole('button', { name: 'g' });
    const ignoreCase = screen.getByRole('button', { name: 'i' });
    const indices = screen.getByRole('button', { name: 'd' });
    expect(global).toHaveAttribute('aria-pressed', 'true');
    expect(ignoreCase).toHaveAttribute('aria-pressed', 'true');
    expect(indices).toHaveAttribute('aria-pressed', 'false');

    await user.click(global);
    await user.click(indices);
    expect(screen.getByLabelText('正则标志')).toHaveValue('diu');
    expect(global).toHaveAttribute('aria-pressed', 'false');
    expect(indices).toHaveAttribute('aria-pressed', 'true');
  });

  it('文本处理执行转换，并可重置和下载结果', async () => {
    const user = userEvent.setup();
    const blobs: Blob[] = [];
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
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

    await user.click(screen.getByRole('button', { name: '复制文本' }));
    expect(writeText).toHaveBeenCalledWith('b\na');
    await user.click(screen.getByRole('button', { name: '下载文本' }));
    expect(blobs[0]?.type).toBe('text/plain;charset=utf-8');
    await user.click(screen.getByRole('button', { name: '重置文本' }));
    expect(screen.getByLabelText('处理结果文本')).toHaveValue('');
  });

  it('文本处理台提供查找替换、提取和完整的行处理动作', async () => {
    const user = userEvent.setup();
    await renderTool('markdown-writer');

    expect(screen.getByRole('heading', { name: '查找替换' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '提取内容' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '大小写、行与清理' })).toBeVisible();
    expect(screen.getByRole('option', { name: '切换大小写' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '逆序行' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '删除空行' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '添加行号' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('待处理文本'), { target: { value: 'A.a a.a' } });
    fireEvent.change(screen.getByLabelText('查找内容'), { target: { value: 'a.a' } });
    fireEvent.change(screen.getByLabelText('替换为'), { target: { value: '$&' } });
    await user.click(screen.getByRole('button', { name: '执行查找替换' }));
    expect(screen.getByLabelText('处理结果文本')).toHaveValue('A.a $&');
    expect(screen.getByText('已替换 1 处')).toBeVisible();

    fireEvent.change(screen.getByLabelText('待处理文本'), { target: { value: 'https://a.test a@x.com https://a.test' } });
    await user.selectOptions(screen.getByLabelText('提取类型'), 'urls');
    await user.click(screen.getByRole('button', { name: '提取内容' }));
    expect(screen.getByLabelText('提取结果')).toHaveValue('https://a.test');
  });

  it('Shavian 页面说明映射边界并保留未知文字', async () => {
    await renderTool('shavian-transliterator');
    fireEvent.change(screen.getByLabelText('英文原文'), { target: { value: 'Hi, 世界!' } });
    expect(screen.getByText(/基于规则和显式映射/)).toBeVisible();
    expect(screen.getByLabelText('Shavian 转写结果')).toHaveTextContent('世界!');
  });

  it('多进制面板可同步编辑、保留无效输入前的结果，并提供 16 位位运算与逐项复制', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await renderTool('base-converter');

    const binary = screen.getByLabelText('二进制');
    const octal = screen.getByLabelText('八进制');
    const decimal = screen.getByLabelText('十进制');
    const hexadecimal = screen.getByLabelText('十六进制');
    await user.clear(hexadecimal);
    await user.type(hexadecimal, 'ff');
    expect(binary).toHaveValue('11111111');
    expect(octal).toHaveValue('377');
    expect(decimal).toHaveValue('255');

    fireEvent.change(binary, { target: { value: '102' } });
    expect(screen.getByRole('alert')).toHaveTextContent('不属于 2 进制');
    expect(decimal).toHaveValue('255');

    const bits = screen.getAllByRole('button', { name: /^bit (?:[0-9]|1[0-5])$/u });
    expect(bits).toHaveLength(16);
    expect(bits[15]).toHaveAttribute('aria-pressed', 'false');
    await user.click(bits[15]);
    expect(decimal).toHaveValue('33023');
    expect(bits[15]).toHaveAttribute('aria-pressed', 'true');

    expect(screen.getByLabelText('第二操作数')).toBeVisible();
    for (const label of ['AND', 'OR', 'XOR', 'NOT', '左移', '右移']) {
      expect(screen.getByRole('button', { name: label })).toBeVisible();
    }
    await user.click(screen.getByRole('button', { name: '复制十六进制' }));
    expect(writeText).toHaveBeenCalledWith('80ff');
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
