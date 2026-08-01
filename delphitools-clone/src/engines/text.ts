export type TextCount = {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
  readingMinutes: number;
};

export type DiffSegment = { type: 'equal' | 'add' | 'delete'; text: string };
export type TypographyUnit = 'px' | 'rem' | 'pt' | 'pc' | 'in' | 'mm' | 'cm';

function positiveNumber(value: number, message: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(message);
}

export function countText(text: string): TextCount {
  const characters = Array.from(text).length;
  const charactersNoSpaces = Array.from(text).filter((character) => !/\s/u.test(character)).length;
  const words = text.match(/[\p{Script=Han}]+|[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  const paragraphs = text.trim() ? text.trim().split(/(?:\r?\n)[\t ]*(?:\r?\n)+/u).filter((value) => value.trim()).length : 0;
  return {
    characters,
    charactersNoSpaces,
    words,
    lines: text ? text.split(/\r\n?|\n/u).length : 0,
    paragraphs,
    readingMinutes: words ? Number((words / 200).toFixed(2)) : 0,
  };
}

function appendSegment(segments: DiffSegment[], type: DiffSegment['type'], text: string): void {
  if (!text) return;
  const previous = segments[segments.length - 1];
  if (previous?.type === type) previous.text += text;
  else segments.push({ type, text });
}

function coarseDiff(before: string[], after: string[]): DiffSegment[] {
  let prefix = 0;
  while (before[prefix] === after[prefix] && prefix < before.length && prefix < after.length) prefix += 1;
  let suffix = 0;
  while (
    suffix < before.length - prefix
    && suffix < after.length - prefix
    && before[before.length - suffix - 1] === after[after.length - suffix - 1]
  ) suffix += 1;
  const result: DiffSegment[] = [];
  appendSegment(result, 'equal', before.slice(0, prefix).join(''));
  appendSegment(result, 'delete', before.slice(prefix, before.length - suffix).join(''));
  appendSegment(result, 'add', after.slice(prefix, after.length - suffix).join(''));
  appendSegment(result, 'equal', before.slice(before.length - suffix).join(''));
  return result;
}

export function diffText(beforeText: string, afterText: string): DiffSegment[] {
  const before = Array.from(beforeText);
  const after = Array.from(afterText);
  if (before.length * after.length > 2_000_000) return coarseDiff(before, after);

  const columns = after.length + 1;
  const table = new Uint32Array((before.length + 1) * columns);
  for (let row = before.length - 1; row >= 0; row -= 1) {
    for (let column = after.length - 1; column >= 0; column -= 1) {
      const index = row * columns + column;
      table[index] = before[row] === after[column]
        ? table[(row + 1) * columns + column + 1] + 1
        : Math.max(table[(row + 1) * columns + column], table[row * columns + column + 1]);
    }
  }

  const result: DiffSegment[] = [];
  let row = 0;
  let column = 0;
  while (row < before.length && column < after.length) {
    if (before[row] === after[column]) {
      appendSegment(result, 'equal', before[row]);
      row += 1;
      column += 1;
    } else if (table[row * columns + column + 1] >= table[(row + 1) * columns + column]) {
      appendSegment(result, 'add', after[column]);
      column += 1;
    } else {
      appendSegment(result, 'delete', before[row]);
      row += 1;
    }
  }
  appendSegment(result, 'delete', before.slice(row).join(''));
  appendSegment(result, 'add', after.slice(column).join(''));
  return result;
}

export function pxToRem(pixels: number, rootSize = 16): number {
  positiveNumber(rootSize, '根字号必须是大于 0 的数字');
  if (!Number.isFinite(pixels)) throw new Error('像素值必须是有效数字');
  return pixels / rootSize;
}

export function remToPx(rem: number, rootSize = 16): number {
  positiveNumber(rootSize, '根字号必须是大于 0 的数字');
  if (!Number.isFinite(rem)) throw new Error('REM 值必须是有效数字');
  return rem * rootSize;
}

export function calculateLineHeight(fontSize: number, ratio: number) {
  positiveNumber(fontSize, '字号必须是大于 0 的数字');
  positiveNumber(ratio, '行高比例必须是大于 0 的数字');
  return { pixels: Number((fontSize * ratio).toFixed(4)), unitless: ratio };
}

function unitToPixels(value: number, unit: TypographyUnit, rootSize: number): number {
  const factors: Record<Exclude<TypographyUnit, 'rem'>, number> = {
    px: 1,
    pt: 96 / 72,
    pc: 16,
    in: 96,
    mm: 96 / 25.4,
    cm: 96 / 2.54,
  };
  return unit === 'rem' ? remToPx(value, rootSize) : value * factors[unit];
}

export function convertTypographyUnit(value: number, from: TypographyUnit, to: TypographyUnit, rootSize = 16): number {
  if (!Number.isFinite(value)) throw new Error('换算值必须是有效数字');
  positiveNumber(rootSize, '根字号必须是大于 0 的数字');
  const pixels = unitToPixels(value, from, rootSize);
  return to === 'rem' ? pxToRem(pixels, rootSize) : unitToPixels(1, to, rootSize) === 0 ? 0 : pixels / unitToPixels(1, to, rootSize);
}
