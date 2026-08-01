/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { App } from '../src/app/App';

afterEach(cleanup);

describe('颜色工具工作区', () => {
  it('颜色路由呈现可操作的转换工作区，其他路由保留原工作区边界', () => {
    window.history.replaceState({}, '', '/tools/colour-converter');
    const { unmount } = render(<App />);
    expect(screen.getByRole('heading', { name: '颜色格式转换' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: '输入颜色' })).toHaveValue('#3b82f6');
    expect(screen.getByText('HEX')).toBeVisible();
    unmount();

    window.history.replaceState({}, '', '/tools/qr-genny');
    render(<App />);
    expect(screen.getByText('正在构建此工具')).toBeVisible();
  });
});
