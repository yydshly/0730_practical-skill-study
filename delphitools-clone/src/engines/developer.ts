import bwipjs from 'bwip-js/browser';
import * as QRCode from 'qrcode';

export type RegexMatch = {
  text: string;
  index: number;
  groups: string[];
  namedGroups: Record<string, string>;
};

export type RegexTestResult = {
  matches: RegexMatch[];
  error: string | null;
};

export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
export type TextCase = 'upper' | 'lower' | 'title' | 'sentence';
export type SortDirection = 'asc' | 'desc';
export type BarcodeFormat = 'code128' | 'ean13' | 'datamatrix' | 'azteccode' | 'pdf417';
export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type MetaTagInput = {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  canonicalUrl?: string;
  imageUrl?: string;
};

export type QrSvgInput = {
  text: string;
  dark?: string;
  light?: string;
  errorCorrectionLevel?: QrErrorCorrectionLevel;
  logoDataUrl?: string;
};

export function testRegex(pattern: string, flags: string, sample: string): RegexTestResult {
  let expression: RegExp;
  try {
    expression = new RegExp(pattern, flags);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const prefix = /flag/iu.test(detail) ? '正则标志无效' : '正则表达式无效';
    return { matches: [], error: `${prefix}：${detail}` };
  }

  const matches: RegexMatch[] = [];
  let match: RegExpExecArray | null;
  do {
    match = expression.exec(sample);
    if (!match) break;
    matches.push({
      text: match[0],
      index: match.index,
      groups: match.slice(1).map((value) => value ?? ''),
      namedGroups: Object.fromEntries(Object.entries(match.groups ?? {}).map(([key, value]) => [key, value ?? ''])),
    });
    if (!expression.global) break;
    if (match[0] === '') expression.lastIndex += 1;
  } while (matches.length < 10_000);

  return { matches, error: null };
}

function bytesToBinary(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return binary;
}

export function encodeBase64(text: string): string {
  return btoa(bytesToBinary(new TextEncoder().encode(text)));
}

export function decodeBase64(value: string): string {
  try {
    const binary = atob(value.trim());
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Base64 内容无效，请检查字符和补位符');
  }
}

export function encodeUrl(text: string): string {
  return encodeURIComponent(text);
}

export function decodeUrl(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new Error('URL 编码内容无效，请检查百分号转义');
  }
}

