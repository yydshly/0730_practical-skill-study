/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../src/app/App';
import { IMAGE_FIXTURES, fixtureFile } from './fixtures/image-fixtures';

type DownloadRecord = { name: string; blob?: Blob };

const originalImage = globalThis.Image;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

let downloads: DownloadRecord[];
let urlBlobs: Map<string, Blob>;
let canvasToBlob: ReturnType<typeof vi.fn>;
let canvasContext: { font: string; translate: ReturnType<typeof vi.fn> };
let objectUrlSequence: number;
let lastObjectUrlBlob: Blob | undefined;

function installObjectUrls(): void {
  urlBlobs = new Map();
  objectUrlSequence = 0;
  lastObjectUrlBlob = undefined;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn((blob: Blob) => {
      lastObjectUrlBlob = blob;
      const fileName = blob instanceof File ? blob.name : 'result';
      const url = `blob:test-${objectUrlSequence++}-${fileName}`;
      urlBlobs.set(url, blob);
      return url;
    }),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
}

function installImmediateImages(failName = ''): void {
  class ImmediateImage {
    onload: ((event: Event) => void) | null = null;
    onerror: ((event: Event | string) => void) | null = null;
    naturalWidth = 120;
    naturalHeight = 80;
    width = 120;
    height = 80;
    private value = '';

    set src(value: string) {
      this.value = value;
      queueMicrotask(() => {
        if (failName && value.includes(failName)) this.onerror?.(new Event('error'));
        else this.onload?.(new Event('load'));
      });
    }

    get src() { return this.value; }
  }
  vi.stubGlobal('Image', ImmediateImage as unknown as typeof Image);
}

function installCanvas(): void {
  const pixelData = new Uint8ClampedArray(120 * 80 * 4);
  for (let index = 3; index < pixelData.length; index += 4) pixelData[index] = 255;
  const context = {
    drawImage: vi.fn(), fillRect: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), fillText: vi.fn(),
    getImageData: vi.fn(() => ({ data: pixelData, width: 120, height: 80 })),
    createImageData: vi.fn((width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4), width, height })),
    putImageData: vi.fn(), measureText: vi.fn(() => ({ width: 72 })),
    fillStyle: '', filter: '', font: '', globalAlpha: 1, textAlign: 'start', textBaseline: 'alphabetic', shadowColor: '', shadowBlur: 0,
  };
  canvasContext = context;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  canvasToBlob = vi.fn((callback: BlobCallback, mime = 'image/png') => callback(new Blob(['encoded'], { type: mime })));
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(canvasToBlob as HTMLCanvasElement['toBlob']);
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ name: this.download, blob: urlBlobs.get(this.getAttribute('href') ?? '') ?? lastObjectUrlBlob });
  });
}

function renderTool(toolId: string) {
  window.history.replaceState({}, '', `/tools/${toolId}`);
  return render(<App />);
}

async function upload(files: File | File[]): Promise<void> {
  fireEvent.change(screen.getByLabelText('选择文件'), { target: { files: Array.isArray(files) ? files : [files] } });
  await screen.findByText(/已读取 \d+ 张图片/);
}

async function expectDownload(buttonName: string | RegExp, fileName: string, mime: string): Promise<void> {
  await userEvent.click(await screen.findByRole('button', { name: buttonName }));
  const latest = downloads[downloads.length - 1];
  expect(latest).toMatchObject({ name: fileName });
  expect(latest?.blob?.type).toBe(mime);
}

beforeEach(() => {
  downloads = [];
  installObjectUrls();
  installImmediateImages();
  installCanvas();
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: originalImage });
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevokeObjectURL });
});

