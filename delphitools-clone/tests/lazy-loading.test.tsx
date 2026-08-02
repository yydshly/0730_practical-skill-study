/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const moduleLoads = vi.hoisted(() => [] as string[]);

vi.mock('pdf-lib', async (importOriginal) => {
  moduleLoads.push('pdf-lib');
  return importOriginal();
});

vi.mock('bwip-js', async (importOriginal) => {
  moduleLoads.push('bwip-js');
  return importOriginal();
});

vi.mock('qrcode', async (importOriginal) => {
  moduleLoads.push('qrcode');
  return importOriginal();
});

vi.mock('../src/tools/EditorWorkspace', () => {
  moduleLoads.push('editor');
  return { EditorWorkspace: () => <div>编辑器工作区</div> };
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

describe('工具工作区按路由加载', () => {
  it('首页不加载 PDF、条码、二维码或编辑器模块', async () => {
    window.history.replaceState({}, '', '/');
    const { App } = await import('../src/app/App');

    render(<App />);

    expect(screen.getByRole('heading', { name: '为日常创作准备的实用工具' })).toBeVisible();
    expect(moduleLoads).toEqual([]);
  });

  it('工具路由先显示中文加载状态再显示对应工作区', async () => {
    window.history.replaceState({}, '', '/tools/qr-genny');
    const { App } = await import('../src/app/App');

    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent('正在加载二维码生成器工作区');
    expect(await screen.findByLabelText('二维码内容', {}, { timeout: 5000 })).toBeVisible();
    expect(moduleLoads).toContain('qrcode');
    expect(moduleLoads).not.toContain('pdf-lib');
    expect(moduleLoads).not.toContain('editor');
  });
});
