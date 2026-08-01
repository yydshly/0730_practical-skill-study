import { degrees, PDFDocument, type PDFEmbeddedPage, type PDFPage } from 'pdf-lib';

export type PaperName = 'A3' | 'A4' | 'A5' | 'Letter';
export type PageOrientation = 'portrait' | 'landscape';

export type NUpOptions = {
  paper: PaperName;
  orientation: PageOrientation;
  columns: number;
  rows: number;
  margin: number;
  gap: number;
};

export type NUpPlacement = { x: number; y: number; width: number; height: number };
export type NUpResult = { sheet: { width: number; height: number }; placements: NUpPlacement[] };

export type PdfPreflightResult = {
  pageCount: number;
  pages: Array<{ number: number; width: number; height: number; orientation: PageOrientation }>;
  metadata: { title: string; author: string; subject: string; creator: string; producer: string };
  warnings: string[];
};

export type ImposeOptions = NUpOptions & {
  mode: 'nup' | 'booklet';
  duplex: 'single' | 'double';
  flip: 'long-edge' | 'short-edge';
};

export type RasterData = { width: number; height: number; data: Uint8ClampedArray };
export type TraceOptions = { threshold: number; smoothing: number; mode: 'monochrome' | 'color'; maxColors: number };
export type BackgroundOptions = { threshold: number; feather: number };

const PAPER_SIZES: Record<PaperName, readonly [number, number]> = {
  A3: [841.89, 1190.55],
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
  Letter: [612, 792],
};

function round(value: number, digits = 3): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function assertPositiveInteger(value: number, label: string, maximum = 16): void {
  if (!Number.isInteger(value) || value < 1 || value > maximum) throw new Error(`${label}必须是 1 到 ${maximum} 的整数`);
}

export function bookletOrder(pageCount: number): Array<Array<number | null>> {
  if (!Number.isInteger(pageCount) || pageCount < 1) throw new Error('PDF 页数必须是正整数');
  const padded = Math.ceil(pageCount / 4) * 4;
  const pageOrBlank = (page: number) => page <= pageCount ? page : null;
  const sheets: Array<Array<number | null>> = [];
  for (let sheet = 0; sheet < padded / 4; sheet += 1) {
    sheets.push([
      pageOrBlank(padded - sheet * 2),
      pageOrBlank(1 + sheet * 2),
      pageOrBlank(2 + sheet * 2),
      pageOrBlank(padded - 1 - sheet * 2),
    ]);
  }
  return sheets;
}

export function zineEightPageOrder(): number[] {
  return [8, 1, 2, 7, 6, 3, 4, 5];
}

export function nUpLayout(options: NUpOptions): NUpResult {
  assertPositiveInteger(options.columns, '列数', 8);
  assertPositiveInteger(options.rows, '行数', 8);
  if (!Number.isFinite(options.margin) || options.margin < 0) throw new Error('边距不能为负数');
  if (!Number.isFinite(options.gap) || options.gap < 0) throw new Error('间距不能为负数');
  const base = PAPER_SIZES[options.paper];
  if (!base) throw new Error('不支持所选纸张尺寸');
  const [portraitWidth, portraitHeight] = base;
  const width = options.orientation === 'landscape' ? portraitHeight : portraitWidth;
  const height = options.orientation === 'landscape' ? portraitWidth : portraitHeight;
  const availableWidth = width - options.margin * 2 - options.gap * (options.columns - 1);
  const availableHeight = height - options.margin * 2 - options.gap * (options.rows - 1);
  if (availableWidth <= 0 || availableHeight <= 0) throw new Error('边距和间距超过纸张可用范围');
  const cellWidth = availableWidth / options.columns;
  const cellHeight = availableHeight / options.rows;
  const placements: NUpPlacement[] = [];
  for (let row = 0; row < options.rows; row += 1) {
    for (let column = 0; column < options.columns; column += 1) {
      placements.push({
        x: round(options.margin + column * (cellWidth + options.gap)),
        y: round(options.margin + (options.rows - row - 1) * (cellHeight + options.gap)),
        width: round(cellWidth),
        height: round(cellHeight),
      });
    }
  }
  return { sheet: { width: round(width), height: round(height) }, placements };
}

