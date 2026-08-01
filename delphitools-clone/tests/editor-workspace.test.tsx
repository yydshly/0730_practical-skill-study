/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../src/app/App';
import { CanvasStage, clientPointToCanvas, resizeFromHandle } from '../src/components/editor/CanvasStage';
import { createDocument, editorReducer } from '../src/engines/editor';

function renderEditor() {
  window.history.replaceState({}, '', '/editor');
  return render(<App />);
}

function installDesktopViewport(matches = false): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: query === '(max-width: 900px)' ? matches : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function installCanvas(): void {
  const context = {
    clearRect: vi.fn(), fillRect: vi.fn(), strokeRect: vi.fn(), beginPath: vi.fn(), ellipse: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), stroke: vi.fn(), fill: vi.fn(), fillText: vi.fn(),
    drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), setTransform: vi.fn(),
    globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: 'left', textBaseline: 'top',
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['png'], { type: 'image/png' })));
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:editor-export') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
}

function DragHarness() {
  const [document, dispatch] = useReducer(editorReducer, undefined, () => createDocument([
    { id: 'drag', type: 'rectangle', x: 80, y: 80, width: 100, height: 80 },
  ], { width: 400, height: 300 }));
  return <>
    <output data-testid="drag-x">{document.layers[0].x}</output>
    <output data-testid="history-count">{document.history.length}</output>
    <button type="button" onClick={() => dispatch({ type: 'undo' })}>测试撤销</button>
    <CanvasStage document={document} dispatch={dispatch} />
  </>;
}

function prepareDragHarness() {
  const setPointerCapture = vi.fn();
  const releasePointerCapture = vi.fn();
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { configurable: true, value: setPointerCapture });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', { configurable: true, value: releasePointerCapture });
  render(<DragHarness />);
  const surface = document.querySelector('.editor-stage__surface') as HTMLDivElement;
  vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);
  const layer = screen.getByRole('button', { name: '在画布选择 矩形 1' });
  return { layer, surface, setPointerCapture, releasePointerCapture };
}

