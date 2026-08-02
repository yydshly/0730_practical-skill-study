import { describe, expect, it } from 'vitest';

import {
  applyBitwise16,
  atbash,
  cleanupWhitespace,
  convertCommonBases,
  convertBase,
  decodeBase64,
  decodeCaesar,
  decodeHex,
  decodeMorse,
  decodeUrl,
  decodeVigenere,
  deduplicateLines,
  encodeBase64,
  encodeCaesar,
  encodeUrl,
  extractTextItems,
  findAndReplaceText,
  generateBarcodeSvg,
  generateMetaTags,
  generateQrSvg,
  hashText,
  numberLines,
  rankCaesarDecodings,
  rankDecodingCandidates,
  removeEmptyLines,
  reverseLines,
  rot13,
  slugify,
  sortLines,
  testRegex,
  transformCase,
  transliterateShavian,
  trimLines,
  toggleBit16,
} from '../src/engines/developer';
import { REGEX_PRESETS } from '../src/data/regexPresets';

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

  it('四个本地预设都提供可被正则引擎匹配的样例', () => {
    expect(REGEX_PRESETS.map((preset) => preset.id)).toEqual(['email', 'url', 'phone-cn', 'iso-date']);
    for (const preset of REGEX_PRESETS) {
      const result = testRegex(preset.pattern, preset.flags, preset.sample);
      expect(result.error).toBeNull();
      expect(result.matches.length).toBeGreaterThan(0);
    }
  });

  it('中国大陆手机号预设只匹配独立号码及支持的 +86 格式', () => {
    const preset = REGEX_PRESETS.find((item) => item.id === 'phone-cn')!;

    expect(testRegex(preset.pattern, preset.flags, '13800138000 +86 13800138000 +86-13800138000 +8613800138000').matches.map((match) => match.text))
      .toEqual(['13800138000', '+86 13800138000', '+86-13800138000', '+8613800138000']);
    expect(testRegex(preset.pattern, preset.flags, '213800138000').matches).toEqual([]);
    expect(testRegex(preset.pattern, preset.flags, '138001380001').matches).toEqual([]);
  });

  it('ISO 日期预设检查月份和日期的基本范围，但不验证日历有效性', () => {
    const preset = REGEX_PRESETS.find((item) => item.id === 'iso-date')!;

    expect(testRegex(preset.pattern, preset.flags, '2026-01-01 2026-12-31 2026-02-29').matches.map((match) => match.text))
      .toEqual(['2026-01-01', '2026-12-31', '2026-02-29']);
    expect(testRegex(preset.pattern, preset.flags, '2026-99-99').matches).toEqual([]);
    expect(testRegex(preset.pattern, preset.flags, '2026-02-39').matches).toEqual([]);
  });
});