function hasPdfHeader(bytes: Uint8Array): boolean {
  const head = new TextDecoder('latin1').decode(bytes.slice(0, Math.min(bytes.length, 1024)));
  return head.includes('%PDF-');
}

function appearsEncrypted(bytes: Uint8Array): boolean {
  const source = new TextDecoder('latin1').decode(bytes);
  return /\/Encrypt\b/.test(source);
}

async function loadPdf(bytes: Uint8Array): Promise<PDFDocument> {
  if (!hasPdfHeader(bytes)) throw new Error('不是有效的 PDF 文件');
  if (appearsEncrypted(bytes)) throw new Error('暂不支持加密 PDF，请先解除密码后重试');
  try {
    const document = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
    if (document.isEncrypted) throw new Error('暂不支持加密 PDF，请先解除密码后重试');
    if (document.getPageCount() === 0) throw new Error('PDF 不包含可处理的页面');
    return document;
  } catch (reason) {
    if (reason instanceof Error && /加密|不包含可处理/.test(reason.message)) throw reason;
    throw new Error('不是有效的 PDF 文件，请确认文件完整后重试');
  }
}

function metadataText(value: string | undefined): string {
  return value?.trim() ?? '';
}

export async function preflightPdf(bytes: Uint8Array): Promise<PdfPreflightResult> {
  const document = await loadPdf(bytes);
  const pages = document.getPages().map((page, index) => {
    const { width, height } = page.getSize();
    return {
      number: index + 1,
      width: round(width, 2),
      height: round(height, 2),
      orientation: (width > height ? 'landscape' : 'portrait') as PageOrientation,
    };
  });
  const signatures = new Set(pages.map((page) => `${page.width}x${page.height}:${page.orientation}`));
  const warnings: string[] = [];
  if (signatures.size > 1) warnings.push('页面尺寸或方向不一致，请在印刷前确认');
  if (!document.getTitle()) warnings.push('PDF 未设置标题元数据');
  return {
    pageCount: pages.length,
    pages,
    metadata: {
      title: metadataText(document.getTitle()),
      author: metadataText(document.getAuthor()),
      subject: metadataText(document.getSubject()),
      creator: metadataText(document.getCreator()),
      producer: metadataText(document.getProducer()),
    },
    warnings,
  };
}

function drawEmbedded(target: PDFPage, embedded: PDFEmbeddedPage | undefined, placement: NUpPlacement, rotate = false): void {
  if (!embedded) return;
  const scale = Math.min(placement.width / embedded.width, placement.height / embedded.height);
  const width = embedded.width * scale;
  const height = embedded.height * scale;
  const x = placement.x + (placement.width - width) / 2;
  const y = placement.y + (placement.height - height) / 2;
  if (rotate) {
    target.drawPage(embedded, { x: x + width, y: y + height, width, height, rotate: degrees(180) });
  } else {
    target.drawPage(embedded, { x, y, width, height });
  }
}

async function embeddedPages(output: PDFDocument, source: PDFDocument): Promise<PDFEmbeddedPage[]> {
  source.getPages().forEach((page) => {
    if (!page.node.Contents()) page.drawRectangle({ x: 0, y: 0, width: 0.01, height: 0.01, opacity: 0 });
  });
  return output.embedPdf(source, source.getPageIndices());
}

