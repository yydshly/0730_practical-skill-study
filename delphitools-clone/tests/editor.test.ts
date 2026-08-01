/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';
import { PNG_BASE64, bytesFromBase64 } from './fixtures/image-fixtures';

import {
  HISTORY_LIMIT,
  addImageLayer,
  allocateLayerId,
  createDocument,
  editorReducer,
  moveLayer,
  redo,
  renderDocument,
  reorderLayer,
  resizeLayer,
  rotateLayer,
  undo,
} from '../src/engines/editor';

describe('Substrata 可序列化状态机', () => {
  it('重复显式 ID 会改用真正可用的候选 ID，且不会与自动 ID 冲突', () => {
    const usedIds = new Set(['same', 'layer-1']);
    expect(allocateLayerId('same', usedIds, 1)).toEqual({ id: 'layer-2', nextLayerNumber: 3 });

    const document = createDocument([
      { id: 'same', type: 'rectangle' },
      { id: 'same', type: 'circle' },
      { id: 'layer-1', type: 'arrow' },
      { type: 'text', text: '自动编号' },
    ]);

    expect(document.layers.map((layer) => layer.id)).toEqual(['same', 'layer-1', 'layer-2', 'layer-3']);
    expect(new Set(document.layers.map((layer) => layer.id)).size).toBe(4);
    expect(document.nextLayerNumber).toBe(4);
  });

  it('移动图层后撤销可以恢复原位置', () => {
    const initial = createDocument([
      { id: 'a', type: 'rectangle', x: 10, y: 20, width: 100, height: 80 },
    ]);
    const moved = editorReducer(initial, { type: 'move', id: 'a', x: 40, y: 50 });
    const undone = editorReducer(moved, { type: 'undo' });
    expect(undone.layers[0]).toMatchObject({ x: 10, y: 20 });
  });

  it('添加五类图层时生成唯一 ID，且文档可以 JSON 序列化', () => {
    let document = createDocument();
    document = editorReducer(document, { type: 'add', layerType: 'image', source: 'data:image/png;base64,AA==', width: 80, height: 60 });
    document = editorReducer(document, { type: 'add', layerType: 'text', text: '中文标题' });
    document = editorReducer(document, { type: 'add', layerType: 'rectangle' });
    document = editorReducer(document, { type: 'add', layerType: 'circle' });
    document = editorReducer(document, { type: 'add', layerType: 'arrow' });

    expect(document.layers.map((layer) => layer.type)).toEqual(['image', 'text', 'rectangle', 'circle', 'arrow']);
    expect(new Set(document.layers.map((layer) => layer.id)).size).toBe(5);
    expect(() => JSON.stringify(document)).not.toThrow();
  });

  it('选中、取消选中和删除都会保持明确的选择状态', () => {
    let document = createDocument([{ id: 'a', type: 'rectangle' }, { id: 'b', type: 'circle' }]);
    document = editorReducer(document, { type: 'select', id: 'a' });
    expect(document.selectedLayerId).toBe('a');
    document = editorReducer(document, { type: 'select', id: null });
    expect(document.selectedLayerId).toBeNull();
    document = editorReducer(document, { type: 'select', id: 'b' });
    document = editorReducer(document, { type: 'delete', id: 'b' });
    expect(document.layers.map((layer) => layer.id)).toEqual(['a']);
    expect(document.selectedLayerId).toBeNull();
  });

  it('移动、缩放和旋转会规范化非有限值、最小尺寸和角度', () => {
    const initial = createDocument([{ id: 'a', type: 'rectangle', x: 10, y: 20, width: 100, height: 80 }]);
    const moved = moveLayer(initial, 'a', Number.NaN, 40.126);
    const resized = resizeLayer(moved, 'a', -20, 20.555);
    const rotated = rotateLayer(resized, 'a', 725);
    expect(rotated.layers[0]).toMatchObject({ x: 10, y: 40.13, width: 1, height: 20.56, rotation: 5 });
  });

  it('锁定图层不能被画布变换修改，但属性解锁后可以继续编辑', () => {
    let document = createDocument([{ id: 'a', type: 'rectangle', x: 10, y: 20, width: 100, height: 80, locked: true }]);
    document = moveLayer(document, 'a', 50, 60, { source: 'canvas' });
    document = resizeLayer(document, 'a', 200, 160, { source: 'canvas' });
    document = rotateLayer(document, 'a', 45, { source: 'canvas' });
    expect(document.layers[0]).toMatchObject({ x: 10, y: 20, width: 100, height: 80, rotation: 0 });
    document = editorReducer(document, { type: 'toggle-lock', id: 'a' });
    document = moveLayer(document, 'a', 50, 60, { source: 'canvas' });
    expect(document.layers[0]).toMatchObject({ x: 50, y: 60 });
  });

  it('前移、后移、置顶和置底按数组从底到顶调整顺序', () => {
    const initial = createDocument([
      { id: 'a', type: 'rectangle' },
      { id: 'b', type: 'circle' },
      { id: 'c', type: 'arrow' },
    ]);
    expect(reorderLayer(initial, 'a', 'forward').layers.map((layer) => layer.id)).toEqual(['b', 'a', 'c']);
    expect(reorderLayer(initial, 'c', 'backward').layers.map((layer) => layer.id)).toEqual(['a', 'c', 'b']);
    expect(reorderLayer(initial, 'a', 'front').layers.map((layer) => layer.id)).toEqual(['b', 'c', 'a']);
    expect(reorderLayer(initial, 'c', 'back').layers.map((layer) => layer.id)).toEqual(['c', 'a', 'b']);
  });

  it('连续编辑支持撤销重做，新编辑会清空 redo 分支', () => {
    const initial = createDocument([{ id: 'a', type: 'rectangle', x: 0, y: 0 }]);
    const first = moveLayer(initial, 'a', 10, 10);
    const second = moveLayer(first, 'a', 20, 20);
    const back = undo(second);
    expect(back.layers[0]).toMatchObject({ x: 10, y: 10 });
    expect(redo(back).layers[0]).toMatchObject({ x: 20, y: 20 });
    const branched = moveLayer(back, 'a', 30, 30);
    expect(branched.future).toHaveLength(0);
    expect(redo(branched).layers[0]).toMatchObject({ x: 30, y: 30 });
  });

  it('历史记录达到上限后丢弃最早快照', () => {
    let document = createDocument([{ id: 'a', type: 'rectangle', x: 0, y: 0 }]);
    for (let index = 1; index <= HISTORY_LIMIT + 8; index += 1) document = moveLayer(document, 'a', index, index);
    expect(document.history).toHaveLength(HISTORY_LIMIT);
    for (let index = 0; index < HISTORY_LIMIT; index += 1) document = undo(document);
    expect(document.layers[0]).toMatchObject({ x: 8, y: 8 });
  });

  it('画布设置支持尺寸、背景色和透明背景，并可撤销', () => {
    const initial = createDocument([], { width: 1200, height: 800, background: '#ffffff', transparent: false });
    const changed = editorReducer(initial, { type: 'set-canvas', canvas: { width: 640, height: 480, background: '#123456', transparent: true } });
    expect(changed.canvas).toEqual({ width: 640, height: 480, background: '#123456', transparent: true });
    expect(undo(changed).canvas).toEqual({ width: 1200, height: 800, background: '#ffffff', transparent: false });
  });

  it('便捷函数添加图片时保留可序列化来源和真实尺寸', () => {
    const document = addImageLayer(createDocument(), { source: 'data:image/png;base64,AA==', name: '照片', width: 320, height: 240 });
    expect(document.layers[0]).toMatchObject({ type: 'image', name: '照片', source: 'data:image/png;base64,AA==', width: 320, height: 240 });
  });
});

