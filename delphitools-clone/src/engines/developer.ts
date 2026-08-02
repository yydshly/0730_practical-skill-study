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
export type TextCase = 'upper' | 'lower' | 'title' | 'sentence' | 'toggle';
export type SortDirection = 'asc' | 'desc';
export type BarcodeFormat = 'code128' | 'ean13' | 'datamatrix' | 'azteccode' | 'pdf417';
export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
export type FindReplaceOptions = {
  useRegex: boolean;
  caseSensitive: boolean;
  replaceAll: boolean;
};
export type FindReplaceResult = { text: string; replacements: number };
export type TextExtractKind = 'emails' | 'urls' | 'phone-numbers' | 'numbers';
export type CommonBaseValues = {
  binary: string;
  octal: string;
  decimal: string;
  hexadecimal: string;
};
export type BitwiseOperation = 'and' | 'or' | 'xor' | 'not' | 'shift-left' | 'shift-right';

export type MetaTagInput = {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  canonicalUrl?: string;
  imageUrl?: string;
  siteName?: string;
  twitterHandle?: string;
  twitterCard?: 'summary' | 'summary_large_image';
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

function digitValue(character: string): number {
  const code = character.charCodeAt(0);
  if (code >= 48 && code <= 57) return code - 48;
  if (code >= 97 && code <= 122) return code - 87;
  return -1;
}

function parseBaseInteger(value: string, fromBase: number): bigint {
  validateBase(fromBase);
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === '-' || normalized === '+') throw new Error('请输入要转换的数字');
  const sign = normalized.startsWith('-') ? -1n : 1n;
  const unsigned = /^[+-]/u.test(normalized) ? normalized.slice(1) : normalized;
  let decimal = 0n;
  for (const character of unsigned) {
    const digit = digitValue(character);
    if (digit < 0 || digit >= fromBase) throw new Error(`数字 ${character} 不属于 ${fromBase} 进制`);
    decimal = decimal * BigInt(fromBase) + BigInt(digit);
  }
  return decimal * sign;
}

export function convertBase(value: string, fromBase: number, toBase: number): string {
  validateBase(toBase);
  return parseBaseInteger(value, fromBase).toString(toBase);
}

export function convertCommonBases(value: string, fromBase: number): CommonBaseValues {
  const decimal = parseBaseInteger(value, fromBase);
  return {
    binary: decimal.toString(2),
    octal: decimal.toString(8),
    decimal: decimal.toString(10),
    hexadecimal: decimal.toString(16),
  };
}

const BIT16_MASK = 0xffffn;

function parseUnsigned16(value: string): bigint {
  if (!/^\d+$/u.test(value.trim())) throw new Error('16 位数值必须在 0 到 65535 之间');
  const parsed = parseBaseInteger(value, 10);
  if (parsed < 0n || parsed > BIT16_MASK) throw new Error('16 位数值必须在 0 到 65535 之间');
  return parsed;
}

function validateBitIndex(bit: number): void {
  if (!Number.isInteger(bit) || bit < 0 || bit > 15) throw new Error('bit 序号必须在 0 到 15 之间');
}

export function toggleBit16(value: string, bit: number): string {
  validateBitIndex(bit);
  return (parseUnsigned16(value) ^ (1n << BigInt(bit))).toString(10);
}

