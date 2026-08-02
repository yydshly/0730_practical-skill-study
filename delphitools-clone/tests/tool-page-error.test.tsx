/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

import { ToolPage, WORKSPACE_LOADERS } from '../src/app/ToolPage';

const originalColorLoader = WORKSPACE_LOADERS.color;
const suppressExpectedChunkError = (event: ErrorEvent) => {
  if (event.error instanceof Error && event.error.message === '模拟工作区分块加载失败') {
    event.preventDefault();
  }
};

afterEach(() => {
  cleanup();
  window.removeEventListener('error', suppressExpectedChunkError);
  (WORKSPACE_LOADERS as { color: typeof originalColorLoader }).color = originalColorLoader;
  vi.restoreAllMocks();
});

it('工作区分块加载失败时显示中文错误，并可重试恢复', async () => {
  const user = userEvent.setup();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  window.addEventListener('error', suppressExpectedChunkError);
  const loader = vi.fn()
    .mockRejectedValueOnce(new Error('模拟工作区分块加载失败'))
    .mockResolvedValueOnce({ default: () => <div>工作区已恢复</div> });
  (WORKSPACE_LOADERS as { color: typeof originalColorLoader }).color = loader;

  render(<ToolPage toolId="colour-converter" />);

  expect(await screen.findByRole('alert')).toHaveTextContent('颜色格式转换工作区加载失败');
  await user.click(screen.getByRole('button', { name: '重试加载工作区' }));

  expect(await screen.findByText('工作区已恢复')).toBeVisible();
  expect(loader).toHaveBeenCalledTimes(2);
});
