const FONT_ERROR = '字体文件无效或已损坏';

export type FontInspection = {
  family: string;
  style: string;
  unitsPerEm: number;
  glyphCount: number;
  names: {
    fullName?: string;
    postScriptName?: string;
  };
};

function escapeHtml(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;').replace(/'/gu, '&#39;');
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|\w+);/giu, (entity, code: string) => {
    if (code[0] === '#') {
      const radix = code[1]?.toLowerCase() === 'x' ? 16 : 10;
      const number = Number.parseInt(code.slice(radix === 16 ? 2 : 1), radix);
      const isUnicodeScalar = Number.isInteger(number) && number >= 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff);
      return isUnicodeScalar ? String.fromCodePoint(number) : '�';
    }
    return named[code.toLowerCase()] ?? entity;
  });
}

function safeUrl(value: string): string {
  const decoded = decodeEntities(value).trim();
  return /^(https?:|mailto:|\/|#)/iu.test(decoded) ? decoded : '#';
}

function renderInline(markdown: string): string {
  return escapeHtml(markdown)
    .replace(/`([^`]+)`/gu, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/gu, (_match, label: string, url: string) => `<a href="${escapeHtml(safeUrl(url))}">${label}</a>`)
    .replace(/\*\*([^*]+)\*\*/gu, '<strong>$1</strong>')
    .replace(/__([^_]+)__/gu, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/gu, '<em>$1</em>')
    .replace(/~~([^~]+)~~/gu, '<del>$1</del>');
}

export function markdownToHtml(markdown: string): string {
  const normalized = markdown.replace(/\r\n?/gu, '\n');
  const lines = normalized.split('\n');
  const output: string[] = [];
  let paragraph: string[] = [];
  let listOpen = false;
  let codeOpen = false;
  let codeLines: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length) output.push(`<p>${paragraph.map(renderInline).join('<br>')}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (listOpen) output.push('</ul>');
    listOpen = false;
  };

  for (const line of lines) {
    if (/^```/u.test(line)) {
      if (codeOpen) {
        output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
      } else {
        flushParagraph();
        closeList();
      }
      codeOpen = !codeOpen;
      continue;
    }
    if (codeOpen) {
      codeLines.push(line);
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/u);
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/u);
    if (heading) {
      flushParagraph();
      closeList();
      output.push(`<h${heading[1].length}>${renderInline(heading[2])}</h${heading[1].length}>`);
    } else if (bullet) {
      flushParagraph();
      if (!listOpen) output.push('<ul>');
      listOpen = true;
      output.push(`<li>${renderInline(bullet[1])}</li>`);
    } else if (!line.trim()) {
      flushParagraph();
      closeList();
    } else {
      closeList();
      paragraph.push(line);
    }
  }
  if (codeOpen) output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  flushParagraph();
  closeList();
  return output.join('\n');
}

export function sanitizeHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const output = new DOMParser().parseFromString('', 'text/html');
  const allowed = new Set(['a', 'article', 'b', 'blockquote', 'br', 'code', 'del', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'li', 'ol', 'p', 'pre', 'section', 'span', 'strong', 'ul']);
  const discardWithContent = new Set(['base', 'embed', 'iframe', 'link', 'math', 'meta', 'noscript', 'object', 'script', 'style', 'svg', 'template']);

  const copySafeNode = (node: Node, parent: Node): void => {
    if (node.nodeType === 3) {
      parent.appendChild(output.createTextNode(node.textContent ?? ''));
      return;
    }
    if (node.nodeType !== 1) return;
    const source = node as Element;
    const tagName = source.tagName.toLocaleLowerCase();
    if (discardWithContent.has(tagName)) return;
    if (!allowed.has(tagName)) {
      Array.from(source.childNodes).forEach((child) => copySafeNode(child, parent));
      return;
    }

    const clean = output.createElement(tagName);
    if (tagName === 'a') {
      const href = source.getAttribute('href');
      if (href !== null) clean.setAttribute('href', safeUrl(href));
      const title = source.getAttribute('title');
      if (title) clean.setAttribute('title', title);
    }
    Array.from(source.childNodes).forEach((child) => copySafeNode(child, clean));
    parent.appendChild(clean);
  };

  Array.from(parsed.body.childNodes).forEach((node) => copySafeNode(node, output.body));
  return output.body.innerHTML;
}

export function htmlToMarkdown(html: string): string {
  let value = sanitizeHtml(html);
  value = value
    .replace(/<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/giu, (_match, _quote: string, url: string, label: string) => `[${label.replace(/<[^>]+>/gu, '')}](${safeUrl(url)})`)
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/giu, (_match, level: string, content: string) => `${'#'.repeat(Number(level))} ${content}\n\n`)
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/giu, '**$2**')
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/giu, '*$2*')
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/giu, '`$1`')
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/giu, '- $1\n')
    .replace(/<br\s*\/?>/giu, '\n')
    .replace(/<\/(p|div|section|article|ul|ol|blockquote)>/giu, '\n\n')
    .replace(/<[^>]+>/gu, '');
  return decodeEntities(value)
    .replace(/[ \t]+\n/gu, '\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[^\n]*\n([\s\S]*?)```/gu, '$1')
    .replace(/^#{1,6}\s+/gmu, '')
    .replace(/^\s*[-*+]\s+/gmu, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1')
    .replace(/(\*\*|__|~~)(.*?)\1/gu, '$2')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/gu, '$1')
    .replace(/`([^`]+)`/gu, '$1')
    .trim();
}

function escapeLatex(value: string): string {
  const replacements: Record<string, string> = {
    '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#', '_': '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
  };
  return value.replace(/[\\&%$#_{}~^]/gu, (character) => replacements[character]);
}

export function plainTextToHtml(text: string): string {
  return text.trim().split(/\n[\t ]*\n/gu).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/gu, '<br>')}</p>`).join('\n');
}

