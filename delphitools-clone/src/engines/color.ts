export type RgbColor = { r: number; g: number; b: number };
export type HslColor = { h: number; s: number; l: number };
export type ParsedColor = RgbColor & { hex: string; hsl: HslColor };
export type ImagePixels = { width: number; height: number; data: Uint8ClampedArray };
export type HarmonyScheme = 'complementary' | 'analogous' | 'triadic' | 'split-complementary';
export type VisionMode = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
export type GradientMode = 'linear' | 'radial' | 'corner' | 'mesh';

const COLOR_ERROR = '无法识别颜色，请输入 HEX、RGB 或 HSL 颜色值';
const clamp = (value: number, min = 0, max = 255) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value);

function channelToHex(channel: number): string {
  return clamp(round(channel)).toString(16).padStart(2, '0');
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const hue = ((h % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const [red, green, blue] = segment < 1 ? [chroma, secondary, 0]
    : segment < 2 ? [secondary, chroma, 0]
      : segment < 3 ? [0, chroma, secondary]
        : segment < 4 ? [0, secondary, chroma]
          : segment < 5 ? [secondary, 0, chroma]
            : [chroma, 0, secondary];
  const match = lightness - chroma / 2;
  return { r: round((red + match) * 255), g: round((green + match) * 255), b: round((blue + match) * 255) };
}

function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const red = clamp(r) / 255;
  const green = clamp(g) / 255;
  const blue = clamp(b) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  if (delta) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    if (max === green) hue = 60 * ((blue - red) / delta + 2);
    if (max === blue) hue = 60 * ((red - green) / delta + 4);
  }
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { h: round((hue + 360) % 360), s: round(saturation * 100), l: round(lightness * 100) };
}

function fromRgb(rgb: RgbColor): ParsedColor {
  const normalized = { r: clamp(round(rgb.r)), g: clamp(round(rgb.g)), b: clamp(round(rgb.b)) };
  return { ...normalized, hex: rgbToHex(normalized), hsl: rgbToHsl(normalized) };
}

export function parseColor(input: string): ParsedColor {
  const value = input.trim().toLowerCase();
  const hex = value.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].split('').map((part) => part + part).join('') : hex[1];
    return fromRgb({ r: Number.parseInt(digits.slice(0, 2), 16), g: Number.parseInt(digits.slice(2, 4), 16), b: Number.parseInt(digits.slice(4, 6), 16) });
  }
  const rgb = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (rgb && rgb.slice(1).every((part) => Number(part) <= 255)) return fromRgb({ r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) });
  const hsl = value.match(/^hsl\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*\)$/);
  if (hsl && Number(hsl[2]) <= 100 && Number(hsl[3]) <= 100) return fromRgb(hslToRgb({ h: Number(hsl[1]), s: Number(hsl[2]), l: Number(hsl[3]) }));
  throw new Error(COLOR_ERROR);
}

export function convertColor(input: string) {
  const color = parseColor(input);
  return { hex: color.hex, rgb: `rgb(${color.r}, ${color.g}, ${color.b})`, hsl: `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)` };
}

