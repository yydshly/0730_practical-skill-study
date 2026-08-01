import { describe, expect, it } from 'vitest';

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
});
