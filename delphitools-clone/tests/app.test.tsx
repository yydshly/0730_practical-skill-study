/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, within } from '@testing-library/react';
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

  it('格式错误的工具路由编码显示未找到页面而不是崩溃', () => {
    window.history.replaceState({}, '', '/tools/%E0%A4%A');

    render(<App />);

    expect(screen.getByRole('heading', { name: '未找到工具' })).toBeVisible();
  });

  it('工具页侧栏提供可访问的全局中文搜索并返回过滤后的目录', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/tools/qr-genny');
    render(<App />);

    const search = screen.getByRole('searchbox', { name: '搜索工具' });
    await user.type(search, '二维码');

    expect(screen.getByRole('link', { name: /二维码生成器/ })).toBeVisible();
    expect(screen.queryByRole('link', { name: /科学计算器/ })).toBeNull();
  });

  it('移动端关闭的抽屉不会暴露内容，Escape 关闭后焦点返回打开按钮', async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    const user = userEvent.setup();

    render(<App />);

    const openButton = screen.getByRole('button', { name: '打开导航菜单' });
    expect(document.querySelector('aside')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('searchbox', { name: '搜索工具' })).toBeNull();

    await user.click(openButton);
    const drawer = screen.getByRole('dialog', { name: '工具导航' });
    const closeButton = within(drawer).getByRole('button', { name: '关闭导航菜单' });
    const themeButton = within(drawer).getByRole('button', { name: '切换到深色主题' });
    const brandLink = within(drawer).getByRole('link', { name: 'DelphiTools 首页' });
    expect(closeButton).toHaveFocus();
    expect(document.querySelector('main')).toHaveAttribute('inert');
    expect(document.querySelector('main')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('searchbox', { name: '搜索工具' })).toBeVisible();

    brandLink.focus();
    await user.tab({ shift: true });
    expect(themeButton).toHaveFocus();
    await user.tab();
    expect(brandLink).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(document.querySelector('aside')).toHaveAttribute('aria-hidden', 'true');
    expect(document.querySelector('main')).not.toHaveAttribute('inert');
    expect(openButton).toHaveFocus();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
  });

  it('移动端关闭抽屉时 Tab 不会进入内部搜索、链接或主题按钮', async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    const user = userEvent.setup();
    render(<App />);

    const openButton = screen.getByRole('button', { name: '打开导航菜单' });
    const drawer = document.querySelector('aside')!;
    expect(drawer.querySelector('input[type="search"]')).not.toBeNull();
    expect(drawer.querySelector('a[href="#featured"]')).not.toBeNull();
    expect(drawer.querySelector('.theme-button')).not.toBeNull();

    openButton.focus();
    for (let step = 0; step < 12; step += 1) {
      await user.tab({ shift: true });
      expect(drawer).not.toContain(document.activeElement);
    }

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
  });
});
