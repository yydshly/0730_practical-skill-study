/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';

import {
  HISTORY_LIMIT,
  addImageLayer,
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
  function canvasHarness() {
    const calls: string[] = [];
    const context = {
      clearRect: vi.fn(() => calls.push('clear')),
      fillRect: vi.fn(() => calls.push('rectangle')),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      ellipse: vi.fn(() => calls.push('circle')),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(() => calls.push('arrow')),
      fill: vi.fn(),
      fillText: vi.fn(() => calls.push('text')),
      drawImage: vi.fn(() => calls.push('image')),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      globalAlpha: 1,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'left',
      textBaseline: 'top',
    };
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(canvas, 'toBlob').mockImplementation((callback) => callback(new Blob(['png'], { type: 'image/png' })));
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
    expect(harness.calls).toEqual(['rectangle', 'rectangle', 'text']);
    expect(blob.type).toBe('image/png');
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
});
