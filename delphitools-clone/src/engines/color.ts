export type RgbColor = { r: number; g: number; b: number };
export type HslColor = { h: number; s: number; l: number };
export type ParsedColor = RgbColor & { hex: string; hsl: HslColor };
export type ColorConversionResult = {
  hex: string;
  rgb: string;
  decimalRgb: string;
  hsl: string;
  lab: string;
  lch: string;
  oklab: string;
  oklch: string;
};
export type ColorCoordinates = {
  lab: [number, number, number];
  lch: [number, number, number | null];
  oklab: [number, number, number];
  oklch: [number, number, number | null];
};
export type ImagePixels = { width: number; height: number; data: Uint8ClampedArray };
export type HarmonyScheme =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split-complementary'
  | 'tetradic'
  | 'square'
  | 'monochromatic'
  | 'shades'
  | 'tints'
  | 'tones'
  | 'double-split'
  | 'accented-analogous';
export type TailwindScaleMode = 'balanced' | 'vivid' | 'muted';
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

type Vector3 = [number, number, number];
type Matrix3 = readonly [Vector3, Vector3, Vector3];

const D50: Vector3 = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585];
const LINEAR_SRGB_TO_XYZ_D65: Matrix3 = [
  [506752 / 1228815, 87881 / 245763, 12673 / 70218],
  [87098 / 409605, 175762 / 245763, 12673 / 175545],
  [7918 / 409605, 87881 / 737289, 1001167 / 1053270],
];
const D65_TO_D50_BRADFORD: Matrix3 = [
  [1.0479297925449969, 0.022946870601609652, -0.05019226628920524],
  [0.02962780877005599, 0.9904344267538799, -0.017073799063418826],
  [-0.009243040646204504, 0.015055191490298152, 0.7518742814281371],
];
const XYZ_D65_TO_OKLAB_LMS: Matrix3 = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309],
];
const OKLAB_LMS_TO_OKLAB: Matrix3 = [
  [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
  [1.9779985324311684, -2.42859224204858, 0.450593709617411],
  [0.0259040424655478, 0.7827717124575296, -0.8086757549230774],
];

function multiplyMatrix(matrix: Matrix3, vector: Vector3): Vector3 {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
    matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2],
  ];
}

function formatNumber(value: number, decimals: number): string {
  const rounded = Math.abs(value) < 10 ** -(decimals + 1) ? 0 : Number(value.toFixed(decimals));
  return String(rounded);
}

function xyzD65FromRgb({ r, g, b }: RgbColor): Vector3 {
  return multiplyMatrix(LINEAR_SRGB_TO_XYZ_D65, [linearChannel(r), linearChannel(g), linearChannel(b)]);
}

function labFromXyzD50(xyz: Vector3): Vector3 {
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;
  const transform = (value: number, white: number) => {
    const normalized = value / white;
    return normalized > epsilon ? Math.cbrt(normalized) : (kappa * normalized + 16) / 116;
  };
  const f: Vector3 = [transform(xyz[0], D50[0]), transform(xyz[1], D50[1]), transform(xyz[2], D50[2])];
  return [116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])];
}

function oklabFromXyzD65(xyz: Vector3): Vector3 {
  const lms = multiplyMatrix(XYZ_D65_TO_OKLAB_LMS, xyz);
  return multiplyMatrix(OKLAB_LMS_TO_OKLAB, [Math.cbrt(lms[0]), Math.cbrt(lms[1]), Math.cbrt(lms[2])]);
}

export function rectangularToPolar(first: number, second: number, epsilon: number): { chroma: number; hue: number | null } {
  const chroma = Math.hypot(first, second);
  if (chroma <= epsilon) return { chroma, hue: null };
  return { chroma, hue: (Math.atan2(second, first) * 180 / Math.PI + 360) % 360 };
}

function polarFromLab([lightness, first, second]: Vector3, epsilon: number): [number, number, number | null] {
  const { chroma, hue } = rectangularToPolar(first, second, epsilon);
  return [lightness, chroma, hue];
}

export function convertColorCoordinates(input: string): ColorCoordinates {
  const color = parseColor(input);
  const xyzD65 = xyzD65FromRgb(color);
  const lab = labFromXyzD50(multiplyMatrix(D65_TO_D50_BRADFORD, xyzD65));
  const oklab = oklabFromXyzD65(xyzD65);
  return {
    lab,
    lch: polarFromLab(lab, 0.0015),
    oklab,
    oklch: polarFromLab(oklab, 0.000004),
  };
}

