/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';

type StoredZipEntry = { name: string; content: string; compression: number };

async function readStoredZip(blob: Blob): Promise<{ entries: StoredZipEntry[]; bytes: Uint8Array }> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const decoder = new TextDecoder();
  const entries: StoredZipEntry[] = [];
  let offset = 0;
  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const compression = view.getUint16(offset + 8, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const contentStart = nameStart + nameLength + extraLength;
    entries.push({
      name: decoder.decode(bytes.slice(nameStart, nameStart + nameLength)),
      content: decoder.decode(bytes.slice(contentStart, contentStart + size)),
      compression,
    });
    offset = contentStart + size;
  }
  return { entries, bytes };
}

describe('文字与排版引擎', () => {
  it('统计中文、英文和段落', async () => {
    const { countText } = await import('../src/engines/text');
    expect(countText('你好 world\n\n第二段')).toMatchObject({ words: 3, paragraphs: 2 });
  });

  it('为空文本和仅空白文本返回稳定的字数统计', async () => {
    const { countText } = await import('../src/engines/text');
    expect(countText('')).toEqual({
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      lines: 0,
      paragraphs: 0,
      readingMinutes: 0,
    });
    expect(countText(' \n\t')).toMatchObject({ characters: 3, charactersNoSpaces: 0, words: 0, lines: 2, paragraphs: 0 });
  });

  it('没有空格的连续中文使用确定的分段回退', async () => {
    const { countText } = await import('../src/engines/text');
    expect(countText('中文排版测试')).toMatchObject({ words: 1, paragraphs: 1 });
  });

  it('16px 在 16px 根字号下等于 1rem', async () => {
    const { pxToRem } = await import('../src/engines/text');
    expect(pxToRem(16, 16)).toBe(1);
  });

  it('PX 与 REM 双向换算并拒绝无效根字号', async () => {
    const { pxToRem, remToPx } = await import('../src/engines/text');
    expect(remToPx(1.5, 20)).toBe(30);
    expect(() => pxToRem(16, 0)).toThrow('根字号必须是大于 0 的数字');
    expect(() => remToPx(1, Number.NaN)).toThrow('根字号必须是大于 0 的数字');
  });

  it('按 96 DPI 在 pt、pc、in、mm、cm 间换算排版单位', async () => {
    const { convertTypographyUnit } = await import('../src/engines/text');
    expect(convertTypographyUnit(72, 'pt', 'in')).toBeCloseTo(1, 8);
    expect(convertTypographyUnit(6, 'pc', 'in')).toBeCloseTo(1, 8);
    expect(convertTypographyUnit(25.4, 'mm', 'in')).toBeCloseTo(1, 8);
    expect(convertTypographyUnit(2.54, 'cm', 'px')).toBeCloseTo(96, 8);
    expect(convertTypographyUnit(96, 'px', 'pt')).toBeCloseTo(72, 8);
  });

  it('用字号和比例计算行高', async () => {
    const { calculateLineHeight } = await import('../src/engines/text');
    expect(calculateLineHeight(16, 1.5)).toEqual({ pixels: 24, unitless: 1.5 });
    expect(() => calculateLineHeight(-1, 1.5)).toThrow('字号必须是大于 0 的数字');
  });

  it('逐字符标出插入和删除文本', async () => {
    const { diffText } = await import('../src/engines/text');
    expect(diffText('cat', 'cart')).toEqual([
      { type: 'equal', text: 'ca' },
      { type: 'add', text: 'r' },
      { type: 'equal', text: 't' },
    ]);
    expect(diffText('cart', 'cat')).toEqual([
      { type: 'equal', text: 'ca' },
      { type: 'delete', text: 'r' },
      { type: 'equal', text: 't' },
    ]);
  });
});