describe('13 条图片路由的核心成功交互', () => {
  it('方形衬底导入 PNG、修改尺寸并导出真实 PNG', async () => {
    renderTool('matte-generator');
    await upload(fixtureFile('png'));
    fireEvent.change(screen.getByLabelText('画布尺寸'), { target: { value: '256' } });
    await userEvent.click(screen.getByRole('button', { name: '生成方形衬底' }));
    await expectDownload('下载方形衬底 PNG', '方形衬底.png', 'image/png');
  });

  it('无缝轮播导入 JPEG、修改切片高度并导出 PNG', async () => {
    renderTool('scroll-generator');
    await upload(fixtureFile('jpeg'));
    fireEvent.change(screen.getByLabelText('单片高度'), { target: { value: '40' } });
    await userEvent.click(screen.getByRole('button', { name: '拆分长图' }));
    await expectDownload('下载轮播第 1 片', '轮播-1.png', 'image/png');
  });

  it('社交裁剪导入 JPEG、自定义斜杠比例并清洗导出文件名', async () => {
    renderTool('social-cropper');
    await upload(fixtureFile('jpeg'));
    await userEvent.selectOptions(screen.getByLabelText('裁剪场景'), 'custom');
    await userEvent.clear(screen.getByLabelText('自定义比例'));
    await userEvent.type(screen.getByLabelText('自定义比例'), '4/5');
    await userEvent.click(screen.getByRole('button', { name: '按比例裁剪' }));
    await expectDownload(/下载自定义比例/, '社交裁剪-4x5.png', 'image/png');
  });

  it('水印工具导入 WebP、旋转平铺并导出 PNG', async () => {
    renderTool('watermarker');
    await upload(fixtureFile('webp'));
    await userEvent.selectOptions(screen.getByLabelText('水印布局'), 'tile');
    fireEvent.change(screen.getByLabelText('水印旋转角度'), { target: { value: '45' } });
    fireEvent.change(screen.getByLabelText('水印边距'), { target: { value: '2' } });
    await userEvent.click(screen.getByRole('button', { name: '添加水印' }));
    expect(canvasContext.translate).toHaveBeenCalled();
    expect(canvasContext.font).toBe('700 10px system-ui');
    await expectDownload('下载带水印图片', '图片水印.png', 'image/png');
  });

  it('艺术品增强导入 JPEG、修改倍率与对比度并导出 PNG', async () => {
    renderTool('artwork-enhancer');
    await upload(fixtureFile('jpeg'));
    await userEvent.selectOptions(screen.getByLabelText('输出倍率'), '1.5');
    fireEvent.change(screen.getByLabelText('对比度'), { target: { value: '125' } });
    await userEvent.click(screen.getByRole('button', { name: '增强图片' }));
    await expectDownload(/下载增强图片/, '艺术品增强.png', 'image/png');
  });

  it('Favicon 导入 PNG、设置尺寸并导出对应 PNG', async () => {
    renderTool('favicon-genny');
    await upload(fixtureFile('png'));
    await userEvent.clear(screen.getByLabelText('图标尺寸'));
    await userEvent.type(screen.getByLabelText('图标尺寸'), '16,32');
    await userEvent.click(screen.getByRole('button', { name: '生成 Favicon' }));
    await expectDownload('下载16 × 16 图标', 'favicon-16x16.png', 'image/png');
  });

  it('透明边缘裁剪导入 PNG、读取像素边界并导出 PNG', async () => {
    renderTool('image-clipper');
    await upload(fixtureFile('png'));
    await userEvent.click(screen.getByRole('button', { name: '裁剪图片' }));
    await expectDownload(/下载裁剪结果/, '裁剪结果.png', 'image/png');
  });

  it('格式转换导入 WebP、选择 JPEG 并导出真实 JPEG', async () => {
    renderTool('image-converter');
    await upload(fixtureFile('webp'));
    await userEvent.selectOptions(screen.getByLabelText('输出格式'), 'image/jpeg');
    fireEvent.change(screen.getByLabelText('图片质量'), { target: { value: '0.8' } });
    await userEvent.click(screen.getByRole('button', { name: '转换并下载' }));
    await expectDownload('下载JPEG 转换结果', '转换结果.jpg', 'image/jpeg');
  });

  it('图片分割导入 WebP、设置 2×2 网格并导出 PNG', async () => {
    renderTool('image-splitter');
    await upload(fixtureFile('webp'));
    fireEvent.change(screen.getByLabelText('分割列数'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('分割行数'), { target: { value: '2' } });
    await userEvent.click(screen.getByRole('button', { name: '按网格切图' }));
    await expectDownload('下载切图 1', '切图-1.png', 'image/png');
  });

  it('图片拼接导入两种格式、设置纵向间距并导出 PNG', async () => {
    renderTool('image-stitcher');
    await upload([fixtureFile('png', '上.png'), fixtureFile('jpeg', '下.jpg')]);
    await userEvent.selectOptions(screen.getByLabelText('拼接方向'), 'vertical');
    fireEvent.change(screen.getByLabelText('图片间距'), { target: { value: '8' } });
    await userEvent.click(screen.getByRole('button', { name: '拼接图片' }));
    await expectDownload('下载纵向拼接结果', '图片拼接.png', 'image/png');
  });

  it('剪贴板图片工具通过本地导入路径准备并下载原 MIME 文件', async () => {
    renderTool('paste-image');
    await upload(fixtureFile('png', '本地截图.png'));
    await userEvent.click(screen.getByRole('button', { name: '准备下载' }));
    await expectDownload('下载剪贴板图片', '本地截图.png', 'image/png');
  });

  it('占位图导入 PNG 尺寸、修改文字并导出 SVG', async () => {
    renderTool('placeholder-genny');
    await upload(fixtureFile('png'));
    await waitFor(() => expect(screen.getByLabelText('占位宽度')).toHaveValue(120));
    await userEvent.clear(screen.getByLabelText('占位文字'));
    await userEvent.type(screen.getByLabelText('占位文字'), '中文占位');
    await userEvent.click(screen.getByRole('button', { name: '生成占位图' }));
    await expectDownload('下载 SVG', '占位图-120x80.svg', 'image/svg+xml');
  });

  it('Base64 工具解析真实 WebP、真实解码确认并按内容扩展名下载', async () => {
    renderTool('base64-image-encoder');
    fireEvent.change(screen.getByLabelText('图片 Data URL'), { target: { value: `data:image/webp;base64,${IMAGE_FIXTURES.webp.base64}` } });
    await userEvent.click(screen.getByRole('button', { name: '解析 Data URL' }));
    await screen.findByText('已解析 image/webp 图片');
    await expectDownload('下载解码图片', '解码图片.webp', 'image/webp');
  });
});

describe('图片工作台状态、竞态与资源上限', () => {
  it('连续选择时忽略较慢完成的旧图片解码', async () => {
    const pending: Array<{ image: { onload: ((event: Event) => void) | null; naturalWidth: number; naturalHeight: number } }> = [];
    class ControlledImage {
      onload: ((event: Event) => void) | null = null;
      onerror: ((event: Event | string) => void) | null = null;
      naturalWidth = 120;
      naturalHeight = 80;
      width = 120;
      height = 80;
      set src(_value: string) { pending.push({ image: this }); }
    }
    vi.stubGlobal('Image', ControlledImage as unknown as typeof Image);
    renderTool('matte-generator');
    const input = screen.getByLabelText('选择文件');
    fireEvent.change(input, { target: { files: [fixtureFile('png', '较慢旧图.png')] } });
    fireEvent.change(input, { target: { files: [fixtureFile('jpeg', '较快新图.jpg')] } });
    expect(pending).toHaveLength(2);
    pending[1].image.naturalWidth = 222;
    pending[1].image.onload?.(new Event('load'));
    await screen.findByText(/较快新图\.jpg · 222 × 80/);
    pending[0].image.naturalWidth = 111;
    pending[0].image.onload?.(new Event('load'));
    await waitFor(() => expect(screen.queryByText(/较慢旧图\.png/)).toBeNull());
    expect(screen.getByText(/较快新图\.jpg · 222 × 80/)).toBeVisible();
  });

  it('占位图连续选择复用受版本保护的单次解码，旧尺寸不会回写', async () => {
    const pending: Array<{ image: { onload: ((event: Event) => void) | null; naturalWidth: number; naturalHeight: number } }> = [];
    class ControlledImage {
      onload: ((event: Event) => void) | null = null;
      onerror: ((event: Event | string) => void) | null = null;
      naturalWidth = 120;
      naturalHeight = 80;
      width = 120;
      height = 80;
      set src(_value: string) { pending.push({ image: this }); }
    }
    vi.stubGlobal('Image', ControlledImage as unknown as typeof Image);
    renderTool('placeholder-genny');
    const input = screen.getByLabelText('选择文件');
    fireEvent.change(input, { target: { files: [fixtureFile('png', '较慢旧尺寸.png')] } });
    fireEvent.change(input, { target: { files: [fixtureFile('jpeg', '较快新尺寸.jpg')] } });
    expect(pending).toHaveLength(2);
    pending[1].image.naturalWidth = 320;
    pending[1].image.naturalHeight = 180;
    pending[1].image.onload?.(new Event('load'));
    await waitFor(() => expect(screen.getByLabelText('占位宽度')).toHaveValue(320));
    pending[0].image.naturalWidth = 640;
    pending[0].image.naturalHeight = 360;
    pending[0].image.onload?.(new Event('load'));
    await waitFor(() => expect(screen.getByLabelText('占位宽度')).toHaveValue(320));
    expect(screen.getByLabelText('占位高度')).toHaveValue(180);
  });

  it('绕过 HTML max 输入 21 列时在创建输出前被 UI 再次拒绝', async () => {
    renderTool('image-splitter');
    await upload(fixtureFile('png'));
    canvasToBlob.mockClear();
    fireEvent.change(screen.getByLabelText('分割列数'), { target: { value: '21' } });
    fireEvent.change(screen.getByLabelText('分割行数'), { target: { value: '1' } });
    await userEvent.click(screen.getByRole('button', { name: '按网格切图' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('每边最多 20');
    expect(canvasToBlob).not.toHaveBeenCalled();
  });

  it('水印图片读取失败会清除之前的专属成功输出', async () => {
    installImmediateImages('损坏水印.png');
    renderTool('watermarker');
    await upload(fixtureFile('png'));
    await userEvent.click(screen.getByRole('button', { name: '添加水印' }));
    expect(await screen.findByRole('button', { name: '下载带水印图片' })).toBeVisible();
    await userEvent.selectOptions(screen.getByLabelText('水印类型'), 'image');
    fireEvent.change(screen.getByLabelText('选择水印图片'), { target: { files: [fixtureFile('png', '损坏水印.png')] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('图片加载失败');
    expect(screen.queryByRole('button', { name: '下载带水印图片' })).toBeNull();
  });

  it('Base64 必须通过浏览器图片解码后才呈现已验证结果', async () => {
    class FailingImage {
      onload: ((event: Event) => void) | null = null;
      onerror: ((event: Event | string) => void) | null = null;
      set src(_value: string) { queueMicrotask(() => this.onerror?.(new Event('error'))); }
    }
    vi.stubGlobal('Image', FailingImage as unknown as typeof Image);
    renderTool('base64-image-encoder');
    fireEvent.change(screen.getByLabelText('图片 Data URL'), { target: { value: `data:image/png;base64,${IMAGE_FIXTURES.png.base64}` } });
    await userEvent.click(screen.getByRole('button', { name: '解析 Data URL' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('图片加载失败');
    expect(screen.queryByRole('button', { name: '复制 Data URL' })).toBeNull();
    expect(screen.queryByRole('button', { name: '下载解码图片' })).toBeNull();
  });

  it('Base64 文件校验失败也会清除已验证的复制与下载结果', async () => {
    renderTool('base64-image-encoder');
    fireEvent.change(screen.getByLabelText('图片 Data URL'), { target: { value: `data:image/png;base64,${IMAGE_FIXTURES.png.base64}` } });
    await userEvent.click(screen.getByRole('button', { name: '解析 Data URL' }));
    expect(await screen.findByRole('button', { name: '复制 Data URL' })).toBeVisible();
    fireEvent.change(screen.getByLabelText('选择文件'), {
      target: { files: [new File(['文本'], '不是图片.txt', { type: 'text/plain' })] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('请选择图片文件');
    expect(screen.queryByRole('button', { name: '复制 Data URL' })).toBeNull();
    expect(screen.queryByRole('button', { name: '下载解码图片' })).toBeNull();
  });
});