describe('Substrata PNG 渲染', () => {
  type ContextCall = { name: string; args: unknown[] };

  function blobBytes(blob: Blob): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.readAsArrayBuffer(blob);
    });
  }

  function canvasHarness() {
    const calls: ContextCall[] = [];
    const record = (name: string) => vi.fn((...args: unknown[]) => { calls.push({ name, args }); });
    const context = {
      clearRect: record('clearRect'),
      fillRect: record('fillRect'),
      strokeRect: record('strokeRect'),
      beginPath: record('beginPath'),
      ellipse: record('ellipse'),
      moveTo: record('moveTo'),
      lineTo: record('lineTo'),
      closePath: record('closePath'),
      stroke: record('stroke'),
      fill: record('fill'),
      fillText: record('fillText'),
      drawImage: record('drawImage'),
      save: record('save'),
      restore: record('restore'),
      translate: record('translate'),
      rotate: record('rotate'),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'left',
      textBaseline: 'top',
    };
    let globalAlpha = 1;
    Object.defineProperty(context, 'globalAlpha', {
      configurable: true,
      get: () => globalAlpha,
      set: (value: number) => { globalAlpha = value; calls.push({ name: 'globalAlpha', args: [value] }); },
    });
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(canvas, 'toBlob').mockImplementation((callback) => {
      const bytes = bytesFromBase64(PNG_BASE64);
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      callback(new Blob([buffer], { type: 'image/png' }));
    });
    return { canvas, context, calls };
  }

  it('按图层从底到顶渲染，跳过隐藏层，并使用文档尺寸导出真实 PNG', async () => {
    const harness = canvasHarness();
    const document = createDocument([
      { id: 'r', type: 'rectangle', name: '底层矩形' },
      { id: 'hidden', type: 'circle', name: '隐藏圆形', hidden: true },
      { id: 't', type: 'text', name: '顶层文字', text: '标题' },
    ], { width: 640, height: 480, background: '#ffffff', transparent: false });

    const blob = await renderDocument(document, { canvasFactory: () => harness.canvas });

    expect(harness.canvas.width).toBe(640);
    expect(harness.canvas.height).toBe(480);
    expect(harness.calls.filter((call) => call.name === 'fillRect' || call.name === 'fillText').map((call) => call.name)).toEqual(['fillRect', 'fillRect', 'fillText']);
    expect(blob.type).toBe('image/png');
  });

  it('记录两层最终顺序、撤销后坐标以及 transform、rotate 和 globalAlpha', async () => {
    const harness = canvasHarness();
    let document = createDocument([
      { id: 'shape', type: 'rectangle', x: 10, y: 20, width: 100, height: 80, rotation: 45, opacity: 0.4 },
      { id: 'title', type: 'text', x: 200, y: 30, width: 120, height: 40, text: '顶层' },
    ], { transparent: true });
    document = moveLayer(document, 'shape', 90, 100);
    document = undo(document);
    document = reorderLayer(document, 'shape', 'front');

    await renderDocument(document, { canvasFactory: () => harness.canvas });

    const drawingOrder = harness.calls.filter((call) => ['fillText', 'fillRect'].includes(call.name)).map((call) => call.name);
    expect(drawingOrder).toEqual(['fillText', 'fillRect']);
    expect(harness.calls).toContainEqual({ name: 'translate', args: [60, 60] });
    expect(harness.calls).not.toContainEqual({ name: 'translate', args: [140, 140] });
    expect(harness.calls).toContainEqual({ name: 'rotate', args: [Math.PI / 4] });
    expect(harness.calls).toContainEqual({ name: 'globalAlpha', args: [0.4] });
  });

  it('绘制圆形、箭头和可见图片，并完整跳过隐藏图层', async () => {
    const harness = canvasHarness();
    const image = { fixture: 'visible-image' } as unknown as CanvasImageSource;
    const document = createDocument([
      { id: 'circle', type: 'circle', width: 80, height: 60 },
      { id: 'hidden', type: 'rectangle', hidden: true, width: 999, height: 999 },
      { id: 'arrow', type: 'arrow', width: 120, height: 40 },
      { id: 'image', type: 'image', source: 'fixture.png', width: 90, height: 70 },
    ], { transparent: true });

    await renderDocument(document, { canvasFactory: () => harness.canvas, imageLoader: async () => image });

    expect(harness.calls.some((call) => call.name === 'ellipse' && call.args[2] === 40 && call.args[3] === 30)).toBe(true);
    expect(harness.calls.filter((call) => call.name === 'lineTo')).toHaveLength(3);
    expect(harness.calls).toContainEqual({ name: 'drawImage', args: [image, -45, -35, 90, 70] });
    expect(harness.calls.some((call) => call.name === 'fillRect' && call.args.includes(999))).toBe(false);
    const landmarks = harness.calls.filter((call) => ['ellipse', 'lineTo', 'drawImage'].includes(call.name)).map((call) => call.name);
    expect(landmarks[0]).toBe('ellipse');
    expect(landmarks[landmarks.length - 1]).toBe('drawImage');
  });

  it('toBlob 测试夹具包含有效 PNG 签名和 1×1 IHDR 尺寸', async () => {
    const harness = canvasHarness();
    const blob = await renderDocument(createDocument([], { width: 1, height: 1, transparent: true }), { canvasFactory: () => harness.canvas });
    const bytes = await blobBytes(blob);
    const expectedFixture = bytesFromBase64(PNG_BASE64);

    expect([...bytes.slice(0, 8)]).toEqual([...expectedFixture.slice(0, 8)]);
    expect(String.fromCharCode(...bytes.slice(12, 16))).toBe('IHDR');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(view.getUint32(16)).toBe(1);
    expect(view.getUint32(20)).toBe(1);
  });

  it('透明画布会清空底色，图片解码失败给出中文图层错误', async () => {
    const harness = canvasHarness();
    const document = createDocument([
      { id: 'i', type: 'image', name: '跨域照片', source: 'https://example.invalid/photo.png' },
    ], { transparent: true });

    await expect(renderDocument(document, {
      canvasFactory: () => harness.canvas,
      imageLoader: async () => { throw new Error('decode failed'); },
    })).rejects.toThrow('图片图层“跨域照片”解码失败');
    expect(harness.context.clearRect).toHaveBeenCalled();
  });

  it('Canvas 被跨域污染时不生成伪 PNG，并返回中文恢复提示', async () => {
    const harness = canvasHarness();
    vi.mocked(harness.canvas.toBlob).mockImplementation(() => { throw new DOMException('Tainted canvases may not be exported', 'SecurityError'); });
    const document = createDocument([{ id: 'r', type: 'rectangle' }]);
    await expect(renderDocument(document, { canvasFactory: () => harness.canvas })).rejects.toThrow('跨域');
  });

  it('远程图片使用匿名跨域解码，并在渲染结束后释放图片资源', async () => {
    const harness = canvasHarness();
    const instances: ImmediateImage[] = [];
    class ImmediateImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      crossOrigin: string | null = null;
      currentSource = '';
      constructor() { instances.push(this); }
      set src(value: string) {
        this.currentSource = value;
        if (value) queueMicrotask(() => this.onload?.());
      }
      get src() { return this.currentSource; }
    }
    vi.stubGlobal('Image', ImmediateImage as unknown as typeof Image);
    const document = createDocument([{ id: 'remote', type: 'image', name: '远程图片', source: 'https://assets.example/photo.png' }]);

    await renderDocument(document, { canvasFactory: () => harness.canvas });

    expect(instances).toHaveLength(1);
    expect(instances[0].crossOrigin).toBe('anonymous');
    expect(instances[0].onload).toBeNull();
    expect(instances[0].onerror).toBeNull();
    expect(instances[0].src).toBe('');
  });

  it('取消图片渲染会向加载器传递 AbortSignal，并保留 AbortError', async () => {
    const harness = canvasHarness();
    const controller = new AbortController();
    const loader = vi.fn((_source: string, _signal?: AbortSignal) => new Promise<CanvasImageSource>((_resolve, reject) => {
      controller.signal.addEventListener('abort', () => reject(new DOMException('操作已取消', 'AbortError')), { once: true });
    }));
    const document = createDocument([{ id: 'pending', type: 'image', name: '待解码图片', source: 'pending.png' }]);
    const rendering = renderDocument(document, { canvasFactory: () => harness.canvas, imageLoader: loader, signal: controller.signal });

    controller.abort();

    await expect(rendering).rejects.toMatchObject({ name: 'AbortError' });
    expect(loader).toHaveBeenCalledWith('pending.png', controller.signal);
  });

  it('取消默认图片解码会清空 src 和事件处理器', async () => {
    const harness = canvasHarness();
    const instances: PendingImage[] = [];
    class PendingImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      crossOrigin: string | null = null;
      currentSource = '';
      constructor() { instances.push(this); }
      set src(value: string) { this.currentSource = value; }
      get src() { return this.currentSource; }
    }
    vi.stubGlobal('Image', PendingImage as unknown as typeof Image);
    const controller = new AbortController();
    const rendering = renderDocument(
      createDocument([{ id: 'pending', type: 'image', name: '待取消图片', source: 'https://assets.example/pending.png' }]),
      { canvasFactory: () => harness.canvas, signal: controller.signal },
    );

    controller.abort();

    await expect(rendering).rejects.toMatchObject({ name: 'AbortError' });
    expect(instances[0].src).toBe('');
    expect(instances[0].onload).toBeNull();
    expect(instances[0].onerror).toBeNull();
  });

  it('取消等待中的 PNG 编码会立即结束，不等待迟到的 toBlob', async () => {
    const harness = canvasHarness();
    vi.mocked(harness.canvas.toBlob).mockImplementation(() => undefined);
    const controller = new AbortController();
    const rendering = renderDocument(createDocument(), { canvasFactory: () => harness.canvas, signal: controller.signal });

    controller.abort();

    const outcome = await Promise.race([
      rendering.then(() => 'success', (reason: unknown) => reason instanceof DOMException ? reason.name : 'error'),
      new Promise<string>((resolve) => setTimeout(() => resolve('still-pending'), 20)),
    ]);
    expect(outcome).toBe('AbortError');
  });
});