describe('安全文档转换', () => {
  it('DOCX 导出是包含必需 OOXML 部件的真实 ZIP 文件', async () => {
    const { createDocx } = await import('../src/engines/document');
    const blob = createDocx('# 文档标题\n\n正文');
    const { entries, bytes } = await readStoredZip(blob);
    const files = new Map(entries.map((entry) => [entry.name, entry.content]));

    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(Array.from(files.keys())).toEqual(['[Content_Types].xml', '_rels/.rels', 'word/document.xml']);
    expect(files.get('[Content_Types].xml')).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml');
    expect(files.get('_rels/.rels')).toContain('officeDocument');
    expect(files.get('word/document.xml')).toContain('<w:document');
    expect(files.get('word/document.xml')).toContain('文档标题');
    expect(new DataView(bytes.buffer).getUint32(bytes.length - 22, true)).toBe(0x06054b50);
  });

  it('EPUB 导出以未压缩 mimetype 开头并包含 EPUB 3 必需结构', async () => {
    const { createEpub } = await import('../src/engines/document');
    const blob = createEpub('# 电子书标题\n\n正文');
    const { entries, bytes } = await readStoredZip(blob);
    const files = new Map(entries.map((entry) => [entry.name, entry.content]));

    expect(blob.type).toBe('application/epub+zip');
    expect(entries[0]).toEqual({ name: 'mimetype', content: 'application/epub+zip', compression: 0 });
    expect(Array.from(files.keys())).toEqual(['mimetype', 'META-INF/container.xml', 'OEBPS/content.opf', 'OEBPS/nav.xhtml', 'OEBPS/content.xhtml']);
    expect(files.get('META-INF/container.xml')).toContain('OEBPS/content.opf');
    expect(files.get('OEBPS/content.opf')).toContain('version="3.0"');
    expect(files.get('OEBPS/content.opf')).toContain('application/xhtml+xml');
    expect(files.get('OEBPS/content.xhtml')).toContain('电子书标题');
    expect(new DataView(bytes.buffer).getUint32(bytes.length - 22, true)).toBe(0x06054b50);
  });

  it('解析式消毒不会把嵌套标签重组为脚本，并移除事件与危险 URL', async () => {
    const { sanitizeHtml } = await import('../src/engines/document');
    const hostile = '<p onclick="alert(1)">正文</p><scr<script>ipt>alert(2)</scr<script>ipt><a href="jav&#x61;script:alert(3)" onfocus="alert(4)">链接</a>';

    const sanitized = sanitizeHtml(hostile);
    const reparsed = new DOMParser().parseFromString(sanitized, 'text/html');

    expect(reparsed.querySelector('script')).toBeNull();
    expect(reparsed.querySelector('[onclick], [onfocus]')).toBeNull();
    expect(reparsed.querySelector('a')?.getAttribute('href')).toBe('#');
    expect(sanitized.toLocaleLowerCase()).not.toContain('javascript:');
  });

  it('越界和代理区数字实体返回安全替代字符而不抛错', async () => {
    const { htmlToMarkdown } = await import('../src/engines/document');

    expect(() => htmlToMarkdown('<p>&#x110000; / &#55296; / 正文</p>')).not.toThrow();
    expect(htmlToMarkdown('<p>&#x110000; / &#55296; / 正文</p>')).toBe('� / � / 正文');
  });

  it('Markdown 转 HTML 时转义原始标签并阻止危险链接协议', async () => {
    const { markdownToHtml } = await import('../src/engines/document');
    const html = markdownToHtml('# <script>alert(1)</script>\n\n[链接](javascript:alert(1))');
    expect(html).toContain('<h1>&lt;script&gt;alert(1)&lt;/script&gt;</h1>');
    expect(html).toContain('<a href="#">链接</a>');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('href="javascript:');
  });

  it('HTML 转 Markdown 保留安全链接并移除脚本内容', async () => {
    const { htmlToMarkdown } = await import('../src/engines/document');
    expect(htmlToMarkdown('<p>打开 <a href="https://example.com">网站</a></p>')).toBe('打开 [网站](https://example.com)');
    expect(htmlToMarkdown('<p>正文</p><script>alert(1)</script>')).toBe('正文');
  });

  it('Markdown 可以导出真实纯文本和 LaTeX 内容', async () => {
    const { markdownToLatex, markdownToPlainText } = await import('../src/engines/document');
    expect(markdownToPlainText('# 标题\n\n**粗体**与[链接](https://example.com)')).toBe('标题\n\n粗体与链接');
    const latex = markdownToLatex('# 价格与比例\n\n50% & more');
    expect(latex).toContain('\\section{价格与比例}');
    expect(latex).toContain('50\\% \\& more');
    expect(latex).toMatch(/^\\documentclass\{article\}/u);
    expect(latex).toMatch(/\\end\{document\}\s*$/u);
  });
});