beforeEach(() => {
  installDesktopViewport();
  installCanvas();
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Substrata 编辑器路由', () => {
  it('显示中文工具栏、桌面三栏和有名称的画布操作', () => {
    renderEditor();
    expect(screen.getByRole('heading', { name: 'Substrata 图片编辑器' })).toBeVisible();
    expect(screen.getByRole('toolbar', { name: '编辑器工具栏' })).toBeVisible();
    expect(screen.getByRole('complementary', { name: '图层面板' })).toBeVisible();
    expect(screen.getByRole('application', { name: 'Substrata 画布编辑区' })).toBeVisible();
    expect(screen.getByRole('complementary', { name: '属性面板' })).toBeVisible();
    for (const name of ['添加图片图层', '添加文字图层', '添加矩形图层', '添加圆形图层', '添加箭头图层', '撤销', '重做', '画布设置', '导出 PNG']) {
      expect(screen.getByRole('button', { name })).toBeVisible();
    }
  });

  it('完整旅程可添加两层、调序、移动、撤销并导出 PNG', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: '添加文字图层' }));
    await userEvent.click(screen.getByRole('button', { name: '添加矩形图层' }));

    const list = screen.getByRole('list', { name: '图层列表' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: '下移 矩形 2' }));
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('文字 1'),
      expect.stringContaining('矩形 2'),
    ]);

    const xInput = screen.getByLabelText('图层 X 坐标');
    const originalX = Number((xInput as HTMLInputElement).value);
    fireEvent.change(xInput, { target: { value: '240' } });
    expect(screen.getByLabelText('图层 X 坐标')).toHaveValue(240);
    await userEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(screen.getByLabelText('图层 X 坐标')).toHaveValue(originalX);

    await userEvent.click(screen.getByRole('button', { name: '导出 PNG' }));
    expect(await screen.findByText('PNG 已生成，可下载')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '下载 PNG' }));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:editor-export');
  });

  it('选中图层显示八方向缩放手柄和旋转手柄，锁定后禁止画布操作', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: '添加矩形图层' }));
    expect(screen.getAllByRole('button', { name: /缩放手柄/ })).toHaveLength(8);
    expect(screen.getByRole('button', { name: '旋转手柄' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '锁定 矩形 1' }));
    expect(screen.queryByRole('button', { name: /缩放手柄/ })).toBeNull();
    expect(screen.queryByRole('button', { name: '旋转手柄' })).toBeNull();
  });

  it('输入框中的删除和方向键不会误触图层快捷键', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: '添加矩形图层' }));
    const xInput = screen.getByLabelText('图层 X 坐标');
    const originalX = (xInput as HTMLInputElement).value;
    xInput.focus();
    fireEvent.keyDown(xInput, { key: 'ArrowRight' });
    fireEvent.keyDown(xInput, { key: 'Delete' });
    expect(screen.getByLabelText('图层 X 坐标')).toHaveValue(Number(originalX));
    expect(screen.getByRole('button', { name: '选择 矩形 1' })).toBeVisible();
  });

  it('画布键盘方向键按 1 像素、Shift 按 10 像素微调，Delete 删除选中层', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: '添加矩形图层' }));
    const canvasRegion = screen.getByRole('application', { name: 'Substrata 画布编辑区' });
    const originalX = Number((screen.getByLabelText('图层 X 坐标') as HTMLInputElement).value);
    canvasRegion.focus();
    fireEvent.keyDown(canvasRegion, { key: 'ArrowRight' });
    expect(screen.getByLabelText('图层 X 坐标')).toHaveValue(originalX + 1);
    fireEvent.keyDown(canvasRegion, { key: 'ArrowRight', shiftKey: true });
    expect(screen.getByLabelText('图层 X 坐标')).toHaveValue(originalX + 11);
    fireEvent.keyDown(canvasRegion, { key: 'Delete' });
    expect(screen.getByText('画布还没有图层')).toBeVisible();
  });
});

describe('画布坐标与移动抽屉', () => {
  it('CSS 缩放和 DPR 不会重复放大逻辑坐标', () => {
    const rect = { left: 100, top: 50, width: 600, height: 400 } as DOMRect;
    expect(clientPointToCanvas(rect, { width: 1200, height: 800 }, { clientX: 400, clientY: 250 }, 2)).toEqual({ x: 600, y: 400 });
  });

  it('手机关闭面板后移除内部焦点，Escape 关闭并把焦点还给触发按钮', async () => {
    installDesktopViewport(true);
    renderEditor();
    const layersTrigger = screen.getByRole('button', { name: '打开图层面板' });
    await userEvent.click(layersTrigger);
    expect(screen.getByRole('dialog', { name: '移动端图层面板' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '关闭图层面板' }));
    expect(screen.queryByRole('dialog', { name: '移动端图层面板' })).toBeNull();
    expect(layersTrigger).toHaveFocus();

    const inspectorTrigger = screen.getByRole('button', { name: '打开属性面板' });
    await userEvent.click(inspectorTrigger);
    const dialog = screen.getByRole('dialog', { name: '移动端属性面板' });
    expect(dialog).toBeVisible();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: '移动端属性面板' })).toBeNull();
    expect(inspectorTrigger).toHaveFocus();
  });
});