describe('常用进制同步与 16 位位运算', () => {
  it('以逐字符 BigInt 解析同步四种进制，并保留普通转换的负数和大整数能力', () => {
    expect(convertCommonBases('ff', 16)).toEqual({
      binary: '11111111', octal: '377', decimal: '255', hexadecimal: 'ff',
    });
    expect(convertCommonBases('-100000000000000000000000000000000000000000000000000000000000000000', 2).decimal)
      .toBe('-36893488147419103232');
  });

  it('16 位切换和运算统一使用无符号范围并在每一步截断', () => {
    expect(toggleBit16('0', 15)).toBe('32768');
    expect(toggleBit16('32768', 15)).toBe('0');
    expect(applyBitwise16('65535', '3855', 'and')).toBe('3855');
    expect(applyBitwise16('32768', '1', 'shift-left')).toBe('0');
    expect(applyBitwise16('0', '1', 'not')).toBe('65535');
  });

  it('为 16 位区域拒绝负数、超范围输入和无效 bit 序号', () => {
    expect(() => toggleBit16('-1', 0)).toThrow('16 位数值必须在 0 到 65535 之间');
    expect(() => toggleBit16('65536', 0)).toThrow('16 位数值必须在 0 到 65535 之间');
    expect(() => toggleBit16('1', 16)).toThrow('bit 序号必须在 0 到 15 之间');
    expect(() => applyBitwise16('1', '-1', 'and')).toThrow('16 位数值必须在 0 到 65535 之间');
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
      siteName: 'A&B 社区',
      twitterHandle: '@@news&\'<',
      twitterCard: 'summary_large_image',
    });

    expect(html).toContain('<title>A&amp;B &lt;站点&gt;</title>');
    expect(html).toContain('content="欢迎 &quot;访客&quot; &lt;script&gt;"');
    expect(html).toContain('content="O&#39;Reilly"');
    expect(html).toContain('href="https://example.com/?a=1&amp;b=2"');
    expect(html).toContain('content="https://example.com/a&quot;b.png"');
    expect(html).toContain('property="og:site_name" content="A&amp;B 社区"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('name="twitter:title" content="A&amp;B &lt;站点&gt;"');
    expect(html).toContain('name="twitter:description" content="欢迎 &quot;访客&quot; &lt;script&gt;"');
    expect(html).toContain('name="twitter:image" content="https://example.com/a&quot;b.png"');
    expect(html).toContain('name="twitter:site" content="@news&amp;&#39;&lt;"');
    expect(html).not.toContain('<script>');
  });

  it('仅为已填写的 Twitter 内容生成对应标签', () => {
    const html = generateMetaTags({ twitterCard: 'summary', twitterHandle: '@@local' });

    expect(html).toContain('name="twitter:card" content="summary"');
    expect(html).toContain('name="twitter:site" content="@local"');
    expect(html).not.toContain('twitter:title');
    expect(html).not.toContain('twitter:description');
    expect(html).not.toContain('twitter:image');
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

describe('本地密码解码与安全自动候选', () => {
  it('按字母密钥解开 Vigenere 并保留大小写、标点和非拉丁字符', () => {
    expect(decodeVigenere('LXFOPVEFRNHR', 'LEMON')).toBe('ATTACKATDAWN');
    expect(decodeVigenere('Lxfop, vefrn! 世界', 'lemon')).toBe('Attac, katda! 世界');
  });

  it('解开以空格分隔符号、斜杠分隔单词的 Morse 与 UTF-8 十六进制', () => {
    expect(decodeMorse('... --- ... / .---- ..---')).toBe('SOS 12');
    expect(decodeMorse('.-.-.- --..-- ..--..')).toBe('.,?');
    expect(decodeHex('E4 BD A0:E5-A5 BD')).toBe('你好');
  });

  it('拒绝空密钥、未知 Morse、奇数或非 UTF-8 十六进制输入', () => {
    expect(() => decodeVigenere('ABC', '')).toThrow('Vigenere 密钥不能为空');
    expect(() => decodeVigenere('ABC', '密钥')).toThrow('Vigenere 密钥只能包含英文字母');
    expect(() => decodeMorse('... --- ..---.-')).toThrow('Morse 代码无效');
    expect(() => decodeHex('ABC')).toThrow('十六进制内容必须由偶数个字符组成');
    expect(() => decodeHex('FF')).toThrow('十六进制内容不是有效的 UTF-8 文本');
  });

  it('只为符合形态的输入合并去重、按分数排序自动候选，不猜测 Vigenere', () => {
    const candidates = rankDecodingCandidates('SGVsbG8gd29ybGQ=', 6);
    expect(candidates.some((item) => item.method === 'base64' && item.text === 'Hello world')).toBe(true);
    expect(candidates).toHaveLength(6);
    expect(new Set(candidates.map((item) => item.text)).size).toBe(candidates.length);
    expect(candidates.every((item, index) => index === 0 || candidates[index - 1].score >= item.score)).toBe(true);
    expect(rankDecodingCandidates('plain text').some((item) => ['morse', 'hex', 'base64'].includes(item.method))).toBe(false);
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

describe('文本处理工作台的确定性操作', () => {
  it('字面量查找会转义正则字符，并把替换文本原样写入', () => {
    expect(findAndReplaceText('a.b a.b', 'a.b', '$&-$1', {
      useRegex: false,
      caseSensitive: true,
      replaceAll: true,
    })).toEqual({ text: '$&-$1 $&-$1', replacements: 2 });
  });

  it('支持不区分大小写的全部替换，并清晰报告无效或过长正则', () => {
    expect(findAndReplaceText('Alpha alpha ALPHA', 'alpha', 'β', {
      useRegex: false,
      caseSensitive: false,
      replaceAll: true,
    })).toEqual({ text: 'β β β', replacements: 3 });
    expect(() => findAndReplaceText('text', '(', '', {
      useRegex: true,
      caseSensitive: true,
      replaceAll: false,
    })).toThrow('正则表达式无效');
    expect(() => findAndReplaceText('text', 'a'.repeat(1001), '', {
      useRegex: true,
      caseSensitive: true,
      replaceAll: false,
    })).toThrow('正则表达式不能超过 1000 个字符');
  });

  it('提取内容去重并保持首次出现顺序，同时限定协议和电话号码位数', () => {
    expect(extractTextItems('a@x.com https://a.test a@x.com ftp://skip.test http://b.test', 'emails'))
      .toEqual(['a@x.com']);
    expect(extractTextItems('a@x.com https://a.test a@x.com ftp://skip.test http://b.test', 'urls'))
      .toEqual(['https://a.test', 'http://b.test']);
    expect(extractTextItems('联系 +86 138-0013-8000、138 0013 8000、123456、9999999999999999', 'phone-numbers'))
      .toEqual(['+86 138-0013-8000', '138 0013 8000']);
    expect(extractTextItems('第 12 项、12、003', 'numbers')).toEqual(['12', '003']);
    expect(extractTextItems(Array.from({ length: 10_001 }, (_, index) => String(index)).join(' '), 'numbers')).toHaveLength(10_000);
  });

  it('补齐大小写切换、逆序行、删除空行和行号动作', () => {
    expect(transformCase('AbC 你好', 'toggle')).toBe('aBc 你好');
    expect(reverseLines('first\nsecond\nthird')).toBe('third\nsecond\nfirst');
    expect(removeEmptyLines('a\n\n  \n b \n')).toBe('a\n b ');
    expect(numberLines('a\nb\n')).toBe('1. a\n2. b\n3. ');
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

  it('中心 Logo 完全位于二维码 viewBox 内并精确居中', async () => {
    const svg = await generateQrSvg({
      text: 'https://example.com/centered-logo',
      errorCorrectionLevel: 'H',
      logoDataUrl: 'data:image/png;base64,iVBORw0KGgo=',
    });
    const viewBox = svg.match(/\bviewBox="([^"]+)"/u)?.[1].split(/\s+/u).map(Number);
    const imageTag = svg.match(/<image\b[^>]*>/u)?.[0] ?? '';
    const attribute = (name: string) => Number(imageTag.match(new RegExp(`\\b${name}="([^"]+)"`, 'u'))?.[1]);

    expect(viewBox).toHaveLength(4);
    const [minX, minY, viewWidth, viewHeight] = viewBox!;
    const x = attribute('x');
    const y = attribute('y');
    const width = attribute('width');
    const height = attribute('height');

    expect([x, y, width, height].every(Number.isFinite)).toBe(true);
    expect(x).toBeGreaterThanOrEqual(minX);
    expect(y).toBeGreaterThanOrEqual(minY);
    expect(x + width).toBeLessThanOrEqual(minX + viewWidth);
    expect(y + height).toBeLessThanOrEqual(minY + viewHeight);
    expect(x + width / 2).toBeCloseTo(minX + viewWidth / 2, 6);
    expect(y + height / 2).toBeCloseTo(minY + viewHeight / 2, 6);
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
