import { render, waitFor, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

export async function renderAfterLazy(element: ReactElement): Promise<RenderResult> {
  const result = render(element);
  await waitFor(() => {
    if (result.container.querySelector('.workspace-loading')) {
      throw new Error('工作区仍在加载');
    }
  }, { timeout: 5000 });
  return result;
}
