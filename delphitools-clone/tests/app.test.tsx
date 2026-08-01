/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { App } from '../src/app/App';

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('应用壳', () => {
  it('首页可以通过中文关键词过滤工具', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('searchbox'), '二维码');

    expect(screen.getByRole('link', { name: /二维码生成器/ })).toBeVisible();
    expect(screen.queryByRole('link', { name: /科学计算器/ })).toBeNull();
  });

  it('主题按钮会切换根元素主题', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '切换到深色主题' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('delphitools-theme')).toBe('dark');
  });

  it('不存在的工具路由显示未找到页面而不是抛出错误', () => {
    window.history.replaceState({}, '', '/tools/not-a-tool');

    render(<App />);

    expect(screen.getByRole('heading', { name: '未找到工具' })).toBeVisible();
    expect(screen.getByRole('link', { name: '返回工具目录' })).toHaveAttribute('href', '/');
  });
});
