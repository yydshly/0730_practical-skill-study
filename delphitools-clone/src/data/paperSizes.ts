export type PaperUnit = 'mm' | 'cm' | 'in' | 'px';
export type PaperGroup = 'ISO 成品' | 'ISO 信封' | 'ISO 原纸' | '北美 / ANSI' | '建筑制图' | 'JIS 日本' | '传统英制' | '中国开本' | 'SIS 瑞典' | '法国传统' | '名片';
export type PaperSize = {
  id: string;
  name: string;
  group: PaperGroup;
  widthMm: number;
  heightMm: number;
  aliases: readonly string[];
};

const isoA: readonly PaperSize[] = [
  ['a0', 'A0', 841, 1189], ['a1', 'A1', 594, 841], ['a2', 'A2', 420, 594], ['a3', 'A3', 297, 420], ['a4', 'A4', 210, 297], ['a5', 'A5', 148, 210], ['a6', 'A6', 105, 148], ['a7', 'A7', 74, 105], ['a8', 'A8', 52, 74], ['a9', 'A9', 37, 52], ['a10', 'A10', 26, 37],
].map(([id, name, widthMm, heightMm]) => ({ id: String(id), name: String(name), group: 'ISO 成品' as const, widthMm: Number(widthMm), heightMm: Number(heightMm), aliases: [`ISO ${name}`, `${name} 纸`] }));

const isoB: readonly PaperSize[] = [
  ['b0', 'B0', 1000, 1414], ['b1', 'B1', 707, 1000], ['b2', 'B2', 500, 707], ['b3', 'B3', 353, 500], ['b4', 'B4', 250, 353], ['b5', 'B5', 176, 250], ['b6', 'B6', 125, 176], ['b7', 'B7', 88, 125], ['b8', 'B8', 62, 88], ['b9', 'B9', 44, 62], ['b10', 'B10', 31, 44],
].map(([id, name, widthMm, heightMm]) => ({ id: String(id), name: String(name), group: 'ISO 成品' as const, widthMm: Number(widthMm), heightMm: Number(heightMm), aliases: [`ISO ${name}`, `${name} 纸`] }));

const isoC: readonly PaperSize[] = [
  ['c0', 'C0', 917, 1297], ['c1', 'C1', 648, 917], ['c2', 'C2', 458, 648], ['c3', 'C3', 324, 458], ['c4', 'C4', 229, 324], ['c5', 'C5', 162, 229], ['c6', 'C6', 114, 162], ['c7', 'C7', 81, 114], ['c8', 'C8', 57, 81], ['c9', 'C9', 40, 57], ['c10', 'C10', 28, 40],
].map(([id, name, widthMm, heightMm]) => ({ id: String(id), name: String(name), group: 'ISO 信封' as const, widthMm: Number(widthMm), heightMm: Number(heightMm), aliases: [`ISO ${name}`, `${name} 信封`] }));

const isoRaw: readonly PaperSize[] = [
  { id: 'ra0', name: 'RA0', group: 'ISO 原纸', widthMm: 860, heightMm: 1220, aliases: ['ISO 217 RA0', '原纸 RA0'] },
  { id: 'ra1', name: 'RA1', group: 'ISO 原纸', widthMm: 610, heightMm: 860, aliases: ['ISO 217 RA1', '原纸 RA1'] },
  { id: 'ra2', name: 'RA2', group: 'ISO 原纸', widthMm: 430, heightMm: 610, aliases: ['ISO 217 RA2', '原纸 RA2'] },
  { id: 'ra3', name: 'RA3', group: 'ISO 原纸', widthMm: 305, heightMm: 430, aliases: ['ISO 217 RA3', '原纸 RA3'] },
  { id: 'ra4', name: 'RA4', group: 'ISO 原纸', widthMm: 215, heightMm: 305, aliases: ['ISO 217 RA4', '原纸 RA4'] },
  { id: 'sra0', name: 'SRA0', group: 'ISO 原纸', widthMm: 900, heightMm: 1280, aliases: ['ISO 217 SRA0', '加大原纸 SRA0'] },
  { id: 'sra1', name: 'SRA1', group: 'ISO 原纸', widthMm: 640, heightMm: 900, aliases: ['ISO 217 SRA1', '加大原纸 SRA1'] },
  { id: 'sra2', name: 'SRA2', group: 'ISO 原纸', widthMm: 450, heightMm: 640, aliases: ['ISO 217 SRA2', '加大原纸 SRA2'] },
  { id: 'sra3', name: 'SRA3', group: 'ISO 原纸', widthMm: 320, heightMm: 450, aliases: ['ISO 217 SRA3', '加大原纸 SRA3'] },
  { id: 'sra4', name: 'SRA4', group: 'ISO 原纸', widthMm: 225, heightMm: 320, aliases: ['ISO 217 SRA4', '加大原纸 SRA4'] },
];