export function convertColor(input: string): ColorConversionResult {
  const color = parseColor(input);
  const { lab, lch, oklab, oklch } = convertColorCoordinates(input);
  const formatHue = (hue: number | null) => hue === null ? 'none' : formatNumber(hue, 2);

  return {
    hex: color.hex,
    rgb: `rgb(${color.r}, ${color.g}, ${color.b})`,
    decimalRgb: `rgb(${formatNumber(color.r / 255, 4)}, ${formatNumber(color.g / 255, 4)}, ${formatNumber(color.b / 255, 4)})`,
    hsl: `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`,
    lab: `lab(${formatNumber(lab[0], 2)}% ${formatNumber(lab[1], 2)} ${formatNumber(lab[2], 2)})`,
    lch: `lch(${formatNumber(lch[0], 2)}% ${formatNumber(lch[1], 2)} ${formatHue(lch[2])})`,
    oklab: `oklab(${formatNumber(oklab[0] * 100, 1)}% ${formatNumber(oklab[1], 3)} ${formatNumber(oklab[2], 3)})`,
    oklch: `oklch(${formatNumber(oklch[0] * 100, 1)}% ${formatNumber(oklch[1], 3)} ${formatHue(oklch[2])})`,
  };
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
  const offsets: Partial<Record<HarmonyScheme, number[]>> = {
    complementary: [0, 180],
    analogous: [0, 330, 30],
    triadic: [0, 120, 240],
    'split-complementary': [0, 150, 210],
    tetradic: [0, 60, 180, 240],
    square: [0, 90, 180, 270],
    'double-split': [0, 30, 150, 180, 210, 330],
    'accented-analogous': [0, 30, 60, 180],
  };
  const variations: Partial<Record<HarmonyScheme, ReadonlyArray<Pick<HslColor, 's' | 'l'>>>> = {
    monochromatic: [{ s: 100, l: 50 }, { s: 80, l: 50 }, { s: 60, l: 50 }, { s: 40, l: 50 }, { s: 20, l: 50 }],
    shades: [{ s: 85, l: 85 }, { s: 85, l: 65 }, { s: 85, l: 45 }, { s: 85, l: 25 }, { s: 85, l: 10 }],
    tints: [{ s: 85, l: 50 }, { s: 85, l: 65 }, { s: 85, l: 78 }, { s: 85, l: 88 }, { s: 85, l: 96 }],
    tones: [{ s: 90, l: 50 }, { s: 70, l: 50 }, { s: 50, l: 50 }, { s: 30, l: 50 }, { s: 10, l: 50 }],
  };
  if (variations[scheme]) return variations[scheme].map((variation) => rgbToHex(hslToRgb({ h, ...variation })));
  return (offsets[scheme] ?? []).map((offset) => rgbToHex(hslToRgb({ h: h + offset, s, l })));
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

const TAILWIND_LIGHTNESS = { 50: 97, 100: 93, 200: 86, 300: 76, 400: 65, 500: 50, 600: 45, 700: 36, 800: 27, 900: 18, 950: 10 } as const;

export function generateTailwindScale(base: string, mode: TailwindScaleMode = 'balanced'): Record<string, string> {
  const parsed = parseColor(base);
  const saturation = clamp(parsed.hsl.s + (mode === 'vivid' ? 12 : mode === 'muted' ? -24 : 0), 0, 100);
  return Object.fromEntries(Object.entries(TAILWIND_LIGHTNESS).map(([key, lightness]) => {
    if (key === '500' && mode === 'balanced') return [key, parsed.hex];
    return [key, rgbToHex(hslToRgb({ h: parsed.hsl.h, s: saturation, l: key === '500' ? parsed.hsl.l : lightness }))];
  }));
}

function normalizeTailwindName(name: string): string {
  const normalized = name.trim().normalize('NFKC').toLocaleLowerCase()
    .replace(/[\s_./\\]+/gu, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '');
  return normalized || 'color';
}

function orderedScale(scale: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(scale).sort(([first], [second]) => Number(first) - Number(second)));
}

export function formatTailwindCssVariables(name: string, scale: Record<string, string>): string {
  const safeName = normalizeTailwindName(name);
  return `:root {\n${Object.entries(orderedScale(scale)).map(([step, color]) => `  --${safeName}-${step}: ${color};`).join('\n')}\n}`;
}

export function formatTailwindConfig(name: string, scale: Record<string, string>): string {
  const colors = JSON.stringify({ [normalizeTailwindName(name)]: orderedScale(scale) }, null, 2);
  return `const colors = ${colors};\n\nexport default colors;`;
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