export function applyBitwise16(left: string, right: string, operation: BitwiseOperation): string {
  const leftValue = parseUnsigned16(left);
  const rightValue = parseUnsigned16(right);
  let result: bigint;
  if (operation === 'and') result = leftValue & rightValue;
  else if (operation === 'or') result = leftValue | rightValue;
  else if (operation === 'xor') result = leftValue ^ rightValue;
  else if (operation === 'not') result = ~leftValue;
  else if (operation === 'shift-left') result = leftValue << rightValue;
  else result = leftValue >> rightValue;
  return (result & BIT16_MASK).toString(10);
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
  const imageUrl = escapeHtml(input.imageUrl?.trim() ?? '');
  const siteName = escapeHtml(input.siteName?.trim() ?? '');
  const twitterHandle = input.twitterHandle?.trim().replace(/^@+/u, '') ?? '';
  const twitterCard = escapeHtml(input.twitterCard ?? '');
  const lines = [
    title ? `<title>${title}</title>` : '',
    description ? `<meta name="description" content="${description}">` : '',
    input.keywords?.trim() ? `<meta name="keywords" content="${escapeHtml(input.keywords.trim())}">` : '',
    input.author?.trim() ? `<meta name="author" content="${escapeHtml(input.author.trim())}">` : '',
    input.canonicalUrl?.trim() ? `<link rel="canonical" href="${escapeHtml(input.canonicalUrl.trim())}">` : '',
    title ? `<meta property="og:title" content="${title}">` : '',
    description ? `<meta property="og:description" content="${description}">` : '',
    imageUrl ? `<meta property="og:image" content="${imageUrl}">` : '',
    siteName ? `<meta property="og:site_name" content="${siteName}">` : '',
    twitterCard ? `<meta name="twitter:card" content="${twitterCard}">` : '',
    title ? `<meta name="twitter:title" content="${title}">` : '',
    description ? `<meta name="twitter:description" content="${description}">` : '',
    imageUrl ? `<meta name="twitter:image" content="${imageUrl}">` : '',
    twitterHandle ? `<meta name="twitter:site" content="${escapeHtml(`@${twitterHandle}`)}">` : '',
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
export type DecodingCandidate = {
  method: 'caesar' | 'atbash' | 'rot13' | 'morse' | 'hex' | 'base64';
  label: string;
  text: string;
  score: number;
};

function isAsciiLetter(character: string): boolean {
  return /^[A-Za-z]$/u.test(character);
}

export function decodeVigenere(text: string, key: string): string {
  if (!key.trim()) throw new Error('Vigenere 密钥不能为空');
  if (!Array.from(key).every(isAsciiLetter)) throw new Error('Vigenere 密钥只能包含英文字母');

  let keyIndex = 0;
  return Array.from(text, (character) => {
    if (!isAsciiLetter(character)) return character;
    const shift = key.charAt(keyIndex % key.length).toUpperCase().charCodeAt(0) - 65;
    keyIndex += 1;
    return rotateCharacter(character, -shift);
  }).join('');
}

const MORSE_CODE: Readonly<Record<string, string>> = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I',
  '.---': 'J', '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
  '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y', '--..': 'Z',
  '-----': '0', '.----': '1', '..---': '2', '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7',
  '---..': '8', '----.': '9', '.-.-.-': '.', '--..--': ',', '..--..': '?', '.----.': "'", '-.-.--': '!',
  '-..-.': '/', '-.--.': '(', '-.--.-': ')', '.-...': '&', '---...': ':', '-.-.-.': ';', '-...-': '=', '.-.-.': '+',
  '-....-': '-', '..--.-': '_', '.-..-.': '"', '...-..-': '$', '.--.-.': '@',
};

export function decodeMorse(value: string): string {
  const normalized = value.trim();
  if (!normalized || !/^[.\-/\s]+$/u.test(normalized)) throw new Error('Morse 代码无效，请使用点、划线、空格和 /');

  const tokens = normalized.split(/\s+/u);
  const words: string[] = [];
  let word = '';
  for (const token of tokens) {
    if (token === '/') {
      if (!word) throw new Error('Morse 代码无效，请检查单词分隔符');
      words.push(word);
      word = '';
      continue;
    }
    const character = MORSE_CODE[token];
    if (!character) throw new Error('Morse 代码无效，请检查点划组合');
    word += character;
  }
  if (!word) throw new Error('Morse 代码无效，请检查单词分隔符');
  words.push(word);
  return words.join(' ');
}

export function decodeHex(value: string): string {
  const normalized = value.replace(/[\s:-]/gu, '');
  if (!normalized) throw new Error('十六进制内容不能为空');
  if (!/^[0-9a-f]+$/iu.test(normalized)) throw new Error('十六进制内容只能包含 0-9 和 A-F');
  if (normalized.length % 2 !== 0) throw new Error('十六进制内容必须由偶数个字符组成');
  try {
    const bytes = Uint8Array.from(normalized.match(/.{2}/gu)!, (pair) => Number.parseInt(pair, 16));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('十六进制内容不是有效的 UTF-8 文本');
  }
}

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

function looksLikeMorse(text: string): boolean {
  return /^[.\-/\s]+$/u.test(text.trim()) && /[.-]/u.test(text);
}

function looksLikeHex(text: string): boolean {
  const normalized = text.replace(/[\s:-]/gu, '');
  return normalized.length > 0 && normalized.length % 2 === 0 && /^[0-9a-f]+$/iu.test(normalized);
}

function looksLikeBase64(text: string): boolean {
  const normalized = text.trim();
  return normalized.length >= 4 && normalized.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/u.test(normalized);
}

export function rankDecodingCandidates(text: string, limit = 5): DecodingCandidate[] {
  const boundedLimit = Math.min(10, Math.max(1, Math.trunc(limit) || 1));
  if (!text.trim()) return [];

  const candidates: DecodingCandidate[] = rankCaesarDecodings(text, 26).map((candidate) => ({
    method: 'caesar', label: `凯撒（左移 ${candidate.shift}）`, text: candidate.text, score: candidate.score,
  }));
  candidates.push(
    { method: 'atbash', label: 'Atbash', text: atbash(text), score: englishScore(atbash(text)) },
    { method: 'rot13', label: 'ROT13', text: rot13(text), score: englishScore(rot13(text)) },
  );

  const addIfDecodable = (method: DecodingCandidate['method'], label: string, decoder: () => string) => {
    try {
      const decoded = decoder();
      candidates.push({ method, label, text: decoded, score: englishScore(decoded) });
    } catch {
      // 自动模式只呈现已通过形态和严格解码校验的候选。
    }
  };
  if (looksLikeMorse(text)) addIfDecodable('morse', 'Morse', () => decodeMorse(text));
  if (looksLikeHex(text)) addIfDecodable('hex', '十六进制 UTF-8', () => decodeHex(text));
  if (looksLikeBase64(text)) addIfDecodable('base64', 'Base64', () => decodeBase64(text));

  const seen = new Set<string>();
  return candidates
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .filter((candidate) => {
      if (seen.has(candidate.text)) return false;
      seen.add(candidate.text);
      return true;
    })
    .slice(0, boundedLimit);
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
  if (mode === 'toggle') {
    return [...text].map((character) => {
      const upper = character.toLocaleUpperCase();
      const lower = character.toLocaleLowerCase();
      if (character === upper && character !== lower) return lower;
      if (character === lower && character !== upper) return upper;
      return character;
    }).join('');
  }
  const lower = text.toLocaleLowerCase();
  return lower.replace(/(^|[.!?]\s+)(\p{L})/gu, (_, prefix: string, character: string) => `${prefix}${character.toLocaleUpperCase()}`);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

export function findAndReplaceText(
  source: string,
  query: string,
  replacement: string,
  options: FindReplaceOptions,
): FindReplaceResult {
  if (!query) return { text: source, replacements: 0 };
  if (options.useRegex && query.length > 1000) throw new Error('正则表达式不能超过 1000 个字符');

  const flags = `${options.replaceAll ? 'g' : ''}${options.caseSensitive ? '' : 'i'}`;
  let expression: RegExp;
  try {
    expression = new RegExp(options.useRegex ? query : escapeRegExp(query), flags);
  } catch {
    throw new Error('正则表达式无效，请检查括号、方括号和标志');
  }

  let replacements = 0;
  const text = source.replace(expression, () => {
    replacements += 1;
    return replacement;
  });
  return { text, replacements };
}

function uniqueTextItems(items: Iterable<string>): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    result.push(item);
    if (result.length >= 10_000) break;
  }
  return result;
}