const northAmerican: readonly PaperSize[] = [
  { id: 'letter', name: 'Letter', group: '北美 / ANSI', widthMm: 215.9, heightMm: 279.4, aliases: ['ANSI A', 'US Letter', '信纸'] },
  { id: 'ansi-c', name: 'ANSI C', group: '北美 / ANSI', widthMm: 431.8, heightMm: 558.8, aliases: ['17 × 22', '工程 C'] },
  { id: 'ansi-d', name: 'ANSI D', group: '北美 / ANSI', widthMm: 558.8, heightMm: 863.6, aliases: ['22 × 34', '工程 D'] },
  { id: 'ansi-e', name: 'ANSI E', group: '北美 / ANSI', widthMm: 863.6, heightMm: 1117.6, aliases: ['34 × 44', '工程 E'] },
  { id: 'legal', name: 'Legal', group: '北美 / ANSI', widthMm: 215.9, heightMm: 355.6, aliases: ['US Legal', '8.5 × 14'] },
  { id: 'tabloid', name: 'ANSI B / Tabloid / Ledger', group: '北美 / ANSI', widthMm: 279.4, heightMm: 431.8, aliases: ['ANSI B', 'Tabloid', 'Ledger', '11 × 17', '小报'] },
  { id: 'executive', name: 'Executive', group: '北美 / ANSI', widthMm: 184.15, heightMm: 266.7, aliases: ['7.25 × 10.5', '行政纸'] },
  { id: 'folio-us', name: 'Folio', group: '北美 / ANSI', widthMm: 215.9, heightMm: 330.2, aliases: ['US Folio', '8.5 × 13'] },
  { id: 'quarto', name: 'Quarto', group: '北美 / ANSI', widthMm: 203.2, heightMm: 254, aliases: ['8 × 10', '四开本'] },
];

const architectural: readonly PaperSize[] = [
  { id: 'arch-a', name: 'Arch A', group: '建筑制图', widthMm: 228.6, heightMm: 304.8, aliases: ['9 × 12', '建筑 A'] },
  { id: 'arch-b', name: 'Arch B', group: '建筑制图', widthMm: 304.8, heightMm: 457.2, aliases: ['12 × 18', '建筑 B'] },
  { id: 'arch-c', name: 'Arch C', group: '建筑制图', widthMm: 457.2, heightMm: 609.6, aliases: ['18 × 24', '建筑 C'] },
  { id: 'arch-d', name: 'Arch D', group: '建筑制图', widthMm: 609.6, heightMm: 914.4, aliases: ['24 × 36', '建筑 D'] },
  { id: 'arch-e', name: 'Arch E', group: '建筑制图', widthMm: 914.4, heightMm: 1219.2, aliases: ['36 × 48', '建筑 E'] },
  { id: 'arch-e1', name: 'Arch E1', group: '建筑制图', widthMm: 762, heightMm: 1066.8, aliases: ['30 × 42', '建筑 E1'] },
];

const jisB: readonly PaperSize[] = [
  ['jis-b0', 'JIS B0', 1030, 1456], ['jis-b1', 'JIS B1', 728, 1030], ['jis-b2', 'JIS B2', 515, 728], ['jis-b3', 'JIS B3', 364, 515], ['jis-b4', 'JIS B4', 257, 364], ['jis-b5', 'JIS B5', 182, 257], ['jis-b6', 'JIS B6', 128, 182], ['jis-b7', 'JIS B7', 91, 128], ['jis-b8', 'JIS B8', 64, 91], ['jis-b9', 'JIS B9', 45, 64], ['jis-b10', 'JIS B10', 32, 45],
].map(([id, name, widthMm, heightMm]) => ({ id: String(id), name: String(name), group: 'JIS 日本' as const, widthMm: Number(widthMm), heightMm: Number(heightMm), aliases: [`JIS P 0138 ${String(name).replace('JIS ', '')}`, `日本 ${String(name).replace('JIS ', '')}`] }));

const traditional: readonly PaperSize[] = [
  { id: 'imperial', name: 'Imperial', group: '传统英制', widthMm: 559, heightMm: 762, aliases: ['22 × 30', '英制 Imperial'] },
  { id: 'royal', name: 'Royal', group: '传统英制', widthMm: 508, heightMm: 635, aliases: ['20 × 25', '英制 Royal'] },
  { id: 'crown', name: 'Crown', group: '传统英制', widthMm: 381, heightMm: 508, aliases: ['15 × 20', '英制 Crown'] },
  { id: 'demy', name: 'Demy', group: '传统英制', widthMm: 444.5, heightMm: 571.5, aliases: ['17.5 × 22.5', '英制 Demy'] },
];

