/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';
import { decodePDFRawStream, PDFRawStream } from 'pdf-lib/es/core';

import {
  bookletOrder,
  createZinePdf,
  embeddedPagePlacement,
  impositionPlacementsForSide,
  imposePdf,
  nUpLayout,
  optimiseSvg,
  preflightPdf,
  removeBackground,
  traceImage,
  zineEightPageOrder,
} from '../src/engines/pdf';
import { degrees, PDFDocument, rgb } from 'pdf-lib';
import { workerErrorResponse } from '../src/workers/protocol';

function outputPdfSemantics(bytes: Uint8Array): Promise<Array<{ size: { width: number; height: number }; operations: string[] }>> {
  return PDFDocument.load(bytes).then((document) => document.getPages().map((page) => {
    const contents = page.node.normalizedEntries().Contents;
    const operations = contents
      ? Array.from({ length: contents.size() }, (_, index) => {
        const stream = contents.lookup(index);
        if (stream && 'getUnencodedContents' in stream) {
          return new TextDecoder('latin1').decode((stream as { getUnencodedContents: () => Uint8Array }).getUnencodedContents());
        }
        if (stream && 'dict' in stream) {
          return new TextDecoder('latin1').decode(decodePDFRawStream(stream as PDFRawStream).decode());
        }
        throw new Error('输出页面包含无法解析的内容流');
      })
      : [];
    return { size: page.getSize(), operations };
  }));
}

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

  it('纵向纸张按长边镜像 X、短边镜像 Y，覆盖 Nx1 与 1xN 版位', () => {
    const horizontal = nUpLayout({ paper: 'A4', orientation: 'portrait', columns: 3, rows: 1, margin: 20, gap: 10 });
    const vertical = nUpLayout({ paper: 'A4', orientation: 'portrait', columns: 1, rows: 3, margin: 20, gap: 10 });
    const longEdge = impositionPlacementsForSide(horizontal, 1, { orientation: 'portrait', duplex: 'double', flip: 'long-edge' });
    const shortEdge = impositionPlacementsForSide(vertical, 1, { orientation: 'portrait', duplex: 'double', flip: 'short-edge' });

    expect(longEdge.map((placement) => placement.x)).toEqual([...horizontal.placements].reverse().map((placement) => expect.closeTo(placement.x, 2)));
    expect(longEdge.map((placement) => placement.y)).toEqual(horizontal.placements.map((placement) => placement.y));
    expect(shortEdge.map((placement) => placement.y)).toEqual([...vertical.placements].reverse().map((placement) => expect.closeTo(placement.y, 2)));
    expect(shortEdge.map((placement) => placement.x)).toEqual(vertical.placements.map((placement) => placement.x));
  });

  it('横向纸张按长边镜像 Y、短边镜像 X，覆盖 1xN 与 Nx1 版位', () => {
    const vertical = nUpLayout({ paper: 'A4', orientation: 'landscape', columns: 1, rows: 3, margin: 20, gap: 10 });
    const horizontal = nUpLayout({ paper: 'A4', orientation: 'landscape', columns: 3, rows: 1, margin: 20, gap: 10 });
    const longEdge = impositionPlacementsForSide(vertical, 1, { orientation: 'landscape', duplex: 'double', flip: 'long-edge' });
    const shortEdge = impositionPlacementsForSide(horizontal, 1, { orientation: 'landscape', duplex: 'double', flip: 'short-edge' });

    expect(longEdge.map((placement) => placement.y)).toEqual([...vertical.placements].reverse().map((placement) => expect.closeTo(placement.y, 2)));
    expect(longEdge.map((placement) => placement.x)).toEqual(vertical.placements.map((placement) => placement.x));
    expect(shortEdge.map((placement) => placement.x)).toEqual([...horizontal.placements].reverse().map((placement) => expect.closeTo(placement.x, 2)));
    expect(shortEdge.map((placement) => placement.y)).toEqual(horizontal.placements.map((placement) => placement.y));
  });

  it('2x2 编号版位按纸张物理翻转轴映射坐标', () => {
    const layout = {
      sheet: { width: 200, height: 100 },
      placements: [
        { x: 10, y: 60, width: 40, height: 30 },
        { x: 150, y: 60, width: 40, height: 30 },
        { x: 10, y: 10, width: 40, height: 30 },
        { x: 150, y: 10, width: 40, height: 30 },
      ],
    };

    expect(impositionPlacementsForSide(layout, 1, { orientation: 'portrait', duplex: 'double', flip: 'long-edge' }).map(({ x, y }) => [x, y]))
      .toEqual([[150, 60], [10, 60], [150, 10], [10, 10]]);
    expect(impositionPlacementsForSide(layout, 1, { orientation: 'landscape', duplex: 'double', flip: 'long-edge' }).map(({ x, y }) => [x, y]))
      .toEqual([[10, 10], [150, 10], [10, 60], [150, 60]]);
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

  it('预检按页面旋转后的视觉尺寸判断方向', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage([300, 400]);
    page.setRotation(degrees(90));

    const result = await preflightPdf(await source.save());

    expect(result.pages[0]).toEqual({ number: 1, width: 400, height: 300, orientation: 'landscape' });
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

  it('N-up 双面长边与短边翻转生成不同的背面变换，单面时翻转方式不生效', async () => {
    const source = await PDFDocument.create();
    for (let index = 0; index < 8; index += 1) {
      const page = source.addPage([300, 400]);
      page.drawRectangle({ x: index * 5, y: 10, width: 30, height: 20, color: rgb(index / 8, 0.2, 0.6) });
    }
    const input = await source.save();
    const base = { mode: 'nup' as const, paper: 'A4' as const, orientation: 'landscape' as const, columns: 2, rows: 2, margin: 18, gap: 8 };

    const doubleLong = await imposePdf(input, { ...base, duplex: 'double', flip: 'long-edge' });
    const doubleShort = await imposePdf(input, { ...base, duplex: 'double', flip: 'short-edge' });
    const singleLong = await imposePdf(input, { ...base, duplex: 'single', flip: 'long-edge' });
    const singleShort = await imposePdf(input, { ...base, duplex: 'single', flip: 'short-edge' });

    const [doubleLongSemantics, doubleShortSemantics, singleLongSemantics, singleShortSemantics] = await Promise.all([
      outputPdfSemantics(doubleLong), outputPdfSemantics(doubleShort), outputPdfSemantics(singleLong), outputPdfSemantics(singleShort),
    ]);

    expect(doubleLongSemantics).not.toEqual(doubleShortSemantics);
    expect(singleLongSemantics).toEqual(singleShortSemantics);
    expect(doubleLongSemantics).toHaveLength(2);
    expect(doubleShortSemantics).toHaveLength(2);
  });

  it('拼版保留 90、180、270 度来源页并生成可重载输出', async () => {
    const source = await PDFDocument.create();
    [90, 180, 270].forEach((angle, index) => {
      const page = source.addPage([300, 400]);
      page.setRotation(degrees(angle));
      page.drawText(`corner-${angle}`, { x: 12 + index, y: 365, size: 18 });
    });

    const output = await imposePdf(await source.save(), {
      mode: 'nup', paper: 'A4', orientation: 'landscape', columns: 3, rows: 1,
      margin: 18, gap: 8, duplex: 'single', flip: 'long-edge',
    });

    const loaded = await PDFDocument.load(output);
    expect(loaded.getPageCount()).toBe(1);
    expect(loaded.getPage(0).getSize()).toEqual({ width: 841.89, height: 595.28 });
  });

  it('来源页旋转补偿为 90、180、270 度生成正确绘制原点和尺寸', () => {
    const placement = { x: 10, y: 20, width: 200, height: 200 };
    expect(embeddedPagePlacement(300, 400, 90, placement)).toEqual({ x: 210, y: 45, width: 150, height: 200, rotation: 90 });
    expect(embeddedPagePlacement(300, 400, 180, placement)).toEqual({ x: 185, y: 220, width: 150, height: 200, rotation: 180 });
    expect(embeddedPagePlacement(300, 400, 270, placement)).toEqual({ x: 10, y: 195, width: 150, height: 200, rotation: 270 });
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

  it('按命名空间移除脚本和任意前缀危险 href', () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:s="http://www.w3.org/2000/svg" xmlns:link="http://www.w3.org/1999/xlink"><s:script>alert(1)</s:script><use link:href="javascript:alert(1)"/><use link:href="#safe"/></svg>';
    const result = optimiseSvg(source);
    expect(result.svg).not.toMatch(/script|javascript/i);
    expect(result.svg).toContain('#safe');
  });

  it('净化 style 元素与属性中的外链，同时保留本地 url 引用', () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg"><defs><filter id="soft"/></defs><style>.bad{@import url(https://evil.example/a.css)}.ok{filter:url(#soft)}</style><rect style="fill:url(&#x6a;avascript:alert(1));filter:url(#soft)" filter="url(#soft)"/></svg>';
    const result = optimiseSvg(source);
    expect(result.svg).not.toMatch(/@import|evil\.example|javascript/i);
    expect(result.svg).toContain('url(#soft)');
  });

  it('接受带空格的合法 xmlns，不重复命名空间并保留 viewBox 与本地引用', () => {
    const source = '<svg xmlns = "http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><path id="p" d="M0 0h1v1z"/></defs><use href="#p"/></svg>';
    const result = optimiseSvg(source);
    expect(result.svg.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g)).toHaveLength(1);
    expect(result.svg).toContain('viewBox="0 0 10 10"');
    expect(result.svg).toContain('href="#p"');
    const reparsed = new DOMParser().parseFromString(result.svg, 'image/svg+xml');
    expect(reparsed.querySelector('parsererror')).toBeNull();
  });

  it('拒绝畸形 XML，而不是下载无法解析的 SVG', () => {
    expect(() => optimiseSvg('<svg xmlns="http://www.w3.org/2000/svg"><g></svg>')).toThrow('不是有效的 SVG 文件');
  });

  it('规范化 CSS escape 后移除外链，并保留可可靠解析的本地引用', () => {
    const dangerous = optimiseSvg('<svg xmlns="http://www.w3.org/2000/svg"><style>.x{fill:\\75\\72\\6c(\\68\\74\\74\\70\\73\\3a\\2f\\2fevil.example/a)}</style><rect style="fill:u\\72l(\\2f\\2fevil.example/b)"/></svg>');
    expect(dangerous.svg).not.toMatch(/evil\.example|\\75|\\72|\\6c/i);
    expect(dangerous.removedUnsafe).toBe(true);

    const safe = optimiseSvg('<svg xmlns="http://www.w3.org/2000/svg"><defs><filter id="soft"/></defs><rect style="filter:u\\72l(\\23soft)"/></svg>');
    expect(safe.svg).toContain('style="filter:u\\72l(\\23soft)"');
    expect(safe.removedUnsafe).toBe(false);
  });

  it('无法可靠规范化的反斜杠 CSS 会被保守移除', () => {
    const result = optimiseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect style="fill:red\\"/></svg>');
    expect(result.svg).not.toContain('style=');
    expect(result.removedUnsafe).toBe(true);
  });

  it('移除外部 xml:base 与全部 SMIL 动画元素，并保持二次解析有效', () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg" xml:base="https://evil.example/"><rect id="safe" width="10" height="10"><set attributeName="href" to="javascript:alert(1)"/><animate attributeName="fill" values="red;url(https://evil.example/a)"/><animateTransform attributeName="transform" type="scale" values="1;2"/></rect></svg>';
    const result = optimiseSvg(source);
    expect(result.svg).not.toMatch(/xml:base|<set|<animate|animateTransform|evil\.example|javascript/i);
    expect(result.svg).toContain('id="safe"');
    expect(result.removedUnsafe).toBe(true);
    const reparsed = new DOMParser().parseFromString(result.svg, 'image/svg+xml');
    expect(reparsed.querySelector('parsererror')).toBeNull();
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

  it('彩色追踪的实际填充色不超过 maxColors', () => {
    const colors = [
      [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0],
      [255, 0, 255], [0, 255, 255], [128, 64, 32], [240, 240, 240],
    ];
    const colorful = {
      width: colors.length,
      height: 1,
      data: new Uint8ClampedArray(colors.flatMap(([red, green, blue]) => [red, green, blue, 255])),
    };

    const result = traceImage(colorful, { threshold: 128, smoothing: 0, mode: 'color', maxColors: 2 });
    const fills = new Set(Array.from(result.matchAll(/fill="(#[0-9a-f]{6})"/gi), (match) => match[1]));
    expect(fills.size).toBeLessThanOrEqual(2);
  });

  it('平滑度会改变 SVG 路径几何，而不只是渲染属性', () => {
    const crisp = traceImage(raster, { threshold: 128, smoothing: 0, mode: 'monochrome', maxColors: 4 });
    const smooth = traceImage(raster, { threshold: 128, smoothing: 100, mode: 'monochrome', maxColors: 4 });
    const crispPath = crisp.match(/ d="([^"]+)"/)?.[1];
    const smoothPath = smooth.match(/ d="([^"]+)"/)?.[1];
    expect(smoothPath).not.toBe(crispPath);
  });

  it('本地颜色背景移除产生透明像素并报告进度', () => {
    const progress = vi.fn();
    const result = removeBackground(raster, { threshold: 20, feather: 0 }, progress);
    expect(result.data[3]).toBe(0);
    expect(result.data[7]).toBe(255);
    expect(result.data[11]).toBe(0);
    expect(progress).toHaveBeenCalledWith(100);
  });

  it('背景移除只清理与边界连通的相似颜色，保留主体内部隔离白点', () => {
    const pixels: number[] = [];
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const edge = x === 0 || y === 0 || x === 4 || y === 4;
        const center = x === 2 && y === 2;
        const value = edge || center ? 255 : 0;
        pixels.push(value, value, value, 255);
      }
    }
    const result = removeBackground({ width: 5, height: 5, data: new Uint8ClampedArray(pixels) }, { threshold: 20, feather: 0 });
    expect(result.data[(0 * 5 + 0) * 4 + 3]).toBe(0);
    expect(result.data[(2 * 5 + 2) * 4 + 3]).toBe(255);
    expect(result.data[(2 * 5 + 1) * 4 + 3]).toBe(255);
  });

  it('已经取消的本地处理返回中文取消错误', () => {
    const controller = new AbortController();
    controller.abort();
    expect(() => removeBackground(raster, { threshold: 20, feather: 0 }, undefined, controller.signal)).toThrow('处理已取消');
    expect(() => traceImage(raster, { threshold: 128, smoothing: 0, mode: 'monochrome', maxColors: 4 }, controller.signal)).toThrow('处理已取消');
  });
});
