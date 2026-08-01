export type UnicodeBlock = { id: string; name: string; start: number; end: number };
export type UnicodeCharacter = { character: string; codePoint: number; label: string };

export const UNICODE_BLOCKS: readonly UnicodeBlock[] = [
  { id: 'basic-latin', name: '基本拉丁字母', start: 0x0020, end: 0x007e },
  { id: 'latin-1', name: '拉丁字母补充', start: 0x00a0, end: 0x00ff },
  { id: 'greek', name: '希腊字母', start: 0x0370, end: 0x03ff },
  { id: 'cyrillic', name: '西里尔字母', start: 0x0400, end: 0x04ff },
  { id: 'punctuation', name: '通用标点', start: 0x2000, end: 0x206f },
  { id: 'cjk-symbols', name: '中日韩符号和标点', start: 0x3000, end: 0x303f },
  { id: 'cjk', name: '中日韩统一表意文字', start: 0x4e00, end: 0x9fff },
  { id: 'emoji', name: '表情符号（节选区段）', start: 0x1f600, end: 0x1f64f },
];

export function formatCodePoint(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
}

function entry(codePoint: number): UnicodeCharacter {
  return { character: String.fromCodePoint(codePoint), codePoint, label: formatCodePoint(codePoint) };
}

function parseCodePoint(query: string): number | undefined {
  const match = query.trim().match(/^(?:U\+|0X)?([0-9A-F]{2,6})$/iu);
  if (!match) return undefined;
  const codePoint = Number.parseInt(match[1], 16);
  return codePoint <= 0x10ffff ? codePoint : undefined;
}

export function searchUnicode(query: string, blockId?: string, requestedLimit = 120): UnicodeCharacter[] {
  const limit = Math.max(1, Math.min(200, Math.floor(requestedLimit) || 120));
  const normalized = query.trim();
  const directCodePoint = parseCodePoint(normalized);
  if (directCodePoint !== undefined) return [entry(directCodePoint)];
  if (Array.from(normalized).length === 1) return [entry(normalized.codePointAt(0)!)];

  const blocks = blockId ? UNICODE_BLOCKS.filter((block) => block.id === blockId) : UNICODE_BLOCKS;
  const matchingBlocks = normalized
    ? blocks.filter((block) => block.name.toLocaleLowerCase().includes(normalized.toLocaleLowerCase()))
    : blocks;
  const results: UnicodeCharacter[] = [];
  for (const block of matchingBlocks) {
    for (let codePoint = block.start; codePoint <= block.end && results.length < limit; codePoint += 1) results.push(entry(codePoint));
    if (results.length >= limit) break;
  }
  return results;
}