export async function imposePdf(bytes: Uint8Array, options: ImposeOptions): Promise<Uint8Array> {
  const source = await loadPdf(bytes);
  const output = await PDFDocument.create();
  const embedded = await embeddedPages(output, source);
  if (options.mode === 'booklet') {
    const layout = nUpLayout({ ...options, columns: 2, rows: 1 });
    bookletOrder(source.getPageCount()).forEach((sheet) => {
      const front = output.addPage([layout.sheet.width, layout.sheet.height]);
      drawEmbedded(front, sheet[0] ? embedded[sheet[0] - 1] : undefined, layout.placements[0]);
      drawEmbedded(front, sheet[1] ? embedded[sheet[1] - 1] : undefined, layout.placements[1]);
      const back = output.addPage([layout.sheet.width, layout.sheet.height]);
      const backOrder = options.flip === 'short-edge' ? [sheet[3], sheet[2]] : [sheet[2], sheet[3]];
      drawEmbedded(back, backOrder[0] ? embedded[backOrder[0] - 1] : undefined, layout.placements[0]);
      drawEmbedded(back, backOrder[1] ? embedded[backOrder[1] - 1] : undefined, layout.placements[1]);
    });
  } else {
    const layout = nUpLayout(options);
    const perSheet = layout.placements.length;
    for (let start = 0; start < embedded.length; start += perSheet) {
      const page = output.addPage([layout.sheet.width, layout.sheet.height]);
      embedded.slice(start, start + perSheet).forEach((sourcePage, index) => drawEmbedded(page, sourcePage, layout.placements[index]));
    }
  }
  output.setTitle(options.mode === 'booklet' ? '本地小册子拼版' : '本地 N-up 拼版');
  output.setProducer('DelphiTools 本地 PDF 拼版');
  return output.save();
}

export async function createZinePdf(bytes: Uint8Array, options: Pick<NUpOptions, 'paper' | 'orientation' | 'margin' | 'gap'>): Promise<Uint8Array> {
  const source = await loadPdf(bytes);
  if (source.getPageCount() !== 8) throw new Error('Zine 拼版必须恰好包含 8 页');
  const output = await PDFDocument.create();
  const embedded = await embeddedPages(output, source);
  const layout = nUpLayout({ ...options, columns: 4, rows: 2 });
  const page = output.addPage([layout.sheet.width, layout.sheet.height]);
  zineEightPageOrder().forEach((pageNumber, index) => drawEmbedded(page, embedded[pageNumber - 1], layout.placements[index], index < 4));
  output.setTitle('8 页 Mini-Zine 本地拼版');
  output.setProducer('DelphiTools 本地 Zine 拼版');
  return output.save();
}

