export type RasterData = { width: number; height: number; data: Uint8ClampedArray };
export type TraceOptions = { threshold: number; smoothing: number; mode: 'monochrome' | 'color'; maxColors: number };
export type BackgroundOptions = { threshold: number; feather: number };

function round(value: number, digits = 3): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function assertRaster(raster: RasterData): void {
  if (!Number.isInteger(raster.width) || !Number.isInteger(raster.height) || raster.width <= 0 || raster.height <= 0) throw new Error('图片尺寸无效');
  if (raster.width * raster.height > 20_000_000) throw new Error('图片像素过多，请缩小后重试');
  if (raster.data.length !== raster.width * raster.height * 4) throw new Error('图片像素数据不完整');
}

function abortIfNeeded(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error('处理已取消');
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hex(value: number): string {
  return clampByte(value).toString(16).padStart(2, '0');
}

type PaletteColor = { red: number; green: number; blue: number; count: number; order: number };

function buildPalette(raster: RasterData, maximum: number): PaletteColor[] {
  const histogram = new Map<string, PaletteColor>();
  let order = 0;
  for (let offset = 0; offset < raster.data.length; offset += 4) {
    if (raster.data[offset + 3] === 0) continue;
    const red = raster.data[offset];
    const green = raster.data[offset + 1];
    const blue = raster.data[offset + 2];
    const key = `${red},${green},${blue}`;
    const current = histogram.get(key);
    if (current) current.count += 1;
    else histogram.set(key, { red, green, blue, count: 1, order: order++ });
  }
  const colors = [...histogram.values()];
  if (colors.length <= maximum) return colors;

  const palette: PaletteColor[] = [colors.slice().sort((a, b) => b.count - a.count || a.order - b.order)[0]];
  while (palette.length < maximum) {
    let best: PaletteColor | undefined;
    let bestScore = -1;
    for (const color of colors) {
      if (palette.includes(color)) continue;
      const distance = Math.min(...palette.map((candidate) => (
        (color.red - candidate.red) ** 2 + (color.green - candidate.green) ** 2 + (color.blue - candidate.blue) ** 2
      )));
      const score = distance * Math.max(1, color.count);
      if (score > bestScore || (score === bestScore && color.order < (best?.order ?? Number.POSITIVE_INFINITY))) {
        best = color;
        bestScore = score;
      }
    }
    if (!best) break;
    palette.push(best);
  }
  return palette;
}

function nearestColor(red: number, green: number, blue: number, palette: PaletteColor[]): PaletteColor {
  return palette.reduce((best, color) => {
    const bestDistance = (red - best.red) ** 2 + (green - best.green) ** 2 + (blue - best.blue) ** 2;
    const distance = (red - color.red) ** 2 + (green - color.green) ** 2 + (blue - color.blue) ** 2;
    return distance < bestDistance ? color : best;
  });
}

function roundedRunPath(start: number, y: number, end: number, smoothing: number): string {
  if (smoothing <= 0) return `M${start} ${y}H${end}V${y + 1}H${start}Z`;
  const radius = round(Math.min(0.45, (end - start) / 2, smoothing / 100 * 0.45));
  const right = round(end - radius);
  const left = round(start + radius);
  const bottom = y + 1;
  return `M${left} ${y}H${right}Q${end} ${y} ${end} ${round(y + radius)}V${round(bottom - radius)}Q${end} ${bottom} ${right} ${bottom}H${left}Q${start} ${bottom} ${start} ${round(bottom - radius)}V${round(y + radius)}Q${start} ${y} ${left} ${y}Z`;
}

export function traceImage(raster: RasterData, options: TraceOptions, signal?: AbortSignal): string {
  assertRaster(raster);
  abortIfNeeded(signal);
  if (options.mode === 'monochrome' && (!Number.isFinite(options.threshold) || options.threshold < 0 || options.threshold > 255)) throw new Error('阈值必须在 0 到 255 之间');
  if (!Number.isFinite(options.smoothing) || options.smoothing < 0 || options.smoothing > 100) throw new Error('平滑度必须在 0 到 100 之间');
  if (!Number.isInteger(options.maxColors) || options.maxColors < 2 || options.maxColors > 16) throw new Error('颜色数量必须在 2 到 16 之间');
  const groups = new Map<string, string[]>();
  const palette = options.mode === 'color' ? buildPalette(raster, options.maxColors) : [];
  const pixelFill = (offset: number): string => {
    const alpha = raster.data[offset + 3];
    if (alpha === 0) return '';
    if (options.mode === 'monochrome') {
      const luminance = raster.data[offset] * 0.2126 + raster.data[offset + 1] * 0.7152 + raster.data[offset + 2] * 0.0722;
      return luminance < options.threshold ? '#000000' : '';
    }
    if (palette.length === 0) return '';
    const color = nearestColor(raster.data[offset], raster.data[offset + 1], raster.data[offset + 2], palette);
    return `#${hex(color.red)}${hex(color.green)}${hex(color.blue)}`;
  };

  for (let y = 0; y < raster.height; y += 1) {
    abortIfNeeded(signal);
    let x = 0;
    while (x < raster.width) {
      const fill = pixelFill((y * raster.width + x) * 4);
      if (!fill) { x += 1; continue; }
      let end = x + 1;
      while (end < raster.width && pixelFill((y * raster.width + end) * 4) === fill) end += 1;
      const paths = groups.get(fill) ?? [];
      paths.push(roundedRunPath(x, y, end, options.smoothing));
      groups.set(fill, paths);
      x = end;
    }
  }
  const shapeMarkup = [...groups.entries()].map(([fill, paths]) => `<path fill="${fill}" d="${paths.join('')}"/>`).join('');
  if (!shapeMarkup) throw new Error('当前参数没有追踪到可见图形，请调整阈值后重试');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${raster.width} ${raster.height}" shape-rendering="${options.smoothing > 50 ? 'geometricPrecision' : 'crispEdges'}">${shapeMarkup}</svg>`;
}

export function removeBackground(raster: RasterData, options: BackgroundOptions, onProgress?: (progress: number) => void, signal?: AbortSignal): RasterData {
  assertRaster(raster);
  abortIfNeeded(signal);
  if (!Number.isFinite(options.threshold) || options.threshold < 0 || options.threshold > 441) throw new Error('背景阈值必须在 0 到 441 之间');
  if (!Number.isFinite(options.feather) || options.feather < 0 || options.feather > 255) throw new Error('羽化必须在 0 到 255 之间');

  const pixelCount = raster.width * raster.height;
  const corners = [0, raster.width - 1, (raster.height - 1) * raster.width, pixelCount - 1];
  const background = [0, 1, 2].map((channel) => corners.reduce((sum, pixel) => sum + raster.data[pixel * 4 + channel], 0) / corners.length);
  const output = new Uint8ClampedArray(raster.data);
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;
  const distanceAt = (pixel: number) => {
    const offset = pixel * 4;
    return Math.hypot(raster.data[offset] - background[0], raster.data[offset + 1] - background[1], raster.data[offset + 2] - background[2]);
  };
  const limit = options.threshold + options.feather;
  const enqueue = (pixel: number) => {
    if (visited[pixel] || distanceAt(pixel) > limit) return;
    visited[pixel] = 1;
    queue[tail++] = pixel;
  };

  for (let x = 0; x < raster.width; x += 1) {
    enqueue(x);
    enqueue((raster.height - 1) * raster.width + x);
  }
  for (let y = 1; y < raster.height - 1; y += 1) {
    enqueue(y * raster.width);
    enqueue(y * raster.width + raster.width - 1);
  }

  while (head < tail) {
    if ((head & 4095) === 0) abortIfNeeded(signal);
    const pixel = queue[head++];
    const x = pixel % raster.width;
    const y = Math.floor(pixel / raster.width);
    const distance = distanceAt(pixel);
    const factor = distance <= options.threshold || options.feather === 0 ? 0 : Math.min(1, (distance - options.threshold) / options.feather);
    output[pixel * 4 + 3] = clampByte(output[pixel * 4 + 3] * factor);
    if (x > 0) enqueue(pixel - 1);
    if (x + 1 < raster.width) enqueue(pixel + 1);
    if (y > 0) enqueue(pixel - raster.width);
    if (y + 1 < raster.height) enqueue(pixel + raster.width);
  }
  onProgress?.(100);
  return { width: raster.width, height: raster.height, data: output };
}