const HASH_ALGORITHMS = new Set<HashAlgorithm>(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']);

export async function hashText(text: string, algorithm: string): Promise<string> {
  const normalized = algorithm.toUpperCase() as HashAlgorithm;
  if (!HASH_ALGORITHMS.has(normalized)) {
    throw new Error('仅支持 SHA-1、SHA-256、SHA-384 和 SHA-512');
  }
  if (!globalThis.crypto?.subtle) throw new Error('当前浏览器不支持 Web Crypto 哈希');
  const digest = await globalThis.crypto.subtle.digest(normalized, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function validateBase(base: number): void {
  if (!Number.isInteger(base) || base < 2 || base > 36) throw new Error('进制必须是 2 到 36 之间的整数');
}

export function convertBase(value: string, fromBase: number, toBase: number): string {
  validateBase(fromBase);
  validateBase(toBase);
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === '-' || normalized === '+') throw new Error('请输入要转换的数字');
  const sign = normalized.startsWith('-') ? -1n : 1n;
  const unsigned = /^[+-]/u.test(normalized) ? normalized.slice(1) : normalized;
  let decimal = 0n;
  for (const character of unsigned) {
    const digit = parseInt(character, 36);
    if (!/^[0-9a-z]$/u.test(character) || digit >= fromBase) {
      throw new Error(`数字 ${character} 不属于 ${fromBase} 进制`);
    }
    decimal = decimal * BigInt(fromBase) + BigInt(digit);
  }
  return (decimal * sign).toString(toBase);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;');
}

export function generateMetaTags(input: MetaTagInput): string {
  const title = escapeHtml(input.title?.trim() ?? '');
  const description = escapeHtml(input.description?.trim() ?? '');
  const lines = [
    title ? `<title>${title}</title>` : '',
    description ? `<meta name="description" content="${description}">` : '',
    input.keywords?.trim() ? `<meta name="keywords" content="${escapeHtml(input.keywords.trim())}">` : '',
    input.author?.trim() ? `<meta name="author" content="${escapeHtml(input.author.trim())}">` : '',
    input.canonicalUrl?.trim() ? `<link rel="canonical" href="${escapeHtml(input.canonicalUrl.trim())}">` : '',
    title ? `<meta property="og:title" content="${title}">` : '',
    description ? `<meta property="og:description" content="${description}">` : '',
    input.imageUrl?.trim() ? `<meta property="og:image" content="${escapeHtml(input.imageUrl.trim())}">` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

function rotateCharacter(character: string, shift: number): string {
  const code = character.charCodeAt(0);
  const base = code >= 65 && code <= 90 ? 65 : code >= 97 && code <= 122 ? 97 : -1;
  if (base === -1) return character;
  return String.fromCharCode(base + ((code - base + shift) % 26 + 26) % 26);
}

export function encodeCaesar(text: string, shift: number): string {
  const normalizedShift = Number.isFinite(shift) ? Math.trunc(shift) : 0;
  return Array.from(text, (character) => rotateCharacter(character, normalizedShift)).join('');
}

export function decodeCaesar(text: string, shift: number): string {
  return encodeCaesar(text, -shift);
}

export function atbash(text: string): string {
  return Array.from(text, (character) => {
    const code = character.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCharCode(90 - (code - 65));
    if (code >= 97 && code <= 122) return String.fromCharCode(122 - (code - 97));
    return character;
  }).join('');
}

export function rot13(text: string): string {
  return encodeCaesar(text, 13);
}

export type CaesarCandidate = { shift: number; text: string; score: number };

function englishScore(text: string): number {
  const upper = ` ${text.toUpperCase()} `;
  const commonWords = [' THE ', ' AND ', ' THAT ', ' THIS ', ' HELLO ', ' WORLD ', ' YOU ', ' IS ', ' OF ', ' TO '];
  const wordScore = commonWords.reduce((score, word) => score + (upper.includes(word) ? 20 : 0), 0);
  const frequencyScore = Array.from(upper).reduce((score, character) => score + ('ETAOIN SHRDLU'.includes(character) ? 1 : 0), 0);
  return wordScore + frequencyScore;
}

export function rankCaesarDecodings(text: string, limit = 5): CaesarCandidate[] {
  const boundedLimit = Math.min(10, Math.max(1, Math.trunc(limit) || 1));
  return Array.from({ length: 26 }, (_, shift) => {
    const decoded = decodeCaesar(text, shift);
    return { shift, text: decoded, score: englishScore(decoded) };
  }).sort((a, b) => b.score - a.score || a.shift - b.shift).slice(0, boundedLimit);
}

const SHAVIAN_RULES: Readonly<Record<string, string>> = {
  th: '𐑞', sh: '𐑖', ch: '𐑗', ng: '𐑙', wh: '𐑢', ph: '𐑓', ee: '𐑰', oo: '𐑫',
  a: '𐑨', b: '𐑚', c: '𐑒', d: '𐑛', e: '𐑧', f: '𐑓', g: '𐑜', h: '𐑣', i: '𐑦',
  j: '𐑡', k: '𐑒', l: '𐑤', m: '𐑥', n: '𐑯', o: '𐑪', p: '𐑐', q: '𐑒', r: '𐑮',
  s: '𐑕', t: '𐑑', u: '𐑳', v: '𐑝', w: '𐑢', x: '𐑒𐑕', y: '𐑘', z: '𐑟',
};

export function transliterateShavian(text: string): string {
  let output = '';
  for (let index = 0; index < text.length;) {
    const pair = text.slice(index, index + 2).toLowerCase();
    const single = text[index].toLowerCase();
    if (SHAVIAN_RULES[pair]) {
      output += SHAVIAN_RULES[pair];
      index += 2;
    } else if (SHAVIAN_RULES[single]) {
      output += SHAVIAN_RULES[single];
      index += 1;
    } else {
      const codePoint = text.codePointAt(index);
      if (codePoint === undefined) break;
      const character = String.fromCodePoint(codePoint);
      output += character;
      index += character.length;
    }
  }
  return output;
}

export function trimLines(text: string): string {
  return text.split(/\r?\n/u).map((line) => line.trim()).join('\n').trim();
}

export function deduplicateLines(text: string, caseSensitive = true): string {
  const seen = new Set<string>();
  return trimLines(text).split('\n').filter((line) => {
    const key = caseSensitive ? line : line.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join('\n');
}

export function sortLines(text: string, direction: SortDirection = 'asc'): string {
  const lines = trimLines(text).split('\n').sort((a, b) => a.localeCompare(b));
  return (direction === 'desc' ? lines.reverse() : lines).join('\n');
}

export function transformCase(text: string, mode: TextCase): string {
  if (mode === 'upper') return text.toLocaleUpperCase();
  if (mode === 'lower') return text.toLocaleLowerCase();
  if (mode === 'title') return text.toLocaleLowerCase().replace(/\b\p{L}/gu, (character) => character.toLocaleUpperCase());
  const lower = text.toLocaleLowerCase();
  return lower.replace(/(^|[.!?]\s+)(\p{L})/gu, (_, prefix: string, character: string) => `${prefix}${character.toLocaleUpperCase()}`);
}

export function slugify(text: string): string {
  return text.normalize('NFKC').toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
}

export function cleanupWhitespace(text: string): string {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim().replace(/[\t ]+/gu, ' '))
    .join('\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

function escapeXmlAttribute(value: string): string {
  return escapeHtml(value);
}

function readSvgViewBox(svg: string): [number, number, number, number] {
  const values = svg.match(/\bviewBox="([^"]+)"/u)?.[1].trim().split(/[\s,]+/u).map(Number);
  if (!values || values.length !== 4 || values.some((value) => !Number.isFinite(value)) || values[2] <= 0 || values[3] <= 0) {
    throw new Error('二维码 SVG 缺少有效的 viewBox');
  }
  return values as [number, number, number, number];
}

export async function generateQrSvg(input: QrSvgInput): Promise<string> {
  const text = input.text.trim();
  if (!text) throw new Error('请输入二维码内容');
  if (input.logoDataUrl && !/^data:image\/(?:png|jpeg|webp|svg\+xml);base64,/iu.test(input.logoDataUrl)) {
    throw new Error('中心 Logo 必须是本地 PNG、JPEG、WebP 或 SVG 图片');
  }
  const svg = await QRCode.toString(text, {
    type: 'svg',
    width: 360,
    margin: 2,
    errorCorrectionLevel: input.errorCorrectionLevel ?? 'M',
    color: { dark: input.dark ?? '#000000', light: input.light ?? '#ffffff' },
  });
  if (!input.logoDataUrl) return svg;
  const [minX, minY, viewWidth, viewHeight] = readSvgViewBox(svg);
  const logoSize = Math.min(viewWidth, viewHeight) * 0.2;
  const logoX = minX + (viewWidth - logoSize) / 2;
  const logoY = minY + (viewHeight - logoSize) / 2;
  const padding = logoSize * 0.1;
  const backgroundSize = logoSize + padding * 2;
  const logo = `<rect x="${logoX - padding}" y="${logoY - padding}" width="${backgroundSize}" height="${backgroundSize}" rx="${logoSize * 0.12}" fill="${escapeXmlAttribute(input.light ?? '#ffffff')}"/><image href="${escapeXmlAttribute(input.logoDataUrl)}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`;
  return svg.replace('</svg>', `${logo}</svg>`);
}

const BARCODE_FORMATS: ReadonlySet<string> = new Set(['code128', 'ean13', 'datamatrix', 'azteccode', 'pdf417']);

function validateEan13(value: string): void {
  if (!/^\d{13}$/u.test(value)) throw new Error('EAN-13 必须是 13 位数字');
  const digits = Array.from(value, Number);
  const sum = digits.slice(0, 12).reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 1 : 3), 0);
  const checksum = (10 - (sum % 10)) % 10;
  if (checksum !== digits[12]) throw new Error('EAN-13 校验位无效');
}

export function generateBarcodeSvg(format: BarcodeFormat, value: string): string {
  if (!BARCODE_FORMATS.has(format)) throw new Error(`不支持的条码格式：${format}`);
  const normalized = value.trim();
  if (!normalized) throw new Error('请输入条码内容');
  if (format === 'ean13') validateEan13(normalized);
  if (format === 'code128' && !/^[\x20-\x7e]+$/u.test(normalized)) throw new Error('Code 128 仅支持可打印 ASCII 字符');
  if ((format === 'datamatrix' || format === 'azteccode') && normalized.length > 500) throw new Error('二维条码内容不能超过 500 个字符');
  if (format === 'pdf417' && normalized.length > 1000) throw new Error('PDF417 内容不能超过 1000 个字符');
  try {
    const options: Parameters<typeof bwipjs.toSVG>[0] = {
      bcid: format,
      text: normalized,
      scale: 3,
      includetext: format === 'code128' || format === 'ean13',
      textxalign: 'center',
      backgroundcolor: 'FFFFFF',
    };
    if (format === 'code128' || format === 'ean13') options.height = 16;
    return bwipjs.toSVG(options);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`条码生成失败（${format}）：${detail}`);
  }
}