function utf8Size(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function sanitizeAttribute(match: string, name: string, quote: string, value: string): string {
  const lowerName = name.toLowerCase();
  const normalizedValue = value.trim().toLowerCase();
  if (lowerName.startsWith('on')) return '';
  if (lowerName === 'src') return '';
  if (lowerName === 'href' || lowerName === 'xlink:href') return normalizedValue.startsWith('#') ? ` ${name}=${quote}${value}${quote}` : '';
  if ((lowerName === 'style' || lowerName === 'fill' || lowerName === 'stroke' || lowerName === 'filter' || lowerName === 'clip-path' || lowerName === 'mask')
    && /(?:javascript:|data:|https?:|\/\/|url\((?!\s*#))/i.test(value)) return '';
  return match;
}

export function optimiseSvg(source: string): { svg: string; beforeBytes: number; afterBytes: number; removedUnsafe: boolean } {
  const input = source.trim();
  if (!input) throw new Error('SVG 内容不能为空');
  if (/<!DOCTYPE|<!ENTITY/i.test(input)) throw new Error('不允许 XML 外部实体或文档类型声明');
  if (!/<svg\b/i.test(input) || !/<\/svg\s*>/i.test(input)) throw new Error('不是有效的 SVG 文件');
  let svg = input;
  const unsafePattern = /<script\b|<foreignObject\b|\son[a-z]+\s*=|(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|javascript:|data:)/i;
  const removedUnsafe = unsafePattern.test(svg);
  svg = svg
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<metadata\b[\s\S]*?<\/metadata\s*>/gi, '')
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script\b[^>]*\/>/gi, '')
    .replace(/<foreignObject\b[\s\S]*?<\/foreignObject\s*>/gi, '')
    .replace(/\s([:\w-]+)\s*=\s*(["'])([\s\S]*?)\2/g, sanitizeAttribute)
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!/\sxmlns=/.test(svg)) svg = svg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  return { svg, beforeBytes: utf8Size(source), afterBytes: utf8Size(svg), removedUnsafe };
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

export function traceImage(raster: RasterData, options: TraceOptions, signal?: AbortSignal): string {
  assertRaster(raster);
  abortIfNeeded(signal);
  if (!Number.isFinite(options.threshold) || options.threshold < 0 || options.threshold > 255) throw new Error('阈值必须在 0 到 255 之间');
  if (!Number.isFinite(options.smoothing) || options.smoothing < 0 || options.smoothing > 100) throw new Error('平滑度必须在 0 到 100 之间');
  if (!Number.isInteger(options.maxColors) || options.maxColors < 2 || options.maxColors > 16) throw new Error('颜色数量必须在 2 到 16 之间');
  const groups = new Map<string, string[]>();
  const levels = Math.max(2, Math.round(Math.cbrt(options.maxColors)));
  const quantize = (value: number) => Math.round((value / 255) * (levels - 1)) * (255 / (levels - 1));
  for (let y = 0; y < raster.height; y += 1) {
    abortIfNeeded(signal);
    let x = 0;
    while (x < raster.width) {
      const offset = (y * raster.width + x) * 4;
      const alpha = raster.data[offset + 3];
      const luminance = raster.data[offset] * 0.2126 + raster.data[offset + 1] * 0.7152 + raster.data[offset + 2] * 0.0722;
      const fill = options.mode === 'monochrome'
        ? (alpha > 0 && luminance < options.threshold ? '#000000' : '')
        : (alpha > 0 ? `#${hex(quantize(raster.data[offset]))}${hex(quantize(raster.data[offset + 1]))}${hex(quantize(raster.data[offset + 2]))}` : '');
      if (!fill) { x += 1; continue; }
      let end = x + 1;
      while (end < raster.width) {
        const next = (y * raster.width + end) * 4;
        const nextLuminance = raster.data[next] * 0.2126 + raster.data[next + 1] * 0.7152 + raster.data[next + 2] * 0.0722;
        const nextFill = options.mode === 'monochrome'
          ? (raster.data[next + 3] > 0 && nextLuminance < options.threshold ? '#000000' : '')
          : (raster.data[next + 3] > 0 ? `#${hex(quantize(raster.data[next]))}${hex(quantize(raster.data[next + 1]))}${hex(quantize(raster.data[next + 2]))}` : '');
        if (nextFill !== fill) break;
        end += 1;
      }
      const paths = groups.get(fill) ?? [];
      paths.push(`M${x} ${y}H${end}V${y + 1}H${x}Z`);
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
  const corners = [0, raster.width - 1, (raster.height - 1) * raster.width, raster.width * raster.height - 1];
  const background = [0, 1, 2].map((channel) => corners.reduce((sum, pixel) => sum + raster.data[pixel * 4 + channel], 0) / corners.length);
  const output = new Uint8ClampedArray(raster.data);
  for (let y = 0; y < raster.height; y += 1) {
    abortIfNeeded(signal);
    for (let x = 0; x < raster.width; x += 1) {
      const offset = (y * raster.width + x) * 4;
      const distance = Math.hypot(output[offset] - background[0], output[offset + 1] - background[1], output[offset + 2] - background[2]);
      const factor = options.feather === 0 ? (distance <= options.threshold ? 0 : 1) : Math.max(0, Math.min(1, (distance - options.threshold) / options.feather));
      output[offset + 3] = clampByte(output[offset + 3] * factor);
    }
    onProgress?.(round(((y + 1) / raster.height) * 100, 0));
  }
  return { width: raster.width, height: raster.height, data: output };
}
