import { degrees, PDFDocument, type PDFEmbeddedPage, type PDFPage } from 'pdf-lib';

export { removeBackground, traceImage } from './advancedImage';
export type { BackgroundOptions, RasterData, TraceOptions } from './advancedImage';

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
    const rotation = ((page.getRotation().angle % 360) + 360) % 360;
    const swapsAxes = rotation === 90 || rotation === 270;
    const visualWidth = swapsAxes ? height : width;
    const visualHeight = swapsAxes ? width : height;
    return {
      number: index + 1,
      width: round(visualWidth, 2),
      height: round(visualHeight, 2),
      orientation: (visualWidth > visualHeight ? 'landscape' : 'portrait') as PageOrientation,
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

type EmbeddedSourcePage = { embedded: PDFEmbeddedPage; rotation: number };

function normalizedRightAngle(angle: number): 0 | 90 | 180 | 270 {
  const normalized = ((angle % 360) + 360) % 360;
  return (normalized === 90 || normalized === 180 || normalized === 270 ? normalized : 0);
}

export function embeddedPagePlacement(
  sourceWidth: number,
  sourceHeight: number,
  angle: number,
  placement: NUpPlacement,
): { x: number; y: number; width: number; height: number; rotation: 0 | 90 | 180 | 270 } {
  const rotation = normalizedRightAngle(angle);
  const swapsAxes = rotation === 90 || rotation === 270;
  const naturalWidth = swapsAxes ? sourceHeight : sourceWidth;
  const naturalHeight = swapsAxes ? sourceWidth : sourceHeight;
  const scale = Math.min(placement.width / naturalWidth, placement.height / naturalHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const visualWidth = swapsAxes ? height : width;
  const visualHeight = swapsAxes ? width : height;
  const left = placement.x + (placement.width - visualWidth) / 2;
  const bottom = placement.y + (placement.height - visualHeight) / 2;
  const origin = rotation === 90
    ? { x: left + visualWidth, y: bottom }
    : rotation === 180
      ? { x: left + visualWidth, y: bottom + visualHeight }
      : rotation === 270
        ? { x: left, y: bottom + visualHeight }
        : { x: left, y: bottom };
  return { x: round(origin.x), y: round(origin.y), width: round(width), height: round(height), rotation };
}

function drawEmbedded(target: PDFPage, source: EmbeddedSourcePage | undefined, placement: NUpPlacement, extraRotation = 0): void {
  if (!source) return;
  const transform = embeddedPagePlacement(source.embedded.width, source.embedded.height, source.rotation + extraRotation, placement);
  target.drawPage(source.embedded, { x: transform.x, y: transform.y, width: transform.width, height: transform.height, rotate: degrees(transform.rotation) });
}

async function embeddedPages(output: PDFDocument, source: PDFDocument): Promise<EmbeddedSourcePage[]> {
  source.getPages().forEach((page) => {
    if (!page.node.Contents()) page.drawRectangle({ x: 0, y: 0, width: 0.01, height: 0.01, opacity: 0 });
  });
  const embedded = await output.embedPdf(source, source.getPageIndices());
  return embedded.map((page, index) => ({ embedded: page, rotation: normalizedRightAngle(source.getPage(index).getRotation().angle) }));
}

export function impositionPlacementsForSide(
  layout: NUpResult,
  outputPageIndex: number,
  options: Pick<ImposeOptions, 'orientation' | 'duplex' | 'flip'>,
): NUpPlacement[] {
  if (options.duplex !== 'double' || outputPageIndex % 2 === 0) return layout.placements;
  const mirrorX = (options.orientation === 'portrait' && options.flip === 'long-edge')
    || (options.orientation === 'landscape' && options.flip === 'short-edge');
  return layout.placements.map((placement) => mirrorX
    ? { ...placement, x: round(layout.sheet.width - placement.x - placement.width) }
    : { ...placement, y: round(layout.sheet.height - placement.y - placement.height) });
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
      const backPlacements = impositionPlacementsForSide(layout, 1, { ...options, duplex: 'double' });
      drawEmbedded(back, sheet[2] ? embedded[sheet[2] - 1] : undefined, backPlacements[0]);
      drawEmbedded(back, sheet[3] ? embedded[sheet[3] - 1] : undefined, backPlacements[1]);
    });
  } else {
    const layout = nUpLayout(options);
    const perSheet = layout.placements.length;
    for (let start = 0, outputPageIndex = 0; start < embedded.length; start += perSheet, outputPageIndex += 1) {
      const page = output.addPage([layout.sheet.width, layout.sheet.height]);
      const placements = impositionPlacementsForSide(layout, outputPageIndex, options);
      embedded.slice(start, start + perSheet).forEach((sourcePage, index) => drawEmbedded(page, sourcePage, placements[index]));
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
  zineEightPageOrder().forEach((pageNumber, index) => drawEmbedded(page, embedded[pageNumber - 1], layout.placements[index], index < 4 ? 180 : 0));
  output.setTitle('8 页 Mini-Zine 本地拼版');
  output.setProducer('DelphiTools 本地 Zine 拼版');
  return output.save();
}

function utf8Size(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const BLOCKED_SVG_ELEMENTS = new Set([
  'script', 'foreignobject', 'iframe', 'object', 'embed',
  'animate', 'animatecolor', 'animatemotion', 'animatetransform', 'discard', 'mpath', 'set',
]);
const CSS_VALUE_ATTRIBUTES = new Set(['style', 'fill', 'stroke', 'filter', 'clip-path', 'mask', 'marker', 'marker-start', 'marker-mid', 'marker-end']);
const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';

function parserFailed(document: Document): boolean {
  return document.documentElement.localName.toLowerCase() === 'parsererror'
    || Array.from(document.getElementsByTagName('*')).some((element) => element.localName.toLowerCase() === 'parsererror');
}

function decodeCssEscapes(value: string): string | null {
  let decoded = '';
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '\\') {
      decoded += value[index];
      continue;
    }
    index += 1;
    if (index >= value.length || /[\n\r\f]/.test(value[index])) return null;
    if (/[0-9a-f]/i.test(value[index])) {
      let hex = '';
      while (index < value.length && hex.length < 6 && /[0-9a-f]/i.test(value[index])) {
        hex += value[index];
        index += 1;
      }
      const codePoint = Number.parseInt(hex, 16);
      if (codePoint === 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return null;
      decoded += String.fromCodePoint(codePoint);
      if (index < value.length && /[\t\n\r\f ]/.test(value[index])) {
        if (value[index] === '\r' && value[index + 1] === '\n') index += 1;
      } else {
        index -= 1;
      }
      continue;
    }
    decoded += value[index];
  }
  return decoded;
}

function unsafeCss(value: string): boolean {
  const decoded = value.includes('\\') ? decodeCssEscapes(value) : value;
  if (decoded === null) return true;
  const normalized = decoded.replace(/\/\*[\s\S]*?\*\//g, '').replace(/[\u0000-\u0020]+/g, '').toLowerCase();
  if (/@import|expression\(|javascript:|data:|https?:|(?:^|[({:,])\/\//i.test(normalized)) return true;
  const urls = Array.from(normalized.matchAll(/url\(([^)]*)\)/g));
  if (normalized.includes('url(') && urls.length === 0) return true;
  for (const match of urls) {
    const target = match[1].replace(/^['"]|['"]$/g, '').trim();
    if (!target.startsWith('#')) return true;
  }
  return false;
}

function removeComments(node: Node): void {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === 8) child.parentNode?.removeChild(child);
    else removeComments(child);
  });
}

export function optimiseSvg(source: string): { svg: string; beforeBytes: number; afterBytes: number; removedUnsafe: boolean } {
  const input = source.trim();
  if (!input) throw new Error('SVG 内容不能为空');
  if (/<!DOCTYPE|<!ENTITY/i.test(input)) throw new Error('不允许 XML 外部实体或文档类型声明');
  const parser = new DOMParser();
  const document = parser.parseFromString(input, 'image/svg+xml');
  if (parserFailed(document)) throw new Error('不是有效的 SVG 文件');
  const root = document.documentElement;
  if (root.localName.toLowerCase() !== 'svg' || (root.namespaceURI !== SVG_NAMESPACE && root.namespaceURI !== null)) throw new Error('不是有效的 SVG 文件');

  let removedUnsafe = false;
  removeComments(document);
  for (const element of Array.from(document.getElementsByTagName('*'))) {
    const localName = element.localName.toLowerCase();
    if (element !== root && (BLOCKED_SVG_ELEMENTS.has(localName) || (localName === 'metadata' && (element.namespaceURI === SVG_NAMESPACE || element.namespaceURI === null)))) {
      removedUnsafe ||= BLOCKED_SVG_ELEMENTS.has(localName);
      element.remove();
      continue;
    }
    if (localName === 'style' && unsafeCss(element.textContent ?? '')) {
      removedUnsafe = true;
      element.remove();
      continue;
    }
    for (const attribute of Array.from(element.attributes)) {
      const attributeName = attribute.localName.toLowerCase();
      const value = attribute.value.trim();
      const remove = attributeName.startsWith('on')
        || attributeName === 'src'
        || (attribute.namespaceURI === XML_NAMESPACE && attributeName === 'base' && value !== '')
        || (attributeName === 'href' && !value.startsWith('#'))
        || (CSS_VALUE_ATTRIBUTES.has(attributeName) && unsafeCss(value));
      if (remove) {
        removedUnsafe = true;
        element.removeAttributeNode(attribute);
      }
    }
  }
  if (!root.hasAttribute('xmlns')) root.setAttribute('xmlns', SVG_NAMESPACE);
  let svg = new XMLSerializer().serializeToString(root).replace(/>\s+</g, '><').trim();
  const verification = parser.parseFromString(svg, 'image/svg+xml');
  if (parserFailed(verification) || verification.documentElement.namespaceURI !== SVG_NAMESPACE || verification.documentElement.localName.toLowerCase() !== 'svg') throw new Error('不是有效的 SVG 文件');
  svg = new XMLSerializer().serializeToString(verification.documentElement).replace(/>\s+</g, '><').trim();
  return { svg, beforeBytes: utf8Size(source), afterBytes: utf8Size(svg), removedUnsafe };
}
