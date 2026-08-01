import { describe, expect, it, vi } from 'vitest';

import {
  bookletOrder,
  createZinePdf,
  imposePdf,
  nUpLayout,
  optimiseSvg,
  preflightPdf,
  removeBackground,
  traceImage,
  zineEightPageOrder,
} from '../src/engines/pdf';
import { PDFDocument } from 'pdf-lib';
import { workerErrorResponse } from '../src/workers/protocol';

describe('PDF 页序与版面', () => {
  it('八页小册子输出正确的外侧和内侧顺序', () => {
    expect(bookletOrder(8)).toEqual([[8, 1, 2, 7], [6, 3, 4, 5]]);
  });

  it('非四倍数页数用 null 补齐但不伪造来源页', () => {
    expect(bookletOrder(5)).toEqual([[null, 1, 2, null], [null, 3, 4, 5]]);
  });

  it('八页 mini-zine 使用固定折叠顺序', () => {
    expect(zineEightPageOrder()).toEqual([8, 1, 2, 7, 6, 3, 4, 5]);
  });

  it('N-up 按横向 A4、边距与间距计算四个不重叠区域', () => {
    const result = nUpLayout({ paper: 'A4', orientation: 'landscape', columns: 2, rows: 2, margin: 20, gap: 10 });
    expect(result.sheet).toEqual({ width: 841.89, height: 595.28 });
    expect(result.placements).toEqual([
      { x: 20, y: 302.64, width: 395.945, height: 272.64 },
      { x: 425.945, y: 302.64, width: 395.945, height: 272.64 },
      { x: 20, y: 20, width: 395.945, height: 272.64 },
      { x: 425.945, y: 20, width: 395.945, height: 272.64 },
    ]);
  });

  it('N-up 拒绝会吃掉纸张空间的边距和间距', () => {
    expect(() => nUpLayout({ paper: 'A4', orientation: 'portrait', columns: 2, rows: 2, margin: 300, gap: 20 }))
      .toThrow('边距和间距超过纸张可用范围');
  });
});

describe('PDF 预检错误', () => {
  it('非法 PDF 返回中文错误', async () => {
    await expect(preflightPdf(new TextEncoder().encode('not a pdf'))).rejects.toThrow('不是有效的 PDF 文件');
  });

  it('加密 PDF 返回中文错误且不尝试伪造结果', async () => {
    await expect(preflightPdf(new TextEncoder().encode('%PDF-1.7\n/Encrypt 4 0 R'))).rejects.toThrow('暂不支持加密 PDF');
  });

  it('预检读取页数、逐页尺寸、方向、元数据和尺寸不一致警告', async () => {
    const source = await PDFDocument.create();
    source.setTitle('本地样张');
    source.setAuthor('测试作者');
    source.addPage([595.28, 841.89]);
    source.addPage([841.89, 595.28]);
    const result = await preflightPdf(await source.save());
    expect(result.pageCount).toBe(2);
    expect(result.pages).toEqual([
      { number: 1, width: 595.28, height: 841.89, orientation: 'portrait' },
      { number: 2, width: 841.89, height: 595.28, orientation: 'landscape' },
    ]);
    expect(result.metadata).toMatchObject({ title: '本地样张', author: '测试作者' });
    expect(result.warnings).toContain('页面尺寸或方向不一致，请在印刷前确认');
  });

  it('N-up 和 Zine 都生成可被重新打开的真实 PDF', async () => {
    const source = await PDFDocument.create();
    for (let index = 0; index < 8; index += 1) source.addPage([300, 400]);
    const input = await source.save();
    const imposed = await imposePdf(input, { mode: 'nup', paper: 'A4', orientation: 'landscape', columns: 2, rows: 2, margin: 18, gap: 8, duplex: 'single', flip: 'long-edge' });
    const zine = await createZinePdf(input, { paper: 'A4', orientation: 'landscape', margin: 12, gap: 4 });
    expect((await PDFDocument.load(imposed)).getPageCount()).toBe(2);
    expect((await PDFDocument.load(zine)).getPageCount()).toBe(1);
    expect(new TextDecoder('latin1').decode(imposed.slice(0, 8))).toContain('%PDF-');
  });
});

describe('Worker 可序列化协议', () => {
  it('把未知错误转换为主线程可接收的中文错误响应', () => {
    const response = workerErrorResponse('job-1', new Error('解析失败'));
    expect(response).toEqual({ id: 'job-1', type: 'error', message: '解析失败' });
    expect(() => JSON.stringify(response)).not.toThrow();
  });
});

describe('SVG 安全优化', () => {
  it('删除注释和元数据，同时保留 viewBox、defs 引用与可见图形', () => {
    const source = '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><!--x--><metadata>编辑器</metadata><defs><path id="dot" d="M0 0h2v2H0z"/></defs><use href="#dot" x="4" y="4"/></svg>';
    const result = optimiseSvg(source);
    expect(result.svg).toContain('viewBox="0 0 20 20"');
    expect(result.svg).toContain('href="#dot"');
    expect(result.svg).toContain('<use');
    expect(result.svg).not.toContain('metadata');
    expect(result.svg).not.toContain('<!--');
    expect(result.afterBytes).toBeLessThan(result.beforeBytes);
  });

  it('拒绝外部实体并移除脚本、事件属性和危险外链', () => {
    expect(() => optimiseSvg('<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>'))
      .toThrow('不允许 XML 外部实体');
    const result = optimiseSvg('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script><a href="https://evil.example"><rect width="10" height="10"/></a><use href="#safe"/></svg>');
    expect(result.svg).not.toMatch(/script|onload|evil\.example/i);
    expect(result.svg).toContain('href="#safe"');
  });
});

describe('本地高级图像处理', () => {
  const raster = {
    width: 3,
    height: 1,
    data: new Uint8ClampedArray([
      255, 255, 255, 255,
      0, 0, 0, 255,
      255, 255, 255, 255,
    ]),
  };

  it('图片追踪输出含真实路径的安全 SVG', () => {
    const result = traceImage(raster, { threshold: 128, smoothing: 0, mode: 'monochrome', maxColors: 4 });
    expect(result).toContain('<svg');
    expect(result).toContain('<path');
    expect(result).toContain('viewBox="0 0 3 1"');
    expect(result).not.toContain('<image');
  });

  it('图片追踪校验阈值和平滑度边界', () => {
    expect(() => traceImage(raster, { threshold: 300, smoothing: 0, mode: 'monochrome', maxColors: 4 })).toThrow('阈值必须在 0 到 255 之间');
    expect(() => traceImage(raster, { threshold: 128, smoothing: 101, mode: 'color', maxColors: 4 })).toThrow('平滑度必须在 0 到 100 之间');
  });

  it('本地颜色背景移除产生透明像素并报告进度', () => {
    const progress = vi.fn();
    const result = removeBackground(raster, { threshold: 20, feather: 0 }, progress);
    expect(result.data[3]).toBe(0);
    expect(result.data[7]).toBe(255);
    expect(result.data[11]).toBe(0);
    expect(progress).toHaveBeenCalledWith(100);
  });

  it('已经取消的本地处理返回中文取消错误', () => {
    const controller = new AbortController();
    controller.abort();
    expect(() => removeBackground(raster, { threshold: 20, feather: 0 }, undefined, controller.signal)).toThrow('处理已取消');
    expect(() => traceImage(raster, { threshold: 128, smoothing: 0, mode: 'monochrome', maxColors: 4 }, controller.signal)).toThrow('处理已取消');
  });
});
