/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToolLayout } from '../src/components/ToolLayout';
import { TOOLS } from '../src/data/tools';
import { ColorWorkspace } from '../src/tools/ColorWorkspace';
import { EditorWorkspace } from '../src/tools/EditorWorkspace';
import { ImageWorkspace } from '../src/tools/ImageWorkspace';
import { ToolExplanationPanel } from '../src/components/ToolExplanationPanel';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('工具能力与原理说明', () => {
  it('在每个工具说明底部标明参考网页、官方源码与本项目实现边界', () => {
    render(<ToolExplanationPanel toolId="qr-genny" />);

    const referenceSite = screen.getByRole('link', { name: 'delphitools 参考网页' });
    expect(referenceSite).toHaveAttribute('href', 'https://tools.rmv.fyi/');
    expect(referenceSite).toHaveAttribute('target', '_blank');
    expect(referenceSite).toHaveAttribute('rel', 'noopener noreferrer');

    const sourceRepository = screen.getByRole('link', { name: 'delphitools 官方源码库' });
    expect(sourceRepository).toHaveAttribute('href', 'https://github.com/1612elphi/delphitools');
    expect(sourceRepository).toHaveAttribute('target', '_blank');
    expect(sourceRepository).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText(/这里描述的是当前中文项目的实际实现/)).toBeVisible();
  });

  it('先显示状态、摘要和算法原理，并能展开限制', async () => {
    const user = userEvent.setup();
    render(<ToolExplanationPanel toolId="qr-genny" />);

    expect(screen.getByRole('heading', { name: '能力与实现说明' })).toBeVisible();
    expect(screen.getByText('当前无法完整实现')).toBeVisible();
    expect(screen.getByRole('heading', { name: '算法与实现原理' })).toBeVisible();

    const limitations = screen.getByText('当前限制与差异').closest('details');
    expect(limitations).not.toHaveAttribute('open');
    await user.click(screen.getByText('当前限制与差异'));
    expect(limitations).toHaveAttribute('open');
    expect(within(limitations!).getByText(/WiFi/)).toBeVisible();
  });

  it('普通 ToolLayout 在工作区之后显示统一说明', () => {
    const tool = TOOLS.find((item) => item.id === 'qr-genny')!;
    render(<ToolLayout tool={tool}><div aria-label="测试工作区" /></ToolLayout>);

    const workspace = screen.getByLabelText('测试工作区');
    const explanation = screen.getByRole('heading', { name: '能力与实现说明' });
    expect(workspace.compareDocumentPosition(explanation) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
  });

  it.each([
    ['matte-generator', ImageWorkspace, '.image-workspace'],
    ['colour-converter', ColorWorkspace, '.color-workspace'],
  ] as const)('真实 %s 页面在工作区之后显示统一说明', (toolId, Workspace, workspaceSelector) => {
    const tool = TOOLS.find((item) => item.id === toolId)!;
    render(<Workspace tool={tool} />);

    const workspace = document.querySelector(workspaceSelector)!;
    const explanation = screen.getByRole('heading', { name: '能力与实现说明' });
    expect(workspace.compareDocumentPosition(explanation) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
  });

  it('编辑器抽屉打开时隔离说明区，关闭后恢复页面并还原焦点', async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: query === '(max-width: 900px)',
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(), fillRect: vi.fn(), strokeRect: vi.fn(), beginPath: vi.fn(), ellipse: vi.fn(),
      moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), stroke: vi.fn(), fill: vi.fn(), fillText: vi.fn(),
      drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), setTransform: vi.fn(),
      globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: 'left', textBaseline: 'top',
    } as unknown as CanvasRenderingContext2D);
    const tool = TOOLS.find((item) => item.id === 'editor')!;
    const { unmount } = render(<EditorWorkspace tool={tool} />);

    const explanationWrap = document.querySelector('.editor-explanation-wrap')!;
    const editorWorkspace = document.querySelector('.substrata-workspace')!;
    expect(explanationWrap).not.toHaveAttribute('inert');
    const user = userEvent.setup();
    const layersTrigger = screen.getByRole('button', { name: '打开图层面板' });
    await user.click(layersTrigger);
    expect(explanationWrap).toHaveAttribute('aria-hidden', 'true');
    expect(explanationWrap).toHaveAttribute('inert');
    expect(editorWorkspace).toHaveAttribute('aria-hidden', 'true');
    expect(editorWorkspace).toHaveAttribute('inert');

    await user.click(screen.getByRole('button', { name: '关闭图层面板' }));
    expect(explanationWrap).not.toHaveAttribute('aria-hidden');
    expect(explanationWrap).not.toHaveAttribute('inert');
    expect(editorWorkspace).not.toHaveAttribute('aria-hidden');
    expect(editorWorkspace).not.toHaveAttribute('inert');
    expect(layersTrigger).toHaveFocus();

    unmount();
    window.matchMedia = originalMatchMedia;
  });
});
