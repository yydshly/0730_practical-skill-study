/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../src/app/App';
import { clientPointToCanvas } from '../src/components/editor/CanvasStage';

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

beforeEach(() => {
  installDesktopViewport();
  installCanvas();
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
  vi.restoreAllMocks();
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
