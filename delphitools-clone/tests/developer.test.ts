import { describe, expect, it } from 'vitest';

import {
  atbash,
  cleanupWhitespace,
  convertBase,
  decodeBase64,
  decodeCaesar,
  decodeUrl,
  deduplicateLines,
  encodeBase64,
  encodeCaesar,
  encodeUrl,
  generateBarcodeSvg,
  generateMetaTags,
  generateQrSvg,
  hashText,
  rankCaesarDecodings,
  rot13,
  slugify,
  sortLines,
  testRegex,
  transformCase,
  transliterateShavian,
  trimLines,
} from '../src/engines/developer';

describe('任意精度进制转换', () => {
  it('十六进制 ff 转十进制为 255', () => {
    expect(convertBase('ff', 16, 10)).toBe('255');
  });

  it('凯撒密码向左移动三位', () => {
    expect(decodeCaesar('KHOOR', 3)).toBe('HELLO');
  });

  it('保留负号并转换超出安全整数范围的值', () => {
    expect(convertBase('-101', 2, 10)).toBe('-5');
    expect(convertBase('ffffffffffffffffffffffff', 16, 10)).toBe('79228162514264337593543950335');
  });

  it('中文拒绝越界进制和不属于该进制的数字', () => {
    expect(() => convertBase('10', 1, 10)).toThrow('进制必须是 2 到 36 之间的整数');
    expect(() => convertBase('2', 2, 10)).toThrow('数字 2 不属于 2 进制');
  });
});

describe('Unicode 安全编码与 Web Crypto 哈希', () => {
  it('Base64 使用 UTF-8 并完整往返 Unicode', () => {
    expect(encodeBase64('你好，🌍')).toBe('5L2g5aW977yM8J+MjQ==');
    expect(decodeBase64('5L2g5aW977yM8J+MjQ==')).toBe('你好，🌍');
  });

  it('URL 编码完整往返 Unicode 和保留字符', () => {
    const source = '你好 /?a=1&b=空 格';
    expect(decodeUrl(encodeUrl(source))).toBe(source);
  });

  it('SHA-256 使用 Web Crypto 并返回已知向量', async () => {
    await expect(hashText('abc', 'SHA-256')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('中文拒绝损坏 Base64、URL 转义和不支持的哈希算法', async () => {
    expect(() => decodeBase64('%%%')).toThrow('Base64 内容无效');
    expect(() => decodeUrl('%E0%A4%A')).toThrow('URL 编码内容无效');
    await expect(hashText('abc', 'MD5')).rejects.toThrow('仅支持 SHA-1、SHA-256、SHA-384 和 SHA-512');
  });
});

describe('正则表达式测试', () => {
  it('返回每个匹配的文本、索引、捕获组和命名组', () => {
    expect(testRegex('(?<word>[a-z]+)-(\\d+)', 'gi', 'one-1 TWO-22')).toEqual({
      matches: [
        { text: 'one-1', index: 0, groups: ['one', '1'], namedGroups: { word: 'one' } },
        { text: 'TWO-22', index: 6, groups: ['TWO', '22'], namedGroups: { word: 'TWO' } },
      ],
      error: null,
    });
  });

  it('无效表达式和重复标志返回中文错误而不抛出', () => {
    expect(testRegex('(', 'g', 'sample').error).toMatch(/^正则表达式无效：/u);
    expect(testRegex('a', 'gg', 'sample').error).toMatch(/^正则标志无效：/u);
  });
});

describe('Meta 标签安全生成', () => {
  it('转义文本和属性中的 HTML 特殊字符', () => {
    const html = generateMetaTags({
      title: 'A&B <站点>',
      description: '欢迎 "访客" <script>',
      keywords: '工具, 安全',
      author: "O'Reilly",
      canonicalUrl: 'https://example.com/?a=1&b=2',
      imageUrl: 'https://example.com/a"b.png',
    });

    expect(html).toContain('<title>A&amp;B &lt;站点&gt;</title>');
    expect(html).toContain('content="欢迎 &quot;访客&quot; &lt;script&gt;"');
    expect(html).toContain('content="O&#39;Reilly"');
    expect(html).toContain('href="https://example.com/?a=1&amp;b=2"');
    expect(html).toContain('content="https://example.com/a&quot;b.png"');
    expect(html).not.toContain('<script>');
  });
});

describe('古典密码与有界候选', () => {
  it('凯撒、Atbash 和 ROT13 都保留非字母字符', () => {
    expect(encodeCaesar('Hello, World!', 3)).toBe('Khoor, Zruog!');
    expect(atbash('Abc XYZ!')).toBe('Zyx CBA!');
    expect(rot13('Hello, World!')).toBe('Uryyb, Jbeyq!');
  });

  it('自动识别只返回有限候选并把常见英文解码排在前面', () => {
    const candidates = rankCaesarDecodings('KHOOR ZRUOG', 5);
    expect(candidates).toHaveLength(5);
    expect(candidates[0]).toMatchObject({ shift: 3, text: 'HELLO WORLD' });
  });
});

describe('Shavian 显式映射与文本处理', () => {
  it('按规则映射英文并原样保留标点和未知文字', () => {
    expect(transliterateShavian('Hello, 世界!')).toBe('𐑣𐑧𐑤𐑤𐑪, 世界!');
  });

  it('提供去行空格、去重、排序、大小写、slug 和空白清理', () => {
    expect(trimLines('  a  \n b ')).toBe('a\nb');
    expect(deduplicateLines('b\na\nb\nA')).toBe('b\na\nA');
    expect(sortLines('c\na\nb', 'asc')).toBe('a\nb\nc');
    expect(transformCase('hello WORLD', 'title')).toBe('Hello World');
    expect(slugify('Hello, 世界!')).toBe('hello-世界');
    expect(cleanupWhitespace('  a   b \n\n\n c  ')).toBe('a b\n\nc');
  });
});

describe('真实二维码和条形码 SVG', () => {
  it('二维码 SVG 包含内容颜色、纠错级别并可嵌入中心 Logo', async () => {
    const svg = await generateQrSvg({
      text: 'https://example.com/你好',
      dark: '#112233',
      light: '#ffffff',
      errorCorrectionLevel: 'H',
      logoDataUrl: 'data:image/png;base64,iVBORw0KGgo=',
    });

    expect(svg).toMatch(/^<svg/u);
    expect(svg).toContain('#112233');
    expect(svg).toContain('<image');
    expect(svg).toContain('data:image/png;base64,iVBORw0KGgo=');
  });

  it.each([
    ['code128', 'HELLO-123'],
    ['ean13', '5901234123457'],
    ['datamatrix', 'HELLO-123'],
    ['azteccode', 'HELLO-123'],
    ['pdf417', 'HELLO-123'],
  ] as const)('%s 生成可下载的真实 SVG', (format, value) => {
    const svg = generateBarcodeSvg(format, value);
    expect(svg).toMatch(/^<svg/u);
    expect(svg).toContain('</svg>');
  });

  it('按格式中文拒绝无效 EAN-13、Code 128 和未知格式', () => {
    expect(() => generateBarcodeSvg('ean13', '123')).toThrow('EAN-13 必须是 13 位数字');
    expect(() => generateBarcodeSvg('code128', '中文')).toThrow('Code 128 仅支持可打印 ASCII 字符');
    expect(() => generateBarcodeSvg('unknown' as 'code128', 'abc')).toThrow('不支持的条码格式');
  });
});
