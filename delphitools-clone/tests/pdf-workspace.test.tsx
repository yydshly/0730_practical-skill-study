/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';

import { App } from '../src/app/App';

function renderTool(toolId: string) {
  window.history.replaceState({}, '', `/tools/${toolId}`);
  return render(<App />);
}

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function installImageCanvas(): void {
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:advanced-media-test') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  class ImmediateImage {
    onload: ((event: Event) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    naturalWidth = 3;
    naturalHeight = 1;
    width = 3;
    height = 1;
    set src(_value: string) { queueMicrotask(() => this.onload?.(new Event('load'))); }
  }
  vi.stubGlobal('Image', ImmediateImage as unknown as typeof Image);
  const data = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255]);
  const context = {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ width: 3, height: 1, data })),
    createImageData: vi.fn((width: number, height: number) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) })),
    putImageData: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['png'], { type: 'image/png' })));
}

async function pdfFile(pageCount: number, name = '样张.pdf'): Promise<File> {
  const document = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) document.addPage(index % 2 ? [400, 300] : [300, 400]);
  const bytes = await document.save();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new File([buffer], name, { type: 'application/pdf' });
}

type WorkerRequest = { id: string; type: string; payload: unknown };

function installControlledWorkers() {
  const instances: ControlledWorker[] = [];
  let job = 0;
  class ControlledWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    request?: WorkerRequest;
    postMessage = vi.fn((request: WorkerRequest) => { this.request = request; });
    terminate = vi.fn();
    constructor() { instances.push(this); }
    success(result: unknown) {
      this.onmessage?.({ data: { id: this.request?.id, type: 'success', result } } as MessageEvent);
    }
    fail(message: string) {
      this.onmessage?.({ data: { id: this.request?.id, type: 'error', message } } as MessageEvent);
    }
  }
  vi.stubGlobal('Worker', ControlledWorker as unknown as typeof Worker);
  vi.stubGlobal('crypto', { randomUUID: () => `job-${++job}` });
  return instances;
}

async function workerPdfFile(pageCount: number, name: string): Promise<File> {
  const file = await pdfFile(pageCount, name);
  const document = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) document.addPage([300, 400]);
  const bytes = await document.save();
  Object.defineProperty(file, 'arrayBuffer', {
    configurable: true,
    value: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  });
  return file;
}