describe('画布拖拽事务与指针生命周期', () => {
  it('20 次 pointermove 只在 pointerup 提交一条历史，一次撤销回到起点', async () => {
    const { layer, surface, setPointerCapture, releasePointerCapture } = prepareDragHarness();
    fireEvent.pointerDown(layer, { pointerId: 7, clientX: 100, clientY: 100, buttons: 1 });
    for (let index = 1; index <= 20; index += 1) {
      fireEvent.pointerMove(surface, { pointerId: 7, clientX: 100 + index, clientY: 100, buttons: 1 });
    }
    expect(screen.getByTestId('history-count')).toHaveTextContent('0');
    expect(screen.getByTestId('drag-x')).toHaveTextContent('80');
    expect(layer).toHaveStyle({ left: '25%' });

    fireEvent.pointerUp(surface, { pointerId: 7, clientX: 120, clientY: 100, buttons: 0 });
    expect(screen.getByTestId('history-count')).toHaveTextContent('1');
    expect(screen.getByTestId('drag-x')).toHaveTextContent('100');
    await userEvent.click(screen.getByRole('button', { name: '测试撤销' }));
    expect(screen.getByTestId('drag-x')).toHaveTextContent('80');
    expect(setPointerCapture).toHaveBeenCalledWith(7);
    expect(releasePointerCapture).toHaveBeenCalledWith(7);
  });

  it.each(['pointercancel', 'lostpointercapture'] as const)('%s 取消本地预览，后续移动不会形成幽灵拖动', (eventName) => {
    const { layer, surface } = prepareDragHarness();
    fireEvent.pointerDown(layer, { pointerId: 9, clientX: 100, clientY: 100, buttons: 1 });
    fireEvent.pointerMove(surface, { pointerId: 9, clientX: 130, clientY: 100, buttons: 1 });
    fireEvent[eventName === 'pointercancel' ? 'pointerCancel' : 'lostPointerCapture'](surface, { pointerId: 9 });
    fireEvent.pointerMove(surface, { pointerId: 9, clientX: 180, clientY: 100, buttons: 1 });
    expect(screen.getByTestId('drag-x')).toHaveTextContent('80');
    expect(screen.getByTestId('history-count')).toHaveTextContent('0');
  });

  it('buttons=0 时取消拖拽，不能继续幽灵移动', () => {
    const { layer, surface } = prepareDragHarness();
    fireEvent.pointerDown(layer, { pointerId: 11, clientX: 100, clientY: 100, buttons: 1 });
    fireEvent.pointerMove(surface, { pointerId: 11, clientX: 120, clientY: 100, buttons: 0 });
    fireEvent.pointerMove(surface, { pointerId: 11, clientX: 160, clientY: 100, buttons: 1 });
    expect(screen.getByTestId('drag-x')).toHaveTextContent('80');
    expect(screen.getByTestId('history-count')).toHaveTextContent('0');
  });
});

describe('旋转图层缩放几何', () => {
  const base = createDocument([{ id: 'shape', type: 'rectangle', x: 10, y: 20, width: 100, height: 80 }]).layers[0];

  it('90 度时右侧边手柄把全局向下拖动换算为局部加宽，并保持左侧视觉锚点', () => {
    expect(resizeFromHandle({ ...base, rotation: 90 }, 'e', { x: 0, y: 20 })).toMatchObject({ x: 0, y: 30, width: 120, height: 80 });
  });

  it('45 度时右侧边手柄沿局部横轴缩放并保持对侧视觉锚点', () => {
    expect(resizeFromHandle({ ...base, rotation: 45 }, 'e', { x: 14.1421356, y: 14.1421356 })).toMatchObject({ x: 7.07, y: 27.07, width: 120, height: 80 });
  });

  it('90 度角手柄同时修改局部宽高并保持左上视觉锚点', () => {
    expect(resizeFromHandle({ ...base, rotation: 90 }, 'se', { x: -10, y: 20 })).toMatchObject({ x: -5, y: 25, width: 120, height: 90 });
  });
});