export function extractTextItems(source: string, kind: TextExtractKind): string[] {
  if (kind === 'emails') {
    return uniqueTextItems(source.match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+/giu) ?? []);
  }
  if (kind === 'urls') {
    const urls = source.match(/https?:\/\/[^\s<>"']+/giu) ?? [];
    return uniqueTextItems(urls.map((url) => url.replace(/[.,!?;:)}\]]+$/gu, '')));
  }
  if (kind === 'phone-numbers') {
    const candidates = source.match(/(?<![\d+])\+?\d(?:[ -]?\d)*(?!\d)/gu) ?? [];
    return uniqueTextItems(candidates.filter((candidate) => {
      const digitCount = candidate.replace(/\D/gu, '').length;
      return digitCount >= 7 && digitCount <= 15;
    }));
  }
  return uniqueTextItems(source.match(/\d+(?:[.,]\d+)?/gu) ?? []);
}

export function reverseLines(text: string): string {
  return text.split(/\r?\n/u).reverse().join('\n');
}

export function removeEmptyLines(text: string): string {
  return text.split(/\r?\n/u).filter((line) => !/^\s*$/u.test(line)).join('\n');
}

export function numberLines(text: string): string {
  return text.split(/\r?\n/u).map((line, index) => `${index + 1}. ${line}`).join('\n');
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
