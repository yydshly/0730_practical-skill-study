import { describe, expect, it } from 'vitest';

import { createRouteHref, resolveRoutePath } from '../src/core/navigation';

describe('静态展示导航', () => {
  it('开发环境从 pathname 读取页面路由', () => {
    expect(resolveRoutePath('/capabilities', '')).toBe('/capabilities');
  });

  it('GitHub Pages 从 hash 读取页面路由', () => {
    expect(resolveRoutePath('/0730_practical-skill-study/delphitools-clone/site/', '#/tools/qr-genny'))
      .toBe('/tools/qr-genny');
  });

  it('忽略不是页面路由的普通锚点', () => {
    expect(resolveRoutePath('/capabilities', '#featured')).toBe('/capabilities');
  });

  it('生产展示生成可刷新的 hash 链接', () => {
    expect(createRouteHref('/capabilities', true)).toBe('#/capabilities');
    expect(createRouteHref('/tools/qr-genny', true)).toBe('#/tools/qr-genny');
  });

  it('本地开发保留原有 pathname 链接', () => {
    expect(createRouteHref('/capabilities', false)).toBe('/capabilities');
  });
});