describe('图片导入与 PNG 导出竞态', () => {
  it('A 慢 B 快时取消 A 的读取和解码，只有 B 可以写入文档', async () => {
    const readers: ControlledReader[] = [];
    class ControlledReader {
      result: string | ArrayBuffer | null = null;
      error: DOMException | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      fileName = '';
      abort = vi.fn(() => this.onabort?.());
      readAsDataURL = vi.fn((file: File) => { this.fileName = file.name; });
      readAsText = vi.fn();
      constructor() { readers.push(this); }
      complete(value: string) { this.result = value; this.onload?.(); }
    }
    const images: ControlledImage[] = [];
    class ControlledImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 100;
      naturalHeight = 80;
      width = 100;
      height = 80;
      currentSource = '';
      constructor() { images.push(this); }
      set src(value: string) { this.currentSource = value; }
      get src() { return this.currentSource; }
      complete() { this.onload?.(); }
    }
    vi.stubGlobal('FileReader', ControlledReader as unknown as typeof FileReader);
    vi.stubGlobal('Image', ControlledImage as unknown as typeof Image);
    vi.mocked(URL.createObjectURL).mockImplementation((file) => `blob:${(file as File).name}`);
    renderEditor();
    const input = screen.getByLabelText('选择图片图层文件');

    fireEvent.change(input, { target: { files: [new File(['A'], 'A.png', { type: 'image/png' })] } });
    fireEvent.change(input, { target: { files: [new File(['B'], 'B.png', { type: 'image/png' })] } });
    readers[1].complete('data:image/png;base64,Qg==');
    images[1].complete();

    expect(await screen.findByText('已添加图片：B.png')).toBeVisible();
    expect(screen.getByRole('button', { name: '选择 B.png' })).toBeVisible();
    expect(screen.queryByRole('button', { name: '选择 A.png' })).toBeNull();
    expect(readers[0].abort).toHaveBeenCalledTimes(1);
    expect(images[0].src).toBe('');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:A.png');
  });

  it('卸载时取消未完成导入并立即释放图片对象 URL', () => {
    const readers: PendingReader[] = [];
    class PendingReader {
      result: string | ArrayBuffer | null = null;
      error: DOMException | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      abort = vi.fn(() => this.onabort?.());
      readAsDataURL = vi.fn();
      readAsText = vi.fn();
      constructor() { readers.push(this); }
    }
    const images: PendingImage[] = [];
    class PendingImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 100;
      naturalHeight = 80;
      currentSource = '';
      constructor() { images.push(this); }
      set src(value: string) { this.currentSource = value; }
      get src() { return this.currentSource; }
    }
    vi.stubGlobal('FileReader', PendingReader as unknown as typeof FileReader);
    vi.stubGlobal('Image', PendingImage as unknown as typeof Image);
    vi.mocked(URL.createObjectURL).mockReturnValue('blob:unmount.png');
    const view = renderEditor();
    fireEvent.change(screen.getByLabelText('选择图片图层文件'), { target: { files: [new File(['A'], 'unmount.png', { type: 'image/png' })] } });

    view.unmount();

    expect(readers[0].abort).toHaveBeenCalledTimes(1);
    expect(images[0].src).toBe('');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:unmount.png');
  });

  it('编辑会使慢导出 A 失效，快导出 B 成功后不被 A 的迟到失败覆盖', async () => {
    const callbacks: BlobCallback[] = [];
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation((callback) => { callbacks.push(callback); });
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: '添加矩形图层' }));
    await userEvent.click(screen.getByRole('button', { name: '导出 PNG' }));
    expect(callbacks).toHaveLength(1);

    fireEvent.change(screen.getByLabelText('图层 X 坐标'), { target: { value: '240' } });
    await userEvent.click(screen.getByRole('button', { name: '导出 PNG' }));
    expect(callbacks).toHaveLength(2);
    callbacks[1](new Blob(['B'], { type: 'image/png' }));
    expect(await screen.findByText('PNG 已生成，可下载')).toBeVisible();

    callbacks[0](null);
    await waitFor(() => expect(screen.getByText('PNG 已生成，可下载')).toBeVisible());
    expect(screen.queryByText(/无法真实编码 PNG/)).toBeNull();
  });
});
