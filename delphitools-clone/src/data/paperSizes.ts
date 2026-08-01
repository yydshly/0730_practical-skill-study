export type PaperUnit = 'mm' | 'cm' | 'in' | 'px';
export type PaperSize = {
  id: string;
  name: string;
  group: 'ISO' | '北美' | '印刷';
  widthMm: number;
  heightMm: number;
};

export const PAPER_SIZES: readonly PaperSize[] = [
  { id: 'a0', name: 'A0', group: 'ISO', widthMm: 841, heightMm: 1189 },
  { id: 'a1', name: 'A1', group: 'ISO', widthMm: 594, heightMm: 841 },
  { id: 'a2', name: 'A2', group: 'ISO', widthMm: 420, heightMm: 594 },
  { id: 'a3', name: 'A3', group: 'ISO', widthMm: 297, heightMm: 420 },
  { id: 'a4', name: 'A4', group: 'ISO', widthMm: 210, heightMm: 297 },
  { id: 'a5', name: 'A5', group: 'ISO', widthMm: 148, heightMm: 210 },
  { id: 'letter', name: 'Letter', group: '北美', widthMm: 215.9, heightMm: 279.4 },
  { id: 'legal', name: 'Legal', group: '北美', widthMm: 215.9, heightMm: 355.6 },
  { id: 'tabloid', name: 'Tabloid', group: '北美', widthMm: 279.4, heightMm: 431.8 },
  { id: 'business-card-cn', name: '中国标准名片', group: '印刷', widthMm: 90, heightMm: 54 },
];

export function findPaperSize(id: string): PaperSize | undefined {
  return PAPER_SIZES.find((size) => size.id === id);
}

export function convertPaperDimensions(id: string, unit: PaperUnit) {
  const size = findPaperSize(id);
  if (!size) throw new Error('未找到所选纸张尺寸');
  const divisor = unit === 'mm' ? 1 : unit === 'cm' ? 10 : unit === 'in' ? 25.4 : 25.4 / 96;
  const precision = unit === 'px' ? 2 : unit === 'in' ? 3 : 2;
  return {
    width: Number((size.widthMm / divisor).toFixed(precision)),
    height: Number((size.heightMm / divisor).toFixed(precision)),
    unit,
  };
}
