export type Rect = { x: number; y: number; width: number; height: number };
export type Size = { width: number; height: number };
export type FitMode = 'contain' | 'cover';
export type StitchDirection = 'horizontal' | 'vertical';
export type PixelBuffer = Size & { data: ArrayLike<number> };

export type MatteLayout = {
  source: Rect;
  destination: Rect;
};

export type StitchResult = Size & {
  placements: Rect[];
};

export type WatermarkOptions = {
  mode: 'single' | 'tile';
  margin: number;
  gap: number;
  opacity: number;
  rotation: number;
  position?: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';
};

export type WatermarkPlacement = Rect & {
  bounds: Rect;
  centerX: number;
  centerY: number;
  opacity: number;
  rotation: number;
};

export type VerifiedImageFormat = {
  mime: 'image/png' | 'image/jpeg' | 'image/webp';
  extension: 'png' | 'jpg' | 'webp';
};

export type PlaceholderOptions = {
  width: number;
  height: number;
  text: string;
  background: string;
  foreground: string;
};

export type ImageFormatCapability = {
  label: string;
  mime: string;
  extension: string;
  enabled: boolean;
  reason: string;
};

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${label}必须是大于 0 的整数`);
}

function assertSize(width: number, height: number): void {
  assertPositiveInteger(width, '宽度');
  assertPositiveInteger(height, '高度');
}

function cleanNumber(value: number): number {
  return Object.is(value, -0) ? 0 : Number(value.toFixed(8));
}

export function fitMatte(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  mode: FitMode = 'contain',
): MatteLayout {
  assertSize(sourceWidth, sourceHeight);
  assertSize(targetWidth, targetHeight);
  if (mode !== 'contain' && mode !== 'cover') throw new Error('缩放方式必须是 contain 或 cover');

  if (mode === 'contain') {
    const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const width = cleanNumber(sourceWidth * scale);
    const height = cleanNumber(sourceHeight * scale);
    return {
      source: { x: 0, y: 0, width: sourceWidth, height: sourceHeight },
      destination: {
        x: cleanNumber((targetWidth - width) / 2),
        y: cleanNumber((targetHeight - height) / 2),
        width,
        height,
      },
    };
  }

  const targetRatio = targetWidth / targetHeight;
  const sourceRatio = sourceWidth / sourceHeight;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  if (sourceRatio > targetRatio) cropWidth = sourceHeight * targetRatio;
  else cropHeight = sourceWidth / targetRatio;
  return {
    source: {
      x: cleanNumber((sourceWidth - cropWidth) / 2),
      y: cleanNumber((sourceHeight - cropHeight) / 2),
      width: cleanNumber(cropWidth),
      height: cleanNumber(cropHeight),
    },
    destination: { x: 0, y: 0, width: targetWidth, height: targetHeight },
  };
}

function parseRatio(ratio: string): [number, number] {
  const match = /^\s*(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)\s*$/.exec(ratio);
  if (!match) throw new Error('请输入形如 4:5 的裁剪比例');
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('裁剪比例必须是两个大于 0 的数字');
  }
  return [width, height];
}

export function socialCropRect(width: number, height: number, ratio: string): Rect {
  assertSize(width, height);
  const [ratioWidth, ratioHeight] = parseRatio(ratio);
  const targetRatio = ratioWidth / ratioHeight;
  const sourceRatio = width / height;
  if (sourceRatio > targetRatio) {
    const cropWidth = Math.round(height * targetRatio);
    return { x: Math.floor((width - cropWidth) / 2), y: 0, width: cropWidth, height };
  }
  const cropHeight = Math.round(width / targetRatio);
  return { x: 0, y: Math.floor((height - cropHeight) / 2), width, height: cropHeight };
}

export function splitGrid(width: number, height: number, columns: number, rows: number): Rect[] {
  assertSize(width, height);
  assertPositiveInteger(columns, '分割列数');
  assertPositiveInteger(rows, '分割行数');
  if (columns > 20 || rows > 20) throw new Error('分割行列每边最多 20，总输出最多 400 张');
  if (columns * rows > 400) throw new Error('分割总输出最多 400 张');
  if (columns > width || rows > height) throw new Error('分割行列不能超过图片像素尺寸');

  const regions: Rect[] = [];
  for (let row = 0; row < rows; row += 1) {
    const top = Math.floor((row * height) / rows);
    const bottom = Math.floor(((row + 1) * height) / rows);
    for (let column = 0; column < columns; column += 1) {
      const left = Math.floor((column * width) / columns);
      const right = Math.floor(((column + 1) * width) / columns);
      regions.push({ x: left, y: top, width: right - left, height: bottom - top });
    }
  }
  return regions;
}

export function seamlessSlices(width: number, height: number, sliceHeight: number): Rect[] {
  assertSize(width, height);
  assertPositiveInteger(sliceHeight, '单片高度');
  const slices: Rect[] = [];
  for (let y = 0; y < height; y += sliceHeight) {
    slices.push({ x: 0, y, width, height: Math.min(sliceHeight, height - y) });
  }
  return slices;
}

export function stitchLayout(images: readonly Size[], direction: StitchDirection, gap = 0): StitchResult {
  if (images.length === 0) throw new Error('请至少选择一张图片');
  if (direction !== 'horizontal' && direction !== 'vertical') throw new Error('拼接方向无效');
  if (!Number.isInteger(gap) || gap < 0) throw new Error('图片间距必须是大于或等于 0 的整数');
  images.forEach((image) => assertSize(image.width, image.height));

  if (direction === 'horizontal') {
    const height = Math.max(...images.map((image) => image.height));
    let x = 0;
    const placements = images.map((image) => {
      const placement = { x, y: Math.floor((height - image.height) / 2), ...image };
      x += image.width + gap;
      return placement;
    });
    return { width: x - gap, height, placements };
  }

  const width = Math.max(...images.map((image) => image.width));
  let y = 0;
  const placements = images.map((image) => {
    const placement = { x: Math.floor((width - image.width) / 2), y, ...image };
    y += image.height + gap;
    return placement;
  });
  return { width, height: y - gap, placements };
}

export function transparentBounds(pixels: PixelBuffer): Rect | null {
  assertSize(pixels.width, pixels.height);
  if (pixels.data.length !== pixels.width * pixels.height * 4) throw new Error('像素数据长度与图片尺寸不一致');
  let minX = pixels.width;
  let minY = pixels.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < pixels.height; y += 1) {
    for (let x = 0; x < pixels.width; x += 1) {
      if (Number(pixels.data[(y * pixels.width + x) * 4 + 3]) <= 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function singleWatermarkPosition(
  canvasWidth: number,
  canvasHeight: number,
  boundsWidth: number,
  boundsHeight: number,
  margin: number,
  position: NonNullable<WatermarkOptions['position']>,
): Rect {
  const positions: Record<NonNullable<WatermarkOptions['position']>, [number, number]> = {
    'top-left': [margin, margin],
    'top-right': [canvasWidth - boundsWidth - margin, margin],
    center: [(canvasWidth - boundsWidth) / 2, (canvasHeight - boundsHeight) / 2],
    'bottom-left': [margin, canvasHeight - boundsHeight - margin],
    'bottom-right': [canvasWidth - boundsWidth - margin, canvasHeight - boundsHeight - margin],
  };
  const [x, y] = positions[position];
  return { x: cleanNumber(x), y: cleanNumber(y), width: boundsWidth, height: boundsHeight };
}

function rotatedBoundingSize(width: number, height: number, rotation: number): Size {
  const radians = (rotation * Math.PI) / 180;
  const cosine = Math.abs(Math.cos(radians));
  const sine = Math.abs(Math.sin(radians));
  return {
    width: cleanNumber(width * cosine + height * sine),
    height: cleanNumber(width * sine + height * cosine),
  };
}

export function watermarkLayout(
  canvasWidth: number,
  canvasHeight: number,
  markWidth: number,
  markHeight: number,
  options: WatermarkOptions,
): WatermarkPlacement[] {
  assertSize(canvasWidth, canvasHeight);
  assertSize(markWidth, markHeight);
  if (!Number.isFinite(options.opacity) || options.opacity < 0 || options.opacity > 1) throw new Error('水印透明度必须在 0 到 1 之间');
  if (!Number.isFinite(options.rotation) || options.rotation < -180 || options.rotation > 180) throw new Error('水印旋转角度必须在 -180 到 180 度之间');
  if (!Number.isFinite(options.margin) || options.margin < 0) throw new Error('水印边距不能小于 0');
  if (!Number.isFinite(options.gap) || options.gap < 0) throw new Error('水印间距不能小于 0');
  const rotated = rotatedBoundingSize(markWidth, markHeight, options.rotation);
  if (rotated.width + options.margin * 2 > canvasWidth || rotated.height + options.margin * 2 > canvasHeight) throw new Error('旋转后的水印尺寸和边距超出图片范围');
  const decorate = (bounds: Rect): WatermarkPlacement => {
    const centerX = cleanNumber(bounds.x + bounds.width / 2);
    const centerY = cleanNumber(bounds.y + bounds.height / 2);
    return {
      x: cleanNumber(centerX - markWidth / 2),
      y: cleanNumber(centerY - markHeight / 2),
      width: markWidth,
      height: markHeight,
      bounds,
      centerX,
      centerY,
      opacity: options.opacity,
      rotation: options.rotation,
    };
  };

  if (options.mode === 'single') {
    return [decorate(singleWatermarkPosition(canvasWidth, canvasHeight, rotated.width, rotated.height, options.margin, options.position ?? 'bottom-right'))];
  }
  if (options.mode !== 'tile') throw new Error('水印布局模式无效');

  const placements: WatermarkPlacement[] = [];
  const maxX = canvasWidth - rotated.width - options.margin;
  const maxY = canvasHeight - rotated.height - options.margin;
  const stepX = rotated.width + options.gap;
  const stepY = rotated.height + options.gap;
  for (let y = options.margin; y <= maxY; y += stepY) {
    for (let x = options.margin; x <= maxX; x += stepX) {
      placements.push(decorate({ x: cleanNumber(x), y: cleanNumber(y), width: rotated.width, height: rotated.height }));
    }
  }
  return placements;
}

export function faviconSizes(sizes: readonly number[] = [16, 32, 48, 64, 180, 192, 512]): number[] {
  if (sizes.length === 0) throw new Error('请至少提供一个图标尺寸');
  if (sizes.some((size) => !Number.isInteger(size) || size < 1 || size > 512)) throw new Error('图标尺寸必须是 1 到 512 之间的整数');
  return [...new Set(sizes)].sort((a, b) => a - b);
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function assertSvgColor(value: string): void {
  if (!/^#[\da-f]{3,8}$/i.test(value)) throw new Error('占位图颜色必须使用 HEX 格式');
}

export function createPlaceholderSvg(options: PlaceholderOptions): string {
  assertSize(options.width, options.height);
  assertSvgColor(options.background);
  assertSvgColor(options.foreground);
  const fontSize = Math.max(12, Math.round(Math.min(options.width, options.height) / 8));
  const text = escapeXml(options.text || `${options.width} × ${options.height}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}" role="img" aria-label="${text}"><rect width="100%" height="100%" fill="${options.background}"/><text x="50%" y="50%" fill="${options.foreground}" font-family="system-ui,sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`;
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToBase64(bytes: Uint8Array): string {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const combined = (first << 16) | ((second ?? 0) << 8) | (third ?? 0);
    output += BASE64_ALPHABET[(combined >> 18) & 63];
    output += BASE64_ALPHABET[(combined >> 12) & 63];
    output += second === undefined ? '=' : BASE64_ALPHABET[(combined >> 6) & 63];
    output += third === undefined ? '=' : BASE64_ALPHABET[combined & 63];
  }
  return output;
}

function base64ToBytes(value: string): Uint8Array {
  if (!value || value.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error('图片 Base64 内容无效');
  }
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const output = new Uint8Array((value.length / 4) * 3 - padding);
  let target = 0;
  for (let index = 0; index < value.length; index += 4) {
    const a = BASE64_ALPHABET.indexOf(value[index]);
    const b = BASE64_ALPHABET.indexOf(value[index + 1]);
    const c = value[index + 2] === '=' ? 0 : BASE64_ALPHABET.indexOf(value[index + 2]);
    const d = value[index + 3] === '=' ? 0 : BASE64_ALPHABET.indexOf(value[index + 3]);
    const combined = (a << 18) | (b << 12) | (c << 6) | d;
    if (target < output.length) output[target++] = (combined >> 16) & 255;
    if (target < output.length) output[target++] = (combined >> 8) & 255;
    if (target < output.length) output[target++] = combined & 255;
  }
  return output;
}

function assertImageMime(mime: string): void {
  if (!/^image\/[a-z0-9.+-]+$/i.test(mime)) throw new Error('Data URL 必须包含图片 MIME 类型');
}

function hasBytes(bytes: Uint8Array, offset: number, expected: readonly number[]): boolean {
  return expected.every((value, index) => bytes[offset + index] === value);
}

export function detectImageFormat(bytes: Uint8Array): VerifiedImageFormat {
  if (hasBytes(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: 'image/png', extension: 'png' };
  }
  if (hasBytes(bytes, 0, [0xff, 0xd8, 0xff])) {
    return { mime: 'image/jpeg', extension: 'jpg' };
  }
  if (hasBytes(bytes, 0, [0x52, 0x49, 0x46, 0x46]) && hasBytes(bytes, 8, [0x57, 0x45, 0x42, 0x50])) {
    return { mime: 'image/webp', extension: 'webp' };
  }
  throw new Error('内容不是有效的 PNG、JPEG 或 WebP 图片');
}

export function encodeImageBase64(bytes: Uint8Array, mime: string): string {
  assertImageMime(mime);
  if (bytes.length === 0) throw new Error('图片内容不能为空');
  return `data:${mime.toLowerCase()};base64,${bytesToBase64(bytes)}`;
}

export function decodeImageBase64(dataUrl: string): VerifiedImageFormat & { bytes: Uint8Array } {
  if (!dataUrl.trim()) throw new Error('请输入图片 Data URL');
  const match = /^data:([^;,]+);base64,([^\s]+)$/i.exec(dataUrl.trim());
  if (!match) throw new Error('图片 Data URL 格式无效');
  assertImageMime(match[1]);
  const declaredMime = match[1].toLowerCase();
  const bytes = base64ToBytes(match[2]);
  const detected = detectImageFormat(bytes);
  if (declaredMime !== detected.mime) throw new Error(`声明的 MIME 与图片内容不一致：内容实际为 ${detected.mime}`);
  return { ...detected, bytes };
}

function browserCanvasCanEncode(mime: string): boolean {
  if (typeof document === 'undefined') return false;
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) return mime === 'image/png' || mime === 'image/jpeg';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL(mime).startsWith(`data:${mime}`);
  } catch {
    return false;
  }
}

const OUTPUT_FORMATS = [
  { label: 'PNG', mime: 'image/png', extension: 'png', canvas: true },
  { label: 'JPEG', mime: 'image/jpeg', extension: 'jpg', canvas: true },
  { label: 'WebP', mime: 'image/webp', extension: 'webp', canvas: true },
  { label: 'GIF', mime: 'image/gif', extension: 'gif', canvas: false },
  { label: 'BMP', mime: 'image/bmp', extension: 'bmp', canvas: false },
  { label: 'TIFF', mime: 'image/tiff', extension: 'tiff', canvas: false },
  { label: 'ICO', mime: 'image/x-icon', extension: 'ico', canvas: false },
] as const;

export function getImageFormatCapabilities(probe: (mime: string) => boolean = browserCanvasCanEncode): ImageFormatCapability[] {
  return OUTPUT_FORMATS.map((format) => {
    const enabled = format.canvas && probe(format.mime);
    return {
      label: format.label,
      mime: format.mime,
      extension: format.extension,
      enabled,
      reason: enabled
        ? '当前浏览器可通过 Canvas 真实编码'
        : format.canvas
          ? '当前浏览器未通过该格式的真实编码探测'
          : `浏览器 Canvas 无法可靠编码 ${format.label}，已禁用以避免伪造文件`,
    };
  });
}