describe('纸张、Unicode 与字体数据', () => {
  it('返回 A4 和 Letter 的手工核对尺寸', async () => {
    const { convertPaperDimensions, findPaperSize } = await import('../src/data/paperSizes');
    expect(findPaperSize('a4')).toMatchObject({ widthMm: 210, heightMm: 297 });
    expect(convertPaperDimensions('letter', 'in')).toEqual({ width: 8.5, height: 11, unit: 'in' });
  });

  it('纸张库覆盖完整系列，支持可搜索别名与受限 DPI 像素换算', async () => {
    const { PAPER_SIZES, findPaperSize, paperPixelDimensions, searchPaperSizes } = await import('../src/data/paperSizes');
    expect(PAPER_SIZES.length).toBeGreaterThanOrEqual(75);
    expect(new Set(PAPER_SIZES.map((item) => item.id)).size).toBe(PAPER_SIZES.length);
    expect(PAPER_SIZES.every((item) => item.widthMm > 0 && item.heightMm > 0 && item.aliases.length > 0)).toBe(true);
    expect(findPaperSize('c5')).toMatchObject({ widthMm: 162, heightMm: 229 });
    expect(findPaperSize('sra3')).toMatchObject({ widthMm: 320, heightMm: 450 });
    expect(paperPixelDimensions('a4', 300)).toEqual({ width: 2480, height: 3508, dpi: 300 });
    expect(searchPaperSizes(' 名片 ').some((item) => item.id === 'business-card-cn')).toBe(true);
    expect(searchPaperSizes('c5', 'ISO 信封')).toEqual([expect.objectContaining({ id: 'c5' })]);
    expect(searchPaperSizes('ANSI B')).toEqual([expect.objectContaining({ id: 'tabloid' })]);
    expect(() => paperPixelDimensions('a4', 35)).toThrow('DPI 必须在 36 到 2400 之间');
    expect(() => paperPixelDimensions('a4', 2401)).toThrow('DPI 必须在 36 到 2400 之间');
  });

  it('纸张尺寸在 DPI 边界、检索入口与物理规格去重上保持准确', async () => {
    const { PAPER_SIZES, convertPaperDimensions, findPaperSize, paperPixelDimensions, searchPaperSizes } = await import('../src/data/paperSizes');
    const demy = findPaperSize('demy');
    expect(demy).toMatchObject({ widthMm: 444.5, heightMm: 571.5 });
    expect(() => paperPixelDimensions('a4', 36)).not.toThrow();
    expect(() => paperPixelDimensions('a4', 2400)).not.toThrow();
    for (const dpi of [Number.NaN, Number.POSITIVE_INFINITY, 35, 2401]) expect(() => paperPixelDimensions('a4', dpi)).toThrow('DPI 必须在 36 到 2400 之间');

    const pixels = paperPixelDimensions('a4', 300);
    expect(convertPaperDimensions('a4', 'px', 300)).toMatchObject({ width: pixels.width, height: pixels.height });
    expect(searchPaperSizes('sra3')).toEqual([expect.objectContaining({ id: 'sra3' })]);
    expect(searchPaperSizes('Executive')).toEqual([expect.objectContaining({ id: 'executive' })]);
    expect(searchPaperSizes('SIS 瑞典').map((item) => item.id)).toEqual(['sis-e5', 'sis-g5']);
    expect(searchPaperSizes('US Letter')).toEqual([expect.objectContaining({ id: 'letter' })]);

    const physicalDimensions = PAPER_SIZES.map((item) => [item.widthMm, item.heightMm].sort((left, right) => left - right).join('×'));
    expect(new Set(physicalDimensions).size).toBe(PAPER_SIZES.length);
  });

  it('按 Unicode 码点搜索并限制返回数量', async () => {
    const { formatCodePoint, searchUnicode } = await import('../src/data/unicodeBlocks');
    expect(searchUnicode('U+4E2D', undefined, 20)).toEqual([{ character: '中', codePoint: 0x4e2d, label: 'U+4E2D' }]);
    expect(formatCodePoint(0x1f600)).toBe('U+1F600');
    expect(searchUnicode('', 'basic-latin', 12)).toHaveLength(12);
    expect(searchUnicode('', 'cjk', 999)).toHaveLength(200);
  });

  it('字体解析器以中文错误拒绝损坏文件', async () => {
    const { inspectFont } = await import('../src/engines/document');
    expect(() => inspectFont(new Uint8Array([1, 2, 3]).buffer)).toThrow('字体文件无效或已损坏');
  });

  it('字体名称记录不能越过 name 表边界读取其他表数据', async () => {
    const { inspectFont } = await import('../src/engines/document');
    const buffer = new ArrayBuffer(140);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    view.setUint32(0, 0x00010000);
    view.setUint16(4, 3);
    const writeTable = (record: number, name: string, offset: number, length: number) => {
      bytes.set(new TextEncoder().encode(name), record);
      view.setUint32(record + 8, offset);
      view.setUint32(record + 12, length);
    };
    writeTable(12, 'head', 64, 20);
    writeTable(28, 'maxp', 84, 6);
    writeTable(44, 'name', 90, 18);
    view.setUint16(64 + 18, 1_000);
    view.setUint16(84 + 4, 3);
    view.setUint16(90 + 2, 1);
    view.setUint16(90 + 4, 18);
    view.setUint16(96, 3);
    view.setUint16(96 + 6, 1);
    view.setUint16(96 + 8, 4);
    view.setUint16(96 + 10, 20);
    bytes.set(new TextEncoder().encode('FAKE'), 128);

    expect(() => inspectFont(buffer)).toThrow('字体文件无效或已损坏');
  });
});