function latexDocument(body: string): string {
  return `\\documentclass{article}\n\\usepackage[UTF8]{ctex}\n\\begin{document}\n${body}\n\\end{document}\n`;
}

export function plainTextToLatex(text: string): string {
  return latexDocument(text.trim().split(/\n[\t ]*\n/gu).map(escapeLatex).join('\n\n'));
}

export function markdownToLatex(markdown: string): string {
  const lines = markdown.replace(/\r\n?/gu, '\n').split('\n');
  const body = lines.map((line) => {
    const heading = line.match(/^(#{1,6})\s+(.+)$/u);
    if (heading) {
      const commands = ['section', 'subsection', 'subsubsection', 'paragraph', 'subparagraph', 'subparagraph'];
      return `\\${commands[heading[1].length - 1]}{${escapeLatex(markdownToPlainText(heading[2]))}}`;
    }
    return escapeLatex(markdownToPlainText(line));
  }).join('\n');
  return latexDocument(body);
}

type ZipEntry = { name: string; content: string };

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function createStoredZip(entries: ZipEntry[]): ArrayBuffer {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const content = encoder.encode(entry.content);
    const checksum = crc32(content);
    const localHeader = new Uint8Array(30);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0x0021, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, content.length, true);
    localView.setUint32(22, content.length, true);
    localView.setUint16(26, name.length, true);
    localView.setUint16(28, 0, true);
    localParts.push(localHeader, name, content);

    const centralHeader = new Uint8Array(46);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0x0021, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, content.length, true);
    centralView.setUint32(24, content.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, localOffset, true);
    centralParts.push(centralHeader, name);
    localOffset += localHeader.length + name.length + content.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralDirectory.length, true);
  endView.setUint32(16, localOffset, true);
  const bytes = concatBytes([...localParts, centralDirectory, end]);
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function docxDocumentXml(markdown: string): string {
  const paragraphs = markdownToPlainText(markdown).split(/\n[\t ]*\n/gu);
  const body = paragraphs.map((paragraph) => `<w:p><w:r><w:t xml:space="preserve">${escapeHtml(paragraph)}</w:t></w:r></w:p>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr /></w:body></w:document>`;
}

export function createDocx(markdown: string): Blob {
  const archive = createStoredZip([
    { name: '[Content_Types].xml', content: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
    { name: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
    { name: 'word/document.xml', content: docxDocumentXml(markdown) },
  ]);
  return new Blob([archive], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

export function createEpub(markdown: string): Blob {
  const title = escapeHtml(markdownToPlainText(markdown).split('\n')[0] || '本地电子书');
  const body = markdownToHtml(markdown).replace(/<br>/gu, '<br />');
  const archive = createStoredZip([
    { name: 'mimetype', content: 'application/epub+zip' },
    { name: 'META-INF/container.xml', content: '<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>' },
    { name: 'OEBPS/content.opf', content: `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">urn:uuid:local-document</dc:identifier><dc:title>${title}</dc:title><dc:language>zh-CN</dc:language><meta property="dcterms:modified">2026-08-01T00:00:00Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="content" href="content.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="content"/></spine></package>` },
    { name: 'OEBPS/nav.xhtml', content: `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="zh-CN"><head><title>目录</title></head><body><nav epub:type="toc"><h1>目录</h1><ol><li><a href="content.xhtml">${title}</a></li></ol></nav></body></html>` },
    { name: 'OEBPS/content.xhtml', content: `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" lang="zh-CN"><head><title>${title}</title></head><body>${body}</body></html>` },
  ]);
  return new Blob([archive], { type: 'application/epub+zip' });
}

function tag(view: DataView, offset: number): string {
  return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
}

function decodeFontName(bytes: Uint8Array, unicode: boolean): string {
  if (!unicode) return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('').replace(/\0/gu, '').trim();
  let result = '';
  for (let index = 0; index + 1 < bytes.length; index += 2) result += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
  return result.replace(/\0/gu, '').trim();
}

export function inspectFont(buffer: ArrayBuffer): FontInspection {
  try {
    if (buffer.byteLength < 12) throw new Error(FONT_ERROR);
    const view = new DataView(buffer);
    const signature = view.getUint32(0);
    if (![0x00010000, 0x4f54544f, 0x74727565, 0x74797031].includes(signature)) throw new Error(FONT_ERROR);
    const tableCount = view.getUint16(4);
    if (!tableCount || 12 + tableCount * 16 > buffer.byteLength) throw new Error(FONT_ERROR);
    const tables = new Map<string, { offset: number; length: number }>();
    for (let index = 0; index < tableCount; index += 1) {
      const record = 12 + index * 16;
      const offset = view.getUint32(record + 8);
      const length = view.getUint32(record + 12);
      if (offset > buffer.byteLength || length > buffer.byteLength - offset) throw new Error(FONT_ERROR);
      tables.set(tag(view, record), { offset, length });
    }
    const head = tables.get('head');
    const maxp = tables.get('maxp');
    const name = tables.get('name');
    if (!head || head.length < 20 || !maxp || maxp.length < 6) throw new Error(FONT_ERROR);

    const foundNames = new Map<number, string>();
    if (name && name.length >= 6) {
      const count = view.getUint16(name.offset + 2);
      const stringBase = name.offset + view.getUint16(name.offset + 4);
      if (6 + count * 12 > name.length) throw new Error(FONT_ERROR);
      for (let index = 0; index < count; index += 1) {
        const record = name.offset + 6 + index * 12;
        const platform = view.getUint16(record);
        const nameId = view.getUint16(record + 6);
        const length = view.getUint16(record + 8);
        const offset = stringBase + view.getUint16(record + 10);
        if (offset > buffer.byteLength || length > buffer.byteLength - offset) throw new Error(FONT_ERROR);
        const decoded = decodeFontName(new Uint8Array(buffer, offset, length), platform === 0 || platform === 3);
        if (decoded && !foundNames.has(nameId)) foundNames.set(nameId, decoded);
      }
    }

    return {
      family: foundNames.get(1) ?? '未知字体家族',
      style: foundNames.get(2) ?? '未知样式',
      unitsPerEm: view.getUint16(head.offset + 18),
      glyphCount: view.getUint16(maxp.offset + 4),
      names: { fullName: foundNames.get(4), postScriptName: foundNames.get(6) },
    };
  } catch {
    throw new Error(FONT_ERROR);
  }
}