function linearChannel(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(color: RgbColor): number {
  return 0.2126 * linearChannel(color.r) + 0.7152 * linearChannel(color.g) + 0.0722 * linearChannel(color.b);
}

export function contrastRatio(foreground: string, background: string): number {
  const first = luminance(parseColor(foreground));
  const second = luminance(parseColor(background));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function wcagGrade(ratio: number) {
  return {
    normal: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : '不通过',
    large: ratio >= 4.5 ? 'AAA' : ratio >= 3 ? 'AA' : '不通过',
  } as const;
}

export function generateHarmony(base: string, scheme: HarmonyScheme): string[] {
  const { h, s, l } = parseColor(base).hsl;
  const offsets: Record<HarmonyScheme, number[]> = {
    complementary: [0, 180], analogous: [0, 330, 30], triadic: [0, 120, 240], 'split-complementary': [0, 150, 210],
  };
  return offsets[scheme].map((offset) => rgbToHex(hslToRgb({ h: h + offset, s, l })));
}

function seedValue(seed: string): number {
  return [...seed].reduce((total, character) => total + character.charCodeAt(0), 0);
}

export function generatePalette(seed: string, count: number): string[] {
  const hash = seedValue(seed.trim() || 'delphi');
  return Array.from({ length: clamp(Math.floor(count), 1, 12) }, (_, index) => rgbToHex({
    r: (hash + index * 53) % 256,
    g: (hash * 3 + index * 97) % 256,
    b: (hash * 7 + index * 193) % 256,
  }));
}

export function extractPalette(imageData: ImagePixels, count: number): string[] {
  const frequencies = new Map<string, number>();
  for (let index = 0; index < imageData.data.length; index += 4) {
    if (imageData.data[index + 3] === 0) continue;
    const color = rgbToHex({ r: imageData.data[index], g: imageData.data[index + 1], b: imageData.data[index + 2] });
    frequencies.set(color, (frequencies.get(color) ?? 0) + 1);
  }
  return [...frequencies.entries()]
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
    .slice(0, clamp(Math.floor(count), 1, 12))
    .map(([color]) => color);
}

const VISION_MATRICES: Record<VisionMode, readonly [number, number, number][]> = {
  protanopia: [[0.56667, 0.43333, 0], [0.55833, 0.44167, 0], [0, 0.24167, 0.75833]],
  deuteranopia: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
  tritanopia: [[0.95, 0.05, 0], [0, 0.43333, 0.56667], [0, 0.475, 0.525]],
  achromatopsia: [[0.299, 0.587, 0.114], [0.299, 0.587, 0.114], [0.299, 0.587, 0.114]],
};

export function simulateColorVision(rgb: RgbColor, mode: VisionMode): RgbColor {
  const matrix = VISION_MATRICES[mode];
  const channels = [rgb.r, rgb.g, rgb.b];
  const transformed = matrix.map((row) => round(row[0] * channels[0] + row[1] * channels[1] + row[2] * channels[2]));
  return { r: clamp(transformed[0]), g: clamp(transformed[1]), b: clamp(transformed[2]) };
}

export function generateTailwindScale(base: string): Record<string, string> {
  const parsed = parseColor(base);
  const lightness = { 50: 97, 100: 93, 200: 86, 300: 76, 400: 65, 500: parsed.hsl.l, 600: 45, 700: 36, 800: 27, 900: 18, 950: 10 };
  return Object.fromEntries(Object.entries(lightness).map(([key, l]) => [key, key === '500' ? parsed.hex : rgbToHex(hslToRgb({ h: parsed.hsl.h, s: parsed.hsl.s, l }))]));
}

export function generateGradientCss(colors: string[], mode: GradientMode): string {
  const valid = colors.map((color) => parseColor(color).hex);
  if (valid.length < 2) throw new Error('请至少提供两种颜色');
  const stops = valid.map((color, index) => `${color} ${round((index / (valid.length - 1)) * 100)}%`).join(', ');
  if (mode === 'linear') return `linear-gradient(135deg, ${stops})`;
  if (mode === 'radial') return `radial-gradient(circle, ${stops})`;
  if (mode === 'corner') return valid.slice(0, 2).map((color, index) => `radial-gradient(circle at ${index === 0 ? 'top left' : 'bottom right'}, ${color} 0%, transparent 58%)`).join(', ');
  return valid.slice(0, 3).map((color, index) => `radial-gradient(circle at ${['20% 20%', '80% 20%', '50% 80%'][index]}, ${color} 0%, transparent 56%)`).join(', ');
}

export function samplePixel(imageData: ImagePixels, x: number, y: number): RgbColor & { hex: string } {
  const safeX = clamp(Math.floor(x), 0, Math.max(0, imageData.width - 1));
  const safeY = clamp(Math.floor(y), 0, Math.max(0, imageData.height - 1));
  const index = (safeY * imageData.width + safeX) * 4;
  const rgb = { r: imageData.data[index] ?? 0, g: imageData.data[index + 1] ?? 0, b: imageData.data[index + 2] ?? 0 };
  return { ...rgb, hex: rgbToHex(rgb) };
}
