export type ImageDataLike = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export type ResizeOptions = {
  width: number;
  height: number;
  fit: 'contain' | 'cover' | 'stretch';
};

export type NinePosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type WatermarkDrawOptions = {
  opacity: number;
  position: NinePosition;
  scale: number;
};

type CropRect = { x: number; y: number; width: number; height: number };

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${label}必须是大于 0 的整数`);
}

function assertImage(image: ImageDataLike, label = '图片'): void {
  assertPositiveInteger(image.width, `${label}宽度`);
  assertPositiveInteger(image.height, `${label}高度`);
  if (image.data.length !== image.width * image.height * 4) throw new Error(`${label}像素数据长度与尺寸不一致`);
}

function assertTargetSize(width: number, height: number): void {
  assertPositiveInteger(width, '宽度');
  assertPositiveInteger(height, '高度');
}

function blank(width: number, height: number): ImageDataLike {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

function writePixel(target: ImageDataLike, x: number, y: number, source: ImageDataLike, sourceX: number, sourceY: number): void {
  const from = (sourceY * source.width + sourceX) * 4;
  const to = (y * target.width + x) * 4;
  target.data.set(source.data.subarray(from, from + 4), to);
}

function drawScaled(target: ImageDataLike, source: ImageDataLike, destination: CropRect, sample: CropRect): void {
  for (let y = 0; y < destination.height; y += 1) {
    for (let x = 0; x < destination.width; x += 1) {
      const sourceX = Math.min(source.width - 1, Math.max(0, Math.floor(sample.x + ((x + 0.5) * sample.width) / destination.width)));
      const sourceY = Math.min(source.height - 1, Math.max(0, Math.floor(sample.y + ((y + 0.5) * sample.height) / destination.height)));
      writePixel(target, destination.x + x, destination.y + y, source, sourceX, sourceY);
    }
  }
}

export function resizeImage(source: ImageDataLike, options: ResizeOptions): ImageDataLike {
  assertImage(source);
  assertTargetSize(options.width, options.height);
  if (!['contain', 'cover', 'stretch'].includes(options.fit)) throw new Error('缩放方式必须是 contain、cover 或 stretch');
  const target = blank(options.width, options.height);
  if (options.fit === 'stretch') {
    drawScaled(target, source, { x: 0, y: 0, width: options.width, height: options.height }, { x: 0, y: 0, width: source.width, height: source.height });
    return target;
  }
  const scale = options.fit === 'contain'
    ? Math.min(options.width / source.width, options.height / source.height)
    : Math.max(options.width / source.width, options.height / source.height);
  const scaledWidth = Math.max(1, Math.round(source.width * scale));
  const scaledHeight = Math.max(1, Math.round(source.height * scale));
  if (options.fit === 'contain') {
    drawScaled(target, source, {
      x: Math.floor((options.width - scaledWidth) / 2),
      y: Math.floor((options.height - scaledHeight) / 2),
      width: scaledWidth,
      height: scaledHeight,
    }, { x: 0, y: 0, width: source.width, height: source.height });
    return target;
  }
  const intermediate = blank(scaledWidth, scaledHeight);
  drawScaled(intermediate, source, { x: 0, y: 0, width: scaledWidth, height: scaledHeight }, { x: 0, y: 0, width: source.width, height: source.height });
  const cropX = Math.ceil((scaledWidth - options.width) / 2);
  const cropY = Math.ceil((scaledHeight - options.height) / 2);
  for (let y = 0; y < options.height; y += 1) {
    for (let x = 0; x < options.width; x += 1) writePixel(target, x, y, intermediate, x + cropX, y + cropY);
  }
  return target;
}

export function cropImage(source: ImageDataLike, rect: CropRect): ImageDataLike {
  assertImage(source);
  if (!Number.isInteger(rect.x) || !Number.isInteger(rect.y)) throw new Error('裁切坐标必须是整数');
  assertPositiveInteger(rect.width, '裁切宽度');
  assertPositiveInteger(rect.height, '裁切高度');
  const left = Math.min(source.width, Math.max(0, rect.x));
  const top = Math.min(source.height, Math.max(0, rect.y));
  const right = Math.min(source.width, Math.max(left, rect.x + rect.width));
  const bottom = Math.min(source.height, Math.max(top, rect.y + rect.height));
  if (right === left || bottom === top) throw new Error('裁切区域没有与图片重叠');
  const target = blank(right - left, bottom - top);
  for (let y = 0; y < target.height; y += 1) {
    for (let x = 0; x < target.width; x += 1) writePixel(target, x, y, source, left + x, top + y);
  }
  return target;
}

export function rotateImage(source: ImageDataLike, degrees: 0 | 90 | 180 | 270): ImageDataLike {
  assertImage(source);
  if (![0, 90, 180, 270].includes(degrees)) throw new Error('旋转角度只能是 0、90、180 或 270');
  const target = degrees === 90 || degrees === 270 ? blank(source.height, source.width) : blank(source.width, source.height);
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const [targetX, targetY] = degrees === 0 ? [x, y]
        : degrees === 90 ? [source.height - 1 - y, x]
          : degrees === 180 ? [source.width - 1 - x, source.height - 1 - y]
            : [y, source.width - 1 - x];
      writePixel(target, targetX, targetY, source, x, y);
    }
  }
  return target;
}

export function splitImage(source: ImageDataLike, rows: number, columns: number): readonly ImageDataLike[] {
  assertImage(source);
  assertPositiveInteger(rows, '切分行数');
  assertPositiveInteger(columns, '切分列数');
  if (rows > source.height || columns > source.width) throw new Error('切分行列不能超过图片像素尺寸');
  if (rows > 20 || columns > 20 || rows * columns > 400) throw new Error('切分最多支持 20 行、20 列和 400 张图片');
  const parts: ImageDataLike[] = [];
  for (let row = 0; row < rows; row += 1) {
    const top = Math.floor((row * source.height) / rows);
    const bottom = Math.floor(((row + 1) * source.height) / rows);
    for (let column = 0; column < columns; column += 1) {
      const left = Math.floor((column * source.width) / columns);
      const right = Math.floor(((column + 1) * source.width) / columns);
      parts.push(cropImage(source, { x: left, y: top, width: right - left, height: bottom - top }));
    }
  }
  return parts;
}

export function stitchImages(images: readonly ImageDataLike[], direction: 'horizontal' | 'vertical', gap: number): ImageDataLike {
  if (images.length === 0) throw new Error('请至少选择一张图片');
  images.forEach((image) => assertImage(image));
  if (direction !== 'horizontal' && direction !== 'vertical') throw new Error('拼接方向无效');
  if (!Number.isInteger(gap) || gap < 0) throw new Error('图片间距必须是大于或等于 0 的整数');
  const width = direction === 'horizontal'
    ? images.reduce((total, image) => total + image.width, 0) + gap * (images.length - 1)
    : Math.max(...images.map((image) => image.width));
  const height = direction === 'vertical'
    ? images.reduce((total, image) => total + image.height, 0) + gap * (images.length - 1)
    : Math.max(...images.map((image) => image.height));
  const target = blank(width, height);
  let offset = 0;
  for (const image of images) {
    const x = direction === 'horizontal' ? offset : Math.floor((width - image.width) / 2);
    const y = direction === 'vertical' ? offset : Math.floor((height - image.height) / 2);
    for (let pixelY = 0; pixelY < image.height; pixelY += 1) {
      for (let pixelX = 0; pixelX < image.width; pixelX += 1) writePixel(target, x + pixelX, y + pixelY, image, pixelX, pixelY);
    }
    offset += (direction === 'horizontal' ? image.width : image.height) + gap;
  }
  return target;
}

function alphaComposite(background: number, backgroundAlpha: number, foreground: number, foregroundAlpha: number, outputAlpha: number): number {
  if (outputAlpha === 0) return 0;
  return Math.round(((foreground * foregroundAlpha) + (background * backgroundAlpha * (1 - foregroundAlpha))) / outputAlpha);
}

export function drawWatermark(source: ImageDataLike, mark: ImageDataLike, options: WatermarkDrawOptions): ImageDataLike {
  assertImage(source);
  assertImage(mark, '水印');
  if (!Number.isFinite(options.opacity) || options.opacity < 0 || options.opacity > 1) throw new Error('水印透明度必须在 0 到 1 之间');
  if (!Number.isFinite(options.scale) || options.scale <= 0) throw new Error('水印缩放比例必须大于 0');
  const positions: NinePosition[] = ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'];
  if (!positions.includes(options.position)) throw new Error('水印位置无效');
  const scaled = resizeImage(mark, { width: Math.max(1, Math.round(mark.width * options.scale)), height: Math.max(1, Math.round(mark.height * options.scale)), fit: 'stretch' });
  const vertical = options.position.startsWith('top') ? 0 : options.position.startsWith('bottom') ? source.height - scaled.height : Math.floor((source.height - scaled.height) / 2);
  const horizontal = options.position.endsWith('left') ? 0 : options.position.endsWith('right') ? source.width - scaled.width : Math.floor((source.width - scaled.width) / 2);
  const target = { width: source.width, height: source.height, data: new Uint8ClampedArray(source.data) };
  for (let y = 0; y < scaled.height; y += 1) {
    for (let x = 0; x < scaled.width; x += 1) {
      const targetX = horizontal + x;
      const targetY = vertical + y;
      if (targetX < 0 || targetY < 0 || targetX >= target.width || targetY >= target.height) continue;
      const from = (y * scaled.width + x) * 4;
      const to = (targetY * target.width + targetX) * 4;
      const markAlpha = (scaled.data[from + 3] / 255) * options.opacity;
      const sourceAlpha = target.data[to + 3] / 255;
      const outputAlpha = markAlpha + sourceAlpha * (1 - markAlpha);
      target.data[to] = alphaComposite(target.data[to], sourceAlpha, scaled.data[from], markAlpha, outputAlpha);
      target.data[to + 1] = alphaComposite(target.data[to + 1], sourceAlpha, scaled.data[from + 1], markAlpha, outputAlpha);
      target.data[to + 2] = alphaComposite(target.data[to + 2], sourceAlpha, scaled.data[from + 2], markAlpha, outputAlpha);
      target.data[to + 3] = Math.round(outputAlpha * 255);
    }
  }
  return target;
}