const chineseBooks: readonly PaperSize[] = [
  { id: 'dadu-16k', name: '大度 16 开', group: '中国开本', widthMm: 210, heightMm: 285, aliases: ['889 × 1194', '大度十六开'] },
  { id: 'dadu-32k', name: '大度 32 开', group: '中国开本', widthMm: 140, heightMm: 203, aliases: ['889 × 1194', '大度三十二开'] },
  { id: 'dadu-64k', name: '大度 64 开', group: '中国开本', widthMm: 105, heightMm: 142.5, aliases: ['889 × 1194', '大度六十四开'] },
  { id: 'zhengdu-16k', name: '正度 16 开', group: '中国开本', widthMm: 185, heightMm: 260, aliases: ['787 × 1092', '正度十六开'] },
  { id: 'zhengdu-32k', name: '正度 32 开', group: '中国开本', widthMm: 130, heightMm: 185, aliases: ['787 × 1092', '正度三十二开'] },
  { id: 'zhengdu-64k', name: '正度 64 开', group: '中国开本', widthMm: 92, heightMm: 130, aliases: ['787 × 1092', '正度六十四开'] },
];

const regional: readonly PaperSize[] = [
  { id: 'sis-e5', name: 'SIS E5', group: 'SIS 瑞典', widthMm: 155, heightMm: 220, aliases: ['SIS 01 47 11 E5', '瑞典 E5'] },
  { id: 'sis-g5', name: 'SIS G5', group: 'SIS 瑞典', widthMm: 169, heightMm: 239, aliases: ['SIS 01 47 11 G5', '瑞典 G5'] },
  { id: 'raisin', name: 'Raisin', group: '法国传统', widthMm: 500, heightMm: 650, aliases: ['法国 Raisin', '葡萄纸'] },
  { id: 'demi-raisin', name: 'Demi-Raisin', group: '法国传统', widthMm: 325, heightMm: 500, aliases: ['半 Raisin', '法国 Demi-Raisin'] },
  { id: 'double-raisin', name: 'Double Raisin', group: '法国传统', widthMm: 650, heightMm: 1000, aliases: ['双 Raisin', '法国 Double Raisin'] },
  { id: 'carre', name: 'Carré', group: '法国传统', widthMm: 450, heightMm: 560, aliases: ['法国 Carré', '方形名纸'] },
  { id: 'business-card-cn', name: '中国标准名片', group: '名片', widthMm: 90, heightMm: 54, aliases: ['名片', '90 × 54', '中国名片'] },
];

export const PAPER_SIZES: readonly PaperSize[] = [...isoA, ...isoB, ...isoC, ...isoRaw, ...northAmerican, ...architectural, ...jisB, ...traditional, ...chineseBooks, ...regional];

export function findPaperSize(id: string): PaperSize | undefined {
  return PAPER_SIZES.find((size) => size.id === id);
}

export function searchPaperSizes(query: string, group?: PaperGroup): readonly PaperSize[] {
  const normalized = query.trim().toLocaleLowerCase();
  return PAPER_SIZES.filter((size) => {
    if (group && size.group !== group) return false;
    if (!normalized) return true;
    return [size.id, size.name, size.group, ...size.aliases].some((value) => value.toLocaleLowerCase().includes(normalized));
  });
}

function validateDpi(dpi: number): void {
  if (!Number.isFinite(dpi) || dpi < 36 || dpi > 2400) throw new Error('DPI 必须在 36 到 2400 之间');
}

export function paperPixelDimensions(id: string, dpi: number) {
  const size = findPaperSize(id);
  if (!size) throw new Error('未找到所选纸张尺寸');
  validateDpi(dpi);
  return { width: Math.round(size.widthMm / 25.4 * dpi), height: Math.round(size.heightMm / 25.4 * dpi), dpi };
}

export function convertPaperDimensions(id: string, unit: PaperUnit, dpi = 96) {
  const size = findPaperSize(id);
  if (!size) throw new Error('未找到所选纸张尺寸');
  if (unit === 'px') {
    const pixels = paperPixelDimensions(id, dpi);
    return { width: pixels.width, height: pixels.height, unit };
  }
  const divisor = unit === 'mm' ? 1 : unit === 'cm' ? 10 : 25.4;
  const precision = unit === 'in' ? 3 : 2;
  return { width: Number((size.widthMm / divisor).toFixed(precision)), height: Number((size.heightMm / divisor).toFixed(precision)), unit };
}
