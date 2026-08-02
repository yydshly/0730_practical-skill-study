/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { App } from '../src/app/App';

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

describe('能力与实现说明总览', () => {
  it('公开参考网页、官方源码和当前独立实现边界', () => {
    window.history.replaceState({}, '', '/capabilities');
    render(<App />);

    expect(screen.getByRole('heading', { name: '参考来源与实现关系' })).toBeVisible();
    expect(screen.getByText(/独立中文实现/)).toBeVisible();
    expect(screen.getByText(/尚未全部完成/)).toBeVisible();

    const referenceSite = screen.getByRole('link', { name: 'delphitools 参考网页' });
    expect(referenceSite).toHaveAttribute('href', 'https://tools.rmv.fyi/');
    expect(referenceSite).toHaveAttribute('target', '_blank');
    expect(referenceSite).toHaveAttribute('rel', 'noopener noreferrer');

    const sourceRepository = screen.getByRole('link', { name: 'delphitools 官方源码库' });
    expect(sourceRepository).toHaveAttribute('href', 'https://github.com/1612elphi/delphitools');
    expect(sourceRepository).toHaveAttribute('target', '_blank');
    expect(sourceRepository).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'MIT License' })).toHaveAttribute(
      'href',
      'https://github.com/1612elphi/delphitools/blob/main/LICENSE',
    );
  });

  it('显示 56 项统计、工具链接与无法完整实现原因', () => {
    window.history.replaceState({}, '', '/capabilities');
    render(<App />);

    expect(screen.getByRole('heading', { name: '能力与实现说明' })).toBeVisible();
    expect(screen.getByText('完整实现 0')).toBeVisible();
    expect(screen.getByText('主要能力完整 17')).toBeVisible();
    expect(screen.getByText('部分实现 24')).toBeVisible();
    expect(screen.getByText('当前无法完整实现 15')).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(56);
    expect(screen.getByRole('link', { name: /二维码生成器/ })).toHaveAttribute('href', '/tools/qr-genny');

    const unavailableCard = screen.getByRole('article', { name: /背景移除/ });
    expect(within(unavailableCard).getByText('缺少自动前景分割模型或等效的高质量抠图算法。')).toBeVisible();
  });

  it('仅在本地按实现状态筛选工具卡片', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/capabilities');
    render(<App />);

    await user.selectOptions(screen.getByRole('combobox', { name: '按实现状态筛选' }), 'unavailable');

    expect(screen.getAllByRole('article')).toHaveLength(15);
    expect(screen.getByRole('article', { name: /背景移除/ })).toBeVisible();
    expect(screen.queryByRole('article', { name: /对比度检查/ })).toBeNull();
  });
});