describe('六条高级媒体路由', () => {
  it.each([
    ['background-remover', '本地颜色背景移除', '背景相似度阈值'],
    ['image-tracer', '图片转 SVG', '追踪阈值'],
    ['svg-optimiser', 'SVG 优化器', '选择 SVG 文件'],
    ['pdf-preflight', 'PDF 印刷预检', '选择 PDF 文件'],
    ['imposer', 'PDF 拼版', '纸张尺寸'],
    ['zine-imposer', 'Zine 拼版', '8 页固定顺序'],
  ])('%s 显示独立中文工作区', (toolId, title, control) => {
    renderTool(toolId);
    expect(screen.getByRole('heading', { name: title })).toBeVisible();
    expect(screen.getByLabelText(control)).toBeVisible();
    expect(screen.queryByText('正在构建此工具')).toBeNull();
  });

  it('SVG 优化器净化后提供真实 SVG 下载，失败时清除旧结果并保留输入', async () => {
    renderTool('svg-optimiser');
    const input = screen.getByLabelText('选择 SVG 文件');
    fireEvent.change(input, { target: { files: [new File(['<svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg>'], '图形.svg', { type: 'image/svg+xml' })] } });
    expect(await screen.findByRole('button', { name: '下载优化后的 SVG' })).toBeVisible();
    expect(screen.getByText(/优化前.*优化后/)).toBeVisible();
    fireEvent.change(input, { target: { files: [new File(['<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///x">]><svg>&x;</svg>'], '危险.svg', { type: 'image/svg+xml' })] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('不允许 XML 外部实体');
    expect(screen.queryByRole('button', { name: '下载优化后的 SVG' })).toBeNull();
    expect(screen.getByText('危险.svg')).toBeVisible();
  });

  it('PDF 预检拒绝非法文件并允许保留文件重试', async () => {
    renderTool('pdf-preflight');
    fireEvent.change(screen.getByLabelText('选择 PDF 文件'), { target: { files: [new File(['not pdf'], '损坏.pdf', { type: 'application/pdf' })] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('不是有效的 PDF 文件');
    expect(screen.getByText(/损坏\.pdf/)).toBeVisible();
    expect(screen.getByRole('button', { name: '重新预检' })).toBeVisible();
  });

  it('背景移除如实说明不是 AI 并支持取消和重试', async () => {
    renderTool('background-remover');
    expect(screen.getAllByText(/不是 AI 抠图模型/)).toHaveLength(2);
    expect(screen.getByRole('button', { name: '取消处理' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: '重试处理' }));
    expect(screen.getByRole('alert')).toHaveTextContent('请先选择图片');
  });

  it('Zine 明确固定八页顺序与折叠提示', () => {
    renderTool('zine-imposer');
    expect(screen.getByLabelText('8 页固定顺序')).toHaveTextContent('8、1、2、7、6、3、4、5');
    expect(screen.getByText(/沿中线裁切并折叠/)).toBeVisible();
  });

  it('彩色追踪隐藏无效阈值，只显示最大颜色数', async () => {
    renderTool('image-tracer');
    expect(screen.getByLabelText('追踪阈值')).toBeVisible();
    await userEvent.selectOptions(screen.getByLabelText('追踪模式'), 'color');
    expect(screen.queryByLabelText('追踪阈值')).toBeNull();
    expect(screen.getByLabelText('最大颜色数')).toBeVisible();
  });

  it('小册子模式固定双面并只保留有实际作用的翻转设置', async () => {
    renderTool('imposer');
    await userEvent.selectOptions(screen.getByLabelText('输出模式'), 'booklet');
    expect(screen.queryByLabelText('单双面')).toBeNull();
    expect(screen.getByLabelText('翻转方式')).toBeVisible();
    expect(screen.getByText(/小册子固定双面输出/)).toBeVisible();
  });
});

describe('六条路由核心成功与恢复', () => {
  beforeEach(() => installImageCanvas());

  it('本地颜色背景移除从图片像素生成透明 PNG 下载', async () => {
    renderTool('background-remover');
    fireEvent.change(screen.getByLabelText('选择背景移除图片'), { target: { files: [new File(['png'], '纯色背景.png', { type: 'image/png' })] } });
    await screen.findByText('图片已读取，可开始本地颜色背景移除');
    await userEvent.click(screen.getByRole('button', { name: '移除颜色背景' }));
    expect(await screen.findByRole('button', { name: '下载透明 PNG' })).toBeVisible();
  });

  it('后台背景处理开始后可以取消并保留原始文件', async () => {
    class WaitingWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      postMessage = vi.fn();
      terminate = vi.fn();
    }
    vi.stubGlobal('Worker', WaitingWorker as unknown as typeof Worker);
    vi.stubGlobal('crypto', { randomUUID: () => 'job-cancel' });
    renderTool('background-remover');
    fireEvent.change(screen.getByLabelText('选择背景移除图片'), { target: { files: [new File(['png'], '保留原图.png', { type: 'image/png' })] } });
    await screen.findByText('图片已读取，可开始本地颜色背景移除');
    await userEvent.click(screen.getByRole('button', { name: '移除颜色背景' }));
    const cancel = screen.getByRole('button', { name: '取消处理' });
    expect(cancel).toBeEnabled();
    await userEvent.click(cancel);
    expect(await screen.findByRole('alert')).toHaveTextContent('处理已取消');
    expect(screen.getByText('保留原图.png')).toBeVisible();
  });

  it('图片追踪生成真实 SVG，非法阈值后清除旧结果', async () => {
    renderTool('image-tracer');
    fireEvent.change(screen.getByLabelText('选择追踪图片'), { target: { files: [new File(['png'], '线稿.png', { type: 'image/png' })] } });
    await screen.findByText('图片已读取，可开始追踪');
    await userEvent.click(screen.getByRole('button', { name: '生成 SVG' }));
    expect(await screen.findByRole('button', { name: '下载追踪 SVG' })).toBeVisible();
    fireEvent.change(screen.getByLabelText('追踪阈值'), { target: { value: '300' } });
    await userEvent.click(screen.getByRole('button', { name: '生成 SVG' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('阈值必须在 0 到 255 之间');
    expect(screen.queryByRole('button', { name: '下载追踪 SVG' })).toBeNull();
  });

  it('PDF 预检成功显示页数、逐页尺寸、方向和尺寸警告', async () => {
    renderTool('pdf-preflight');
    fireEvent.change(screen.getByLabelText('选择 PDF 文件'), { target: { files: [await pdfFile(2)] } });
    expect(await screen.findByText('PDF 预检完成')).toBeVisible();
    expect(screen.getByLabelText('PDF 预检结果')).toHaveTextContent('2 页');
    expect(screen.getByLabelText('PDF 预检结果')).toHaveTextContent('页面尺寸或方向不一致');
  });

  it('PDF 拼版成功生成 application/pdf，非法边距清除旧结果', async () => {
    renderTool('imposer');
    fireEvent.change(screen.getByLabelText('选择 PDF 文件'), { target: { files: [await pdfFile(4)] } });
    await userEvent.click(screen.getByRole('button', { name: '生成拼版 PDF' }));
    expect(await screen.findByRole('button', { name: '下载拼版 PDF' })).toBeVisible();
    fireEvent.change(screen.getByLabelText('边距'), { target: { value: '500' } });
    await userEvent.click(screen.getByRole('button', { name: '生成拼版 PDF' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('边距和间距超过纸张可用范围');
    expect(screen.queryByRole('button', { name: '下载拼版 PDF' })).toBeNull();
  });

  it('Zine 恰好八页时生成 PDF，七页时显示约束错误', async () => {
    renderTool('zine-imposer');
    fireEvent.change(screen.getByLabelText('选择 PDF 文件'), { target: { files: [await pdfFile(8, '八页.pdf')] } });
    await userEvent.click(screen.getByRole('button', { name: '生成 8 页 Zine PDF' }));
    expect(await screen.findByRole('button', { name: '下载 Zine PDF' })).toBeVisible();
    fireEvent.change(screen.getByLabelText('选择 PDF 文件'), { target: { files: [await pdfFile(7, '七页.pdf')] } });
    await userEvent.click(screen.getByRole('button', { name: '生成 8 页 Zine PDF' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('必须恰好包含 8 页');
    expect(screen.queryByRole('button', { name: '下载 Zine PDF' })).toBeNull();
  });
});

describe('高级媒体任务竞态与卸载清理', () => {
  beforeEach(() => installImageCanvas());

  it('背景移除在选择新图片后忽略旧 Worker 的迟到失败', async () => {
    const workers = installControlledWorkers();
    renderTool('background-remover');
    const input = screen.getByLabelText('选择背景移除图片');
    fireEvent.change(input, { target: { files: [new File(['a'], 'A.png', { type: 'image/png' })] } });
    await screen.findByText('图片已读取，可开始本地颜色背景移除');
    await userEvent.click(screen.getByRole('button', { name: '移除颜色背景' }));
    await waitFor(() => expect(workers).toHaveLength(1));

    fireEvent.change(input, { target: { files: [new File(['b'], 'B.png', { type: 'image/png' })] } });
    await screen.findByText('图片已读取，可开始本地颜色背景移除');
    expect(workers[0].terminate).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: '移除颜色背景' }));
    await waitFor(() => expect(workers).toHaveLength(2));
    workers[1].success({ width: 3, height: 1, data: new Uint8ClampedArray(12).buffer });
    expect(await screen.findByRole('button', { name: '下载透明 PNG' })).toBeVisible();
    await act(async () => { workers[0].fail('A 任务迟到失败'); await Promise.resolve(); });
    expect(screen.getByRole('button', { name: '下载透明 PNG' })).toBeVisible();
    expect(screen.queryByText('A 任务迟到失败')).toBeNull();
    expect(workers[0].terminate).toHaveBeenCalled();
  });

  it('图片追踪在选择新图片后忽略旧 Worker 的迟到失败', async () => {
    const workers = installControlledWorkers();
    renderTool('image-tracer');
    const input = screen.getByLabelText('选择追踪图片');
    fireEvent.change(input, { target: { files: [new File(['a'], 'A.png', { type: 'image/png' })] } });
    await screen.findByText('图片已读取，可开始追踪');
    await userEvent.click(screen.getByRole('button', { name: '生成 SVG' }));
    await waitFor(() => expect(workers).toHaveLength(1));

    fireEvent.change(input, { target: { files: [new File(['b'], 'B.png', { type: 'image/png' })] } });
    await screen.findByText('图片已读取，可开始追踪');
    expect(workers[0].terminate).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: '生成 SVG' }));
    await waitFor(() => expect(workers).toHaveLength(2));
    workers[1].success({ svg: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1z"/></svg>' });
    expect(await screen.findByRole('button', { name: '下载追踪 SVG' })).toBeVisible();
    await act(async () => { workers[0].fail('A 任务迟到失败'); await Promise.resolve(); });
    expect(screen.getByRole('button', { name: '下载追踪 SVG' })).toBeVisible();
    expect(screen.queryByText('A 任务迟到失败')).toBeNull();
    expect(workers[0].terminate).toHaveBeenCalled();
  });

  it('SVG 读取采用最新文件，较慢旧读取不能覆盖新结果', async () => {
    const readers: DeferredReader[] = [];
    class DeferredReader {
      result: string | ArrayBuffer | null = null;
      error: DOMException | null = null;
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
      onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
      readAsText = vi.fn(() => readers.push(this));
      resolve(value: string) { this.result = value; this.onload?.(new ProgressEvent('load') as ProgressEvent<FileReader>); }
    }
    vi.stubGlobal('FileReader', DeferredReader as unknown as typeof FileReader);
    renderTool('svg-optimiser');
    const input = screen.getByLabelText('选择 SVG 文件');
    fireEvent.change(input, { target: { files: [new File(['a'], 'A.svg', { type: 'image/svg+xml' })] } });
    fireEvent.change(input, { target: { files: [new File(['b'], 'B.svg', { type: 'image/svg+xml' })] } });
    expect(readers).toHaveLength(2);
    readers[1].resolve('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><rect width="2" height="2"/></svg>');
    expect(await screen.findByRole('button', { name: '下载优化后的 SVG' })).toBeVisible();
    await act(async () => { readers[0].resolve('<svg xmlns="http://www.w3.org/2000/svg"><g></svg>'); await Promise.resolve(); });
    expect(screen.getByRole('button', { name: '下载优化后的 SVG' })).toBeVisible();
    expect(screen.getByText('B.svg')).toBeVisible();
  });

  it('PDF 预检只接受最新 Worker 的结果', async () => {
    const workers = installControlledWorkers();
    renderTool('pdf-preflight');
    const input = screen.getByLabelText('选择 PDF 文件');
    fireEvent.change(input, { target: { files: [await workerPdfFile(1, 'A.pdf')] } });
    await waitFor(() => expect(workers).toHaveLength(1));
    fireEvent.change(input, { target: { files: [await workerPdfFile(2, 'B.pdf')] } });
    await waitFor(() => expect(workers).toHaveLength(2));
    expect(workers[0].terminate).toHaveBeenCalled();
    workers[1].success({ pageCount: 2, pages: [{ number: 1, width: 300, height: 400, orientation: 'portrait' }, { number: 2, width: 300, height: 400, orientation: 'portrait' }], metadata: { title: '', author: '', subject: '', creator: '', producer: '' }, warnings: [] });
    expect(await screen.findByLabelText('PDF 预检结果')).toHaveTextContent('2 页');
    await act(async () => { workers[0].fail('A 预检迟到失败'); await Promise.resolve(); });
    expect(screen.getByLabelText('PDF 预检结果')).toHaveTextContent('2 页');
    expect(screen.queryByText('A 预检迟到失败')).toBeNull();
  });

  it.each([
    ['imposer', '生成拼版 PDF', '下载拼版 PDF'],
    ['zine-imposer', '生成 8 页 Zine PDF', '下载 Zine PDF'],
  ])('%s 只保留最新生成任务，旧 Worker 迟到失败不能清空结果', async (toolId, runLabel, downloadLabel) => {
    const workers = installControlledWorkers();
    renderTool(toolId);
    const input = screen.getByLabelText('选择 PDF 文件');
    const pages = toolId === 'zine-imposer' ? 8 : 4;
    fireEvent.change(input, { target: { files: [await workerPdfFile(pages, 'A.pdf')] } });
    await userEvent.click(screen.getByRole('button', { name: runLabel }));
    await waitFor(() => expect(workers).toHaveLength(1));
    fireEvent.change(input, { target: { files: [await workerPdfFile(pages, 'B.pdf')] } });
    expect(workers[0].terminate).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: runLabel }));
    await waitFor(() => expect(workers).toHaveLength(2));
    workers[1].success({ bytes: new Uint8Array([37, 80, 68, 70]).buffer });
    expect(await screen.findByRole('button', { name: downloadLabel })).toBeVisible();
    await act(async () => { workers[0].fail('A 生成任务迟到失败'); await Promise.resolve(); });
    expect(screen.getByRole('button', { name: downloadLabel })).toBeVisible();
    expect(screen.queryByText('A 生成任务迟到失败')).toBeNull();
  });

  it.each([
    ['pdf-preflight', '', 1],
    ['imposer', '生成拼版 PDF', 4],
    ['zine-imposer', '生成 8 页 Zine PDF', 8],
  ])('%s 卸载时终止仍在运行的 PDF Worker', async (toolId, runLabel, pages) => {
    const workers = installControlledWorkers();
    const view = renderTool(toolId);
    fireEvent.change(screen.getByLabelText('选择 PDF 文件'), { target: { files: [await workerPdfFile(pages, '运行中.pdf')] } });
    if (runLabel) await userEvent.click(screen.getByRole('button', { name: runLabel }));
    await waitFor(() => expect(workers).toHaveLength(1));
    view.unmount();
    expect(workers[0].terminate).toHaveBeenCalled();
  });
});
